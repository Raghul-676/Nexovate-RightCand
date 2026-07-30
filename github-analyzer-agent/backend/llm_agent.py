"""
The ONLY module in the pipeline that calls an LLM. It is deliberately
constrained: the model never sees the repo name, star count, or anything
that could bias it toward guessing. It only sees the evidence bundle
assembled by evidence.py, plus the deterministic tech stack facts, and it
is required to cite which evidence path supports each claim.
"""
from __future__ import annotations
import json
import os
from typing import Optional

from groq import Groq

from models import Claim, EvidenceItem, TechStack, ComplexityScore

MODEL = "llama-3.3-70b-versatile"

# Fixed taxonomy — domain classification must pick from this list, not
# freehand text. Keeps the field filterable/queryable across every analyzed
# repo instead of being a one-off paraphrase of the project name.
DOMAIN_TAXONOMY = [
    "Web Development - Frontend",
    "Web Development - Backend",
    "Web Development - Full Stack",
    "Mobile Development",
    "ML/AI - Computer Vision",
    "ML/AI - NLP",
    "ML/AI - Predictive/Tabular",
    "Data Engineering",
    "DevOps/Cloud",
    "Cybersecurity",
    "IoT/Embedded",
    "Blockchain",
    "Game Development",
    "AR/VR",
    "Other",
]

SYSTEM_PROMPT = f"""You are a code analysis assistant. You will be given:
1. A set of deterministic facts about a code repository (languages, dependencies, complexity signals).
2. A set of evidence excerpts (file path + content) pulled directly from that repository.

Your job is to produce exactly two things, grounded ONLY in what is provided:

- "domain": classify the project using this fixed taxonomy — pick 1 or 2 categories
  that best fit (a project can span two, e.g. Full Stack + ML/AI). Do not invent new
  category names outside this list:
  {json.dumps(DOMAIN_TAXONOMY)}
  Also include a one-sentence free-text description of what makes it fit that category.

- "summary": a 2-3 sentence plain-language summary of what the project does.

STRICT RULES:
- Do not invent facts not present in the evidence or deterministic data.
- Do not assume anything from the repo name alone if the evidence doesn't support it.
- For each of "domain" and "summary", include a "cited_paths" list: the exact file paths (from
  the evidence provided) that justify your claim. If you cannot support a claim with a specific
  file, say so explicitly in the text (e.g. "insufficient evidence to determine X") rather than guessing.
- Output strict JSON only, matching this schema, no markdown fences, no commentary:
{{
  "domain": {{"categories": ["..."], "text": "...", "cited_paths": ["..."]}},
  "summary": {{"text": "...", "cited_paths": ["..."]}}
}}
"""


def _build_user_prompt(tech_stack: TechStack, complexity: ComplexityScore, evidence: list[EvidenceItem]) -> str:
    facts = {
        "languages": tech_stack.languages,
        "dependencies": tech_stack.dependencies,
        "frameworks_detected": tech_stack.frameworks_detected,
        "complexity_tier": complexity.tier,
        "complexity_signals": complexity.signals,
    }
    evidence_blocks = "\n\n".join(
        f"--- FILE: {e.path} (type: {e.kind}) ---\n{e.excerpt}" for e in evidence
    )
    return (
        f"DETERMINISTIC FACTS:\n{json.dumps(facts, indent=2)}\n\n"
        f"EVIDENCE FILES:\n{evidence_blocks if evidence_blocks else '(no evidence files could be retrieved)'}"
    )


def synthesize(tech_stack: TechStack, complexity: ComplexityScore, evidence: list[EvidenceItem]) -> tuple[Claim, Claim]:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not set. Add it to your .env file.")

    client = Groq(api_key=api_key)
    user_prompt = _build_user_prompt(tech_stack, complexity, evidence)

    response = client.chat.completions.create(
        model=MODEL,
        temperature=0.1,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content
    try:
        parsed = json.loads(raw)
        domain = parsed["domain"]
        summary = parsed["summary"]
    except (json.JSONDecodeError, KeyError):
        domain = {"categories": [], "text": "Could not confidently determine domain from available evidence.", "cited_paths": []}
        summary = {"text": "Could not generate a grounded summary from available evidence.", "cited_paths": []}

    domain_claim = Claim(
        text=domain.get("text", ""),
        cited_paths=domain.get("cited_paths", []),
        categories=domain.get("categories", []),
    )
    summary_claim = Claim(text=summary.get("text", ""), cited_paths=summary.get("cited_paths", []))
    return domain_claim, summary_claim
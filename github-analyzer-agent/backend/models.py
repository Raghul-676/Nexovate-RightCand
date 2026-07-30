"""
Data models shared across the pipeline.

Design principle: every field is tagged as either DETERMINISTIC (filled in
by parsers/APIs, never touched by the LLM) or LLM_GENERATED (filled in by
the grounded synthesis step, and required to carry a citation).
"""
from __future__ import annotations
from typing import Optional
from pydantic import BaseModel, Field


class RepoMeta(BaseModel):
    """DETERMINISTIC — straight from the GitHub API."""
    full_name: str
    description: Optional[str] = None
    stars: int = 0
    forks: int = 0
    default_branch: str = "main"
    size_kb: int = 0
    created_at: Optional[str] = None
    pushed_at: Optional[str] = None


class TechStack(BaseModel):
    """DETERMINISTIC — parsed from manifest files and the GitHub languages API."""
    languages: dict[str, float] = Field(default_factory=dict)  # language -> % of bytes
    dependencies: list[str] = Field(default_factory=list)      # from requirements.txt / package.json / etc.
    manifests_found: list[str] = Field(default_factory=list)   # which manifest files were actually located
    frameworks_detected: list[str] = Field(default_factory=list)  # simple keyword hits, e.g. "FastAPI", "React"


class ComplexityScore(BaseModel):
    """DETERMINISTIC — computed by a fixed weighted rubric, not by the LLM."""
    score: int  # 0-100
    tier: str   # "simple" | "moderate" | "complex" | "advanced"
    signals: dict[str, float]  # raw metric -> value, so the score is auditable
    rationale: str  # plain-language, template-generated from `signals` — no LLM


class EvidenceItem(BaseModel):
    """A single piece of retrieved evidence the LLM is allowed to reason over."""
    path: str
    kind: str        # "readme" | "entry_point" | "manifest" | "sample_file"
    excerpt: str      # truncated content actually shown to the LLM


class Claim(BaseModel):
    """LLM_GENERATED — every claim must cite the evidence it came from."""
    text: str
    cited_paths: list[str] = Field(default_factory=list)
    categories: list[str] = Field(default_factory=list)  # only populated for domain_claim
    supported: Optional[bool] = None  # filled in by the validator, not the LLM


class AnalysisReport(BaseModel):
    repo_url: str
    meta: RepoMeta
    tech_stack: TechStack
    complexity: ComplexityScore
    domain_claim: Claim
    summary_claim: Claim
    evidence_used: list[EvidenceItem]
    validation_notes: list[str] = Field(default_factory=list)
    low_confidence: bool = False

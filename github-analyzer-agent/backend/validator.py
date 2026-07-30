"""
Rule-based validator (no LLM). Confirms every claim's cited paths actually
exist in the evidence bundle that was shown to the model, and that any
domain categories chosen are from the fixed taxonomy (not invented).
"""
from __future__ import annotations
from models import Claim, EvidenceItem
from llm_agent import DOMAIN_TAXONOMY


def validate_claim(claim: Claim, evidence: list[EvidenceItem]) -> tuple[bool, str]:
    valid_paths = {e.path for e in evidence}
    notes = []
    ok = True

    if claim.categories:
        bad_categories = [c for c in claim.categories if c not in DOMAIN_TAXONOMY]
        if bad_categories:
            ok = False
            notes.append(f"Invalid domain categor(y/ies) not in taxonomy: {bad_categories}")

    if not claim.cited_paths:
        notes.append("No citation given (model may have flagged insufficient evidence).")
        return ok, "; ".join(notes) if notes else "OK"

    fake_citations = [p for p in claim.cited_paths if p not in valid_paths]
    if fake_citations:
        ok = False
        notes.append(f"Claim cites path(s) not present in evidence bundle: {fake_citations}")
    else:
        notes.append("Citations verified against evidence bundle.")

    return ok, "; ".join(notes)


def validate_report(domain_claim: Claim, summary_claim: Claim, evidence: list[EvidenceItem]) -> tuple[list[str], bool]:
    notes = []
    all_ok = True

    for label, claim in (("domain", domain_claim), ("summary", summary_claim)):
        ok, note = validate_claim(claim, evidence)
        claim.supported = ok
        notes.append(f"[{label}] {note}")
        if not ok:
            all_ok = False

    low_confidence = (not evidence) or (not domain_claim.cited_paths and not summary_claim.cited_paths)
    return notes, (not all_ok) or low_confidence
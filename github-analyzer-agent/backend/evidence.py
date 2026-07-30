"""
This is the "agentic decision" module: given the repo's shape (from the
tree listing), it decides WHICH files are worth pulling as evidence for
the LLM. Small repos get a full read; large repos get sampled across
top-level modules so we don't blow the context window or bias toward
whatever happened to be at the top of the tree.
"""
from __future__ import annotations
from models import EvidenceItem
from github_client import get_file_content
from extractors import CODE_FILE_EXTENSIONS

README_NAMES = {"readme.md", "readme.rst", "readme.txt", "readme"}
ENTRY_POINT_HINTS = {
    "main.py", "app.py", "manage.py", "server.py", "index.js", "index.ts",
    "app.js", "app.tsx", "main.go", "main.rs", "program.cs",
}
MAX_EVIDENCE_FILES = 8
EXCERPT_CHARS = 3000


def _find_readme(tree_paths: list[str]) -> str | None:
    candidates = [p for p in tree_paths if p.split("/")[-1].lower() in README_NAMES and p.count("/") == 0]
    return candidates[0] if candidates else None


def _find_entry_points(tree_paths: list[str]) -> list[str]:
    return [p for p in tree_paths if p.split("/")[-1] in ENTRY_POINT_HINTS]


def select_evidence_files(owner: str, repo: str, branch: str, tree: list[dict], manifests_found: list[str]) -> list[EvidenceItem]:
    blobs = [item["path"] for item in tree if item.get("type") == "blob"]
    code_files = [p for p in blobs if any(p.endswith(ext) for ext in CODE_FILE_EXTENSIONS)]
    top_level_dirs = sorted({p.split("/")[0] for p in blobs if "/" in p})

    chosen_paths: list[tuple[str, str]] = []  # (path, kind)

    readme = _find_readme(blobs)
    if readme:
        chosen_paths.append((readme, "readme"))

    for m in manifests_found[:2]:
        chosen_paths.append((m, "manifest"))

    entry_points = _find_entry_points(blobs)
    for ep in entry_points[:2]:
        chosen_paths.append((ep, "entry_point"))

    # DECISION POINT: simple repo (few top-level modules) -> read a few more
    # entry-adjacent files. Complex repo (many modules) -> sample one
    # representative file per module so no single module dominates the
    # evidence bundle.
    remaining_slots = MAX_EVIDENCE_FILES - len(chosen_paths)
    if remaining_slots > 0:
        if len(top_level_dirs) <= 2:
            extra = [p for p in code_files if (p, "sample_file") not in chosen_paths][:remaining_slots]
            chosen_paths += [(p, "sample_file") for p in extra]
        else:
            for d in top_level_dirs:
                if remaining_slots <= 0:
                    break
                candidates = [p for p in code_files if p.startswith(d + "/")]
                if candidates:
                    # Prefer the largest-looking (by path depth heuristic: shallowest first)
                    candidates.sort(key=lambda p: p.count("/"))
                    chosen_paths.append((candidates[0], "sample_file"))
                    remaining_slots -= 1

    evidence: list[EvidenceItem] = []
    for path, kind in chosen_paths:
        content = get_file_content(owner, repo, path, branch)
        if content is None:
            continue
        excerpt = content[:EXCERPT_CHARS]
        evidence.append(EvidenceItem(path=path, kind=kind, excerpt=excerpt))

    return evidence

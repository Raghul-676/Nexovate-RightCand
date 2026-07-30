# """
# Thin wrapper around the GitHub REST API. No LLM involvement here at all —
# this module only fetches raw ground-truth data.
# """
# from __future__ import annotations
# import base64
# import os
# import re
# from typing import Optional

# import requests

# GITHUB_API = "https://api.github.com"


# class GitHubClientError(Exception):
#     pass


# def _headers() -> dict:
#     token = os.getenv("GITHUB_TOKEN")
#     headers = {"Accept": "application/vnd.github+json"}
#     if token:
#         headers["Authorization"] = f"Bearer {token}"
#     return headers


# def parse_repo_url(url: str) -> tuple[str, str]:
#     """Extract (owner, repo) from a GitHub URL, tolerating trailing slashes/.git."""
#     match = re.search(r"github\.com[:/]+([^/]+)/([^/#?]+)", url.strip())
#     if not match:
#         raise GitHubClientError(f"Could not parse a GitHub owner/repo from: {url}")
#     owner, repo = match.group(1), match.group(2)
#     repo = repo.removesuffix(".git")
#     return owner, repo


# def get_repo_meta(owner: str, repo: str) -> dict:
#     resp = requests.get(f"{GITHUB_API}/repos/{owner}/{repo}", headers=_headers(), timeout=15)
#     if resp.status_code == 404:
#         raise GitHubClientError("Repo not found (private, deleted, or typo'd URL).")
#     resp.raise_for_status()
#     return resp.json()


# def get_languages(owner: str, repo: str) -> dict[str, int]:
#     resp = requests.get(f"{GITHUB_API}/repos/{owner}/{repo}/languages", headers=_headers(), timeout=15)
#     resp.raise_for_status()
#     return resp.json()


# def get_tree(owner: str, repo: str, branch: str) -> list[dict]:
#     resp = requests.get(
#         f"{GITHUB_API}/repos/{owner}/{repo}/git/trees/{branch}",
#         params={"recursive": "1"},
#         headers=_headers(),
#         timeout=20,
#     )
#     resp.raise_for_status()
#     data = resp.json()
#     if data.get("truncated"):
#         # Repo is huge — the tree got cut off by GitHub. Evidence retrieval
#         # downstream must be aware it's working with a partial listing.
#         pass
#     return data.get("tree", [])


# def get_file_content(owner: str, repo: str, path: str, branch: str, max_bytes: int = 20_000) -> Optional[str]:
#     """Fetch a single file's text content. Returns None if binary/missing/too large."""
#     resp = requests.get(
#         f"{GITHUB_API}/repos/{owner}/{repo}/contents/{path}",
#         params={"ref": branch},
#         headers=_headers(),
#         timeout=15,
#     )
#     if resp.status_code != 200:
#         return None
#     data = resp.json()
#     if data.get("encoding") != "base64" or "content" not in data:
#         return None
#     try:
#         raw = base64.b64decode(data["content"])
#     except Exception:
#         return None
#     if len(raw) > max_bytes:
#         raw = raw[:max_bytes]
#     try:
#         return raw.decode("utf-8", errors="replace")
#     except Exception:
#         return None


"""
Thin wrapper around the GitHub REST API. No LLM involvement here at all —
this module only fetches raw ground-truth data.
"""
from __future__ import annotations
import base64
import os
import re
from typing import Optional

import requests

GITHUB_API = "https://api.github.com"


class GitHubClientError(Exception):
    pass


def _headers() -> dict:
    token = os.getenv("GITHUB_TOKEN")
    headers = {"Accept": "application/vnd.github+json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


def parse_repo_url(url: str) -> tuple[str, str]:
    """Extract (owner, repo) from a GitHub URL, tolerating trailing slashes/.git."""
    match = re.search(r"github\.com[:/]+([^/]+)/([^/#?]+)", url.strip())
    if not match:
        raise GitHubClientError(f"Could not parse a GitHub owner/repo from: {url}")
    owner, repo = match.group(1), match.group(2)
    repo = repo.removesuffix(".git")
    return owner, repo


def _check_rate_limit(resp: requests.Response) -> None:
    if resp.status_code == 403 and resp.headers.get("X-RateLimit-Remaining") == "0":
        reset_ts = resp.headers.get("X-RateLimit-Reset")
        has_token = bool(os.getenv("GITHUB_TOKEN"))
        hint = (
            "This will reset soon, or add a GITHUB_TOKEN to your .env to raise the limit to 5000/hr."
            if not has_token
            else "Your GITHUB_TOKEN is set but you've still hit its limit — wait for the reset."
        )
        raise GitHubClientError(
            f"GitHub API rate limit exceeded (resets at unix time {reset_ts}). {hint}"
        )


def get_repo_meta(owner: str, repo: str) -> dict:
    resp = requests.get(f"{GITHUB_API}/repos/{owner}/{repo}", headers=_headers(), timeout=15)
    _check_rate_limit(resp)
    if resp.status_code == 404:
        raise GitHubClientError("Repo not found (private, deleted, or typo'd URL).")
    resp.raise_for_status()
    return resp.json()


def get_languages(owner: str, repo: str) -> dict[str, int]:
    resp = requests.get(f"{GITHUB_API}/repos/{owner}/{repo}/languages", headers=_headers(), timeout=15)
    _check_rate_limit(resp)
    resp.raise_for_status()
    return resp.json()


def get_tree(owner: str, repo: str, branch: str) -> list[dict]:
    resp = requests.get(
        f"{GITHUB_API}/repos/{owner}/{repo}/git/trees/{branch}",
        params={"recursive": "1"},
        headers=_headers(),
        timeout=20,
    )
    _check_rate_limit(resp)
    resp.raise_for_status()
    data = resp.json()
    if data.get("truncated"):
        # Repo is huge — the tree got cut off by GitHub. Evidence retrieval
        # downstream must be aware it's working with a partial listing.
        pass
    return data.get("tree", [])


def get_file_content(owner: str, repo: str, path: str, branch: str, max_bytes: int = 20_000) -> Optional[str]:
    """Fetch a single file's text content. Returns None if binary/missing/too large."""
    resp = requests.get(
        f"{GITHUB_API}/repos/{owner}/{repo}/contents/{path}",
        params={"ref": branch},
        headers=_headers(),
        timeout=15,
    )
    if resp.status_code != 200:
        return None
    data = resp.json()
    if data.get("encoding") != "base64" or "content" not in data:
        return None
    try:
        raw = base64.b64decode(data["content"])
    except Exception:
        return None
    if len(raw) > max_bytes:
        raw = raw[:max_bytes]
    try:
        return raw.decode("utf-8", errors="replace")
    except Exception:
        return None
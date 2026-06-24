import sys
import os
import json
import shutil

# Add github-analyzer root to path so we can import it directly
ANALYZER_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', '..', '..', 'github-analyzer')
)
if ANALYZER_PATH not in sys.path:
    sys.path.insert(0, ANALYZER_PATH)

from main import GitHubAnalyzer

_analyzer = None

def get_analyzer():
    global _analyzer
    if _analyzer is None:
        _analyzer = GitHubAnalyzer()
    return _analyzer


def analyse_repo(repo_url: str) -> dict:
    analyzer = get_analyzer()
    result = analyzer.analyze_github_repo(repo_url)

    # Clean up cloned folder after analysis
    clone_path = result.get("readme", "").replace("/AI_README.md", "").replace("\\AI_README.md", "")
    if clone_path and os.path.exists(clone_path):
        shutil.rmtree(clone_path, ignore_errors=True)

    # stack_breakdown comes from readme_generator._compute_stack_breakdown
    # We recompute it here from the analysis object since main.py doesn't return it directly
    from analyzer.readme_generator import ReadmeGenerator
    rg = ReadmeGenerator()
    # We need the analysis object — re-run only the parser part is expensive,
    # so we store stack in the readme generator and expose it via a helper
    # Instead, parse it from domains which are already returned
    stack = {name: round(pct * 100, 1) for name, pct in result.get("domains", [])}

    return {
        "project_name": result.get("project_name", "Unknown"),
        "complexity": result.get("complexity", "Unknown"),
        "stack_breakdown": json.dumps(stack),
        "summary": result.get("summary", ""),
    }

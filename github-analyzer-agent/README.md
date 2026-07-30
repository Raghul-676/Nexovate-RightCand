# GitHub Repo Analyzer Agent (standalone prototype)

Given a public GitHub repo URL, this produces a report covering domain, tech
stack, complexity tier, and a plain-language summary — with every LLM-generated
claim tagged to the exact file it was grounded in.

## Why it's built this way

Every fact is one of two kinds:

- **Deterministic** (`extractors.py`, `github_client.py`) — tech stack, language
  split, and complexity score are computed from the GitHub API and manifest
  parsing. No LLM ever touches these.
- **LLM-generated, but grounded** (`llm_agent.py`) — only the domain
  classification and the summary go through an LLM, and it is only ever shown
  real evidence files (`evidence.py` selects them), never the bare repo name.
  Every claim must cite the file path it came from (`validator.py` checks the
  citation is real).

See `backend/main.py` for the full pipeline sequence.

## Setup

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `.env`:
- `GROQ_API_KEY` — required. Get a free key at https://console.groq.com/keys
- `GITHUB_TOKEN` — optional but recommended (raises your GitHub API rate limit
  from 60/hr to 5000/hr). Create a token with no scopes at
  https://github.com/settings/tokens

Run it:

```bash
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173, paste a public repo URL (e.g.
`https://github.com/tiangolo/fastapi`), and hit analyze.

## Known v1 limitations (worth knowing before you demo this)

- Manifest parsing only handles `requirements.txt`, `Pipfile`, and
  `package.json` in depth — `pom.xml`, `Cargo.toml`, `go.mod` are detected as
  present but not parsed for dependency names yet (safer to say "found" than
  to mis-parse XML/TOML with a regex).
- Evidence retrieval samples up to 8 files. Very large monorepos will only get
  partial coverage — the `low_confidence` flag in the response tells you when
  this happened.
- No caching yet — every analysis re-fetches from GitHub. Fine for a demo,
  add Redis/SQLite caching before this goes into the main placement assistant.
- No retry-on-invalid-citation loop yet (the workflow diagram we discussed
  includes one) — right now an unsupported claim gets flagged with
  `supported: false` rather than triggering a second evidence-retrieval pass.
  That loop is the natural next feature to add.

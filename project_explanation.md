# Project Overview & Technical Explanation

This workspace is a student centralized evaluation, coding profile tracking, and AI-driven interview preparation ecosystem. It integrates two primary portals: **Talent Vellocity (SCES)** and the **AI Interview Preparation Assistant (Capstone)**.

---

## 🏗️ Architecture & Component Layout

```
github-analyzer/
├── start.ps1                                                            # Global PowerShell launch script
├── project_explanation.md                                               # Detailed project documentation
│
├── Talent Vellocity/                                                    # Main Student Evaluation Portal (SCES)
│   └── sces/
│       ├── backend/                                                     # FastAPI + SQLAlchemy Backend (Port 8000)
│       │   ├── app/
│       │   │   ├── routes/ (auth, profile, admin, projects)             # Controller/Router layer
│       │   │   ├── services/ (auth_service, coding_service, project_service) # Business logic & GitHub analysis
│       │   │   ├── models/ (models.py)                                  # Database schema definitions
│       │   │   └── database.py                                          # SQLite engine configuration
│       │   └── requirements.txt
│       └── frontend/                                                    # React 18 + Vite Frontend (Port 5173)
│
├── final-capstone-project-agentic-ai-interview-preparation-assistant/  # Capstone Interview Assistant
│   ├── api.py                                                           # Capstone FastAPI Backend (Port 8001)
│   ├── app.py                                                           # Alternative Streamlit App
│   ├── agents/ (resume, jd, gap, planner, question, evaluation, report) # Multi-Agent decision layer
│   └── frontend/                                                        # React 19 + Vite + Tailwind CSS Frontend (Port 5174)
│
└── github-analyzer-agent/                                               # Grounded GitHub Repo Analyzer Agent
    └── backend/                                                         # Core logic imported by Talent Vellocity
        ├── github_client.py                                             # GitHub REST API client (no local cloning)
        ├── extractors.py                                                # Deterministic tech stack & complexity parsers
        ├── evidence.py                                                  # Heuristic evidence file selector
        ├── llm_agent.py                                                 # Grounded taxonomy classifier (Groq / Llama 3.3)
        └── validator.py                                                 # Citation validator
```

---

## 🛠️ Technology Stack Breakdown

### 1. Backend Stack (Python-based)
*   **FastAPI:** High-performance, asynchronous web framework for building APIs. Used for both Talent Vellocity (port `8000`) and the Capstone project (port `8001`).
*   **SQLite & SQLAlchemy:** Lightweight relational database and ORM used in Talent Vellocity to manage user login credentials, profile links, and analyzed project records.
*   **Groq SDK (Llama 3.3 70B Versatile):** Serves as the AI reasoning engine. Used to synthesize repo domain classifications (against a fixed taxonomy) and generate interview questions, answers evaluations, and final candidate scorecards.
*   **python-dotenv:** Manages credentials (`GROQ_API_KEY`, `GITHUB_TOKEN`) safely across different root directories.
*   **Requests & HTTPX:** Handles outbound HTTP calls to third-party APIs (GitHub REST API, LeetCode/Codeforces stats).
*   **PyPDF:** Extracted text contents from uploaded candidate Resumes and Job Descriptions for gap analyses.

---

### 💻 Frontend Architecture & Styling (Specialized Details)

The workspace hosts two modern Vite-powered React frontends configured to run concurrently without conflict:

#### A. Talent Vellocity Student Portal (`http://localhost:5173`)
*   **React 18 & Vite:** Lightning-fast HMR and building pipeline.
*   **Vanilla CSS Design System (`index.css`):** Custom stylesheets employing custom HSL color variables, modern glassmorphism (glass cards), dark mode aesthetics, and responsive grid layouts.
*   **React Router DOM:** Client-side routing for seamless page navigation (`/login`, `/signup`, `/my-profile`, `/admin/dashboard`).
*   **Pure SVG Visualizations:**
    *   **Radar Chart Component:** A pure mathematical SVG polygon overlay used to plot user topic capabilities from coding platforms, avoiding heavy canvas library dependencies.
    *   **Consistency Ring Component:** A progress indicator constructed using SVG stroke dash offset logic to represent recent active coding days.
*   **Stats API Integration:** Polls stats from LeetCode, Codeforces, and GitHub on-demand, updating UI states reactively.

#### B. AI Interview Prep Assistant (`http://localhost:5174`)
*   **React 19 & Vite:** Leverages React's latest engine features for component building.
*   **Tailwind CSS (Vite compiler plugin):** Modern CSS utility classes for styling components, ensuring high-fidelity layouts, dark-slate visual theme, and spacing grids.
*   **Framer Motion:** High-fidelity animations including:
    *   `<AnimatePresence>` wrapper for smooth entry/exit transitions of notifications and dropdown elements.
    *   Slide-over panels for the mobile menu.
    *   Progressive transitions between candidate intake, chat assessment, and scorecard presentation.
*   **Lucide React:** Iconography library mapping metrics, upload controls, warning statuses, and action buttons.
*   **Recharts Integration:** Responsive dashboard visualization plotting:
    *   Skill metrics using `<RadarChart>` and `<PolarGrid>`.
    *   Assessment timelines and matching rates using `<AreaChart>` and `<BarChart>`.

---

## ⚡ Integration Features & Navigation

We established cross-navigation to make both projects operate as a single coherent platform:

1.  **Talent Vellocity to Capstone:** Students clicking the **🎯 AI Interview Prep** button on their profile navbar are redirected to `http://localhost:5174`.
2.  **Capstone back to Talent Vellocity:** Students can click **← Back to Profile** (on landing) or **← Exit to Dashboard** (during active sessions) to return to `http://localhost:5173/my-profile`.
3.  **Port Allocation Routing:**
    *   Talent Vellocity Backend: `http://localhost:8000`
    *   Talent Vellocity Frontend: `http://localhost:5173`
    *   Capstone Backend: `http://localhost:8001`
    *   Capstone Frontend: `http://localhost:5174`

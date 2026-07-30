# RightCand & SCES: Centralized Evaluation and Agentic Interview Assistant

This project is a complete Student Centralized Evaluation System (SCES) featuring a deterministic GitHub Repository Analyzer engine and an embedded, sequential Multi-Agent AI Interview Preparation Assistant. The platform evaluates students' practical technical skills across competitive coding platforms and repository footprints, while providing simulating, job-contextual AI technical interviews.

---

## 📂 System Project Structure

```
github-analyzer/
├── Talent Vellocity/sces/               # Primary Student Centralized Evaluation System
│   ├── frontend/                        # React + Vite Glassmorphic Dashboard UI
│   │   ├── src/pages/Login.jsx          # Auth screen (Role selection: Student or Admin)
│   │   ├── src/pages/MyProfile.jsx      # Student linked accounts & stats view
│   │   ├── src/pages/ProjectAnalysis.jsx # Student repository list & complexity analysis panel
│   │   └── src/pages/AdminDashboard.jsx # Admin panel (Percentile tuner, filters & explainability)
│   └── backend/                         # FastAPI Backend API
│       ├── app/models/models.py         # SQLAlchemy Database Schemas
│       ├── app/routes/admin.py          # Leaderboard ranking, weights & stats endpoints
│       └── app/routes/projects.py       # GitHub repository analysis & domain score pipeline
│
├── github-analyzer-agent/               # GitHub Analyzer Pipeline Engine
│   └── backend/                         # Deterministic facts extractor & LLM summarizer
│       ├── extractors.py                # Repo folder structures & dependencies analyzer
│       ├── evidence.py                  # Code file snippets retrieval helper
│       └── llm_agent.py                 # Grounded classification LLM interface
│
└── final-capstone-project-agentic-ai... # AI Interview Preparation Assistant
    ├── agents/                          # Multi-Agent Sequential Pipeline
    ├── frontend/                        # React Interview Simulator UI
    └── api.py                           # Fastapi endpoint for interview coordinator loop
```

---

## 🤖 AI Agents Inventory

The system is powered by **9 autonomous AI Agents** mapped across two primary subsystems.

### 🔍 Subsystem A: GitHub Repo Analyzer Pipeline
* **Folder Location**: `github-analyzer-agent/backend/`

#### 1. Grounded Taxonomy Classifier Agent
* **Source Script**: `llm_agent.py`
* **Purpose**: Classifies a student's project codebase into 1–2 target domain categories (e.g., *ML/AI - Computer Vision*, *Web Development - Full Stack*) out of a fixed taxonomy of 15 domains.
* **Mechanism**: Processes deterministic metadata (languages, frameworks, dependency manifests) and scans sampling code blocks from evidence files. It drafts a structured JSON summary grounded strictly in source code, compiling citations to justify its reasoning.

---

### 🎙️ Subsystem B: AI Interview Preparation Assistant
* **Folder Location**: `final-capstone-project-agentic-ai-interview-preparation-assistant/agents/`

#### 2. Resume Agent
* **Source Script**: `resume_agent.py`
* **Purpose**: Extracts and structures candidate profile details.
* **Mechanism**: Reads the student's CV text (PDF/TXT), parses credentials, lists stated technologies, identifies target roles, and outputs clean JSON profile parameters.

#### 3. JD Agent
* **Source Script**: `jd_agent.py`
* **Purpose**: Parses external Job Descriptions.
* **Mechanism**: Analyzes required skill stacks, requested experience levels, and primary expectations from a given target Job Description text block.

#### 4. Gap Agent
* **Source Script**: `gap_agent.py`
* **Purpose**: Identifies missing capabilities and measures skill gaps.
* **Mechanism**: Maps the candidate profile (from the Resume Agent) against the job requirement metadata (from the JD Agent). It returns a list of target matches, partial matches, and complete gaps.

#### 5. Planner Agent
* **Source Script**: `planner_agent.py`
* **Purpose**: Schedules a customized 10-slot questionnaire guide.
* **Mechanism**: Distributes question slots dynamically across the candidate's verified projects, matching skills, and identified skill gaps to outline a tailored interview structure.

#### 6. Question Generator Agent
* **Source Script**: `question_generator_agent.py`
* **Purpose**: Drafts contextual technical interview questions.
* **Mechanism**: Consumes the interview roadmap (from the Planner Agent) and generates targeted, project-specific coding/system-design questions grounded in the candidate's real portfolio.

#### 7. Interview Agent
* **Source Script**: `interview_agent.py`
* **Purpose**: Holds the interactive voice-and-text conversation loop.
* **Mechanism**: Serves as the active conversational backend for the frontend interview simulator. It evaluates user replies, dynamically guides them through the 10 planned slots, and manages transitions.

#### 8. Evaluation Agent
* **Source Script**: `evaluation_agent.py`
* **Purpose**: Grades candidate responses during the interview.
* **Mechanism**: Evaluates candidate answers for coding depth, logical precision, and communication clarity to output granular performance logs.

#### 9. Report Agent
* **Source Script**: `report_agent.py`
* **Purpose**: Compiles the final candidate scorecard.
* **Mechanism**: Synthesizes the dialogue transcript, metrics scores, and gap mappings into a final evaluation report detailing overall candidate fit.

---

## 📈 Leaderboard Algorithm Overview (No-LLM Deterministic Math)

The student rankings displayed in the **Admin Dashboard** are computed dynamically using a deterministic, cohort-relative mathematical engine:

*   **Trust Multiplier**: Scaled ratings from LeetCode/Codeforces depending on contest history length (cap at 15 contests).
*   **Percentile Normalization**: Scores are converted to percentiles based on standard competition index rankings relative to all registered student records:
    $$\text{Percentile} = \left(1 - \frac{\text{Rank}}{\text{Cohort Total}}\right) \times 100$$
*   **Recency Decay**: Automatically applies an activity-based exponential decay factor using the student's last active timestamp and the admin's chosen half-life (default 90 days).
*   **Adjustable Combining Weights**: Admins can use sliders to adjust the balance between **Competitive Coding** and **Project Complexity** live on the fly. Clicking a student row opens an explainability drawer detailing the exact math behind their rank.

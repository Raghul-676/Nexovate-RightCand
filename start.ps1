# Get the directory of this script (workspace root)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Talent Vellocity Backend (Hidden Background Process)
$BackendCwd = Join-Path $ScriptDir "Talent Vellocity\sces\backend"
$BackendExec = Join-Path $BackendCwd "venv\Scripts\uvicorn.exe"
Start-Process powershell -ArgumentList "-Command", "cd '$BackendCwd'; & '$BackendExec' app.main:app --port 8000 --reload" -WindowStyle Hidden

# 2. Talent Vellocity Frontend (Hidden Background Process)
$FrontendCwd = Join-Path $ScriptDir "Talent Vellocity\sces\frontend"
Start-Process powershell -ArgumentList "-Command", "cd '$FrontendCwd'; npm run dev" -WindowStyle Hidden

# 3. Capstone Interview Prep Backend (Hidden Background Process)
$CapstoneBackendCwd = Join-Path $ScriptDir "final-capstone-project-agentic-ai-interview-preparation-assistant"
$CapstoneBackendExec = Join-Path $ScriptDir "Talent Vellocity\sces\backend\venv\Scripts\uvicorn.exe"
Start-Process powershell -ArgumentList "-Command", "cd '$CapstoneBackendCwd'; & '$CapstoneBackendExec' api:app --port 8001 --reload" -WindowStyle Hidden

# 4. Capstone Interview Prep Frontend (Hidden Background Process)
$CapstoneFrontendCwd = Join-Path $ScriptDir "final-capstone-project-agentic-ai-interview-preparation-assistant\frontend"
Start-Process powershell -ArgumentList "-Command", "cd '$CapstoneFrontendCwd'; npm run dev" -WindowStyle Hidden

# Output the main page link as requested by the user
Write-Host "main page : -http://localhost:5173" -ForegroundColor Green

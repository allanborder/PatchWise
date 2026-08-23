$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backend = Join-Path $root "backend"
$frontend = Join-Path $root "frontend"

Write-Host "Starting PatchWise backend and frontend..."

$backendProc = Start-Process -FilePath "powershell" -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$backend'; if (-not (Test-Path '.venv')) { python -m venv .venv }; . .\\.venv\\Scripts\\Activate.ps1; pip install -r requirements.txt; python -m uvicorn app.main:app --reload --port 8000"
) -PassThru -WorkingDirectory $root

Start-Sleep -Seconds 5

$frontendProc = Start-Process -FilePath "powershell" -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$frontend'; npm install; npm run dev"
) -PassThru -WorkingDirectory $root

Write-Host "Backend: http://localhost:8000"
Write-Host "Frontend: http://localhost:5175"
Write-Host "Backend PID: $($backendProc.Id)"
Write-Host "Frontend PID: $($frontendProc.Id)"

# ============================================================
#  Snabb Dev Launcher — PowerShell
#  Usage: Right-click → Run with PowerShell
# ============================================================

$Root    = "H:\Claude Workspace\Major Project\snabb"
$Backend = "$Root\backend"
$Web     = "$Root\web"
$Mobile  = "$Root\mobile"

function Write-Banner {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host "   SNABB DEV LAUNCHER" -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host ""
}

Write-Banner

# ── 1. BACKEND ──────────────────────────────────────────────
Write-Host "[1/3] Starting Backend (FastAPI → http://localhost:8000)" -ForegroundColor Yellow
Start-Process "cmd.exe" -ArgumentList "/k", "cd /d `"$Backend`" && call venv\Scripts\activate.bat && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000" -WindowStyle Normal

Start-Sleep -Seconds 3

# ── 2. WEB APP ──────────────────────────────────────────────
Write-Host "[2/3] Starting Web App (Next.js → http://localhost:3000)" -ForegroundColor Yellow
Start-Process "cmd.exe" -ArgumentList "/k", "cd /d `"$Web`" && npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 2

# ── 3. MOBILE ───────────────────────────────────────────────
Write-Host "[3/3] Starting Mobile App (Expo → scan QR code)" -ForegroundColor Yellow
Start-Process "cmd.exe" -ArgumentList "/k", "cd /d `"$Mobile`" && npx expo start" -WindowStyle Normal

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  All services launched in separate windows!" -ForegroundColor Green
Write-Host ""
Write-Host "  Backend  →  http://localhost:8000" -ForegroundColor White
Write-Host "  API Docs →  http://localhost:8000/docs" -ForegroundColor White
Write-Host "  Web App  →  http://localhost:3000" -ForegroundColor White
Write-Host "  Mobile   →  Scan the QR code in the Expo window" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Press Enter to exit this launcher (services keep running)..." -ForegroundColor Gray
Read-Host

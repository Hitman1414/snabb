@echo off
setlocal

title Snabb Dev Launcher
color 0A
cls

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..") do set "ROOT=%%~fI\"
set "BACKEND=%ROOT%backend"
set "WEB=%ROOT%web"
set "MOBILE=%ROOT%mobile"
set "BACKEND_PORT=8001"
set "LOCAL_API_URL=http://localhost:%BACKEND_PORT%"
set "LOCAL_DATABASE_URL=sqlite:///C:/Users/prate/.codex/memories/snabb_dev.db"
set "LAN_IP="
for /f "tokens=2 delims=:" %%A in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    if not defined LAN_IP set "LAN_IP=%%A"
)
set "LAN_IP=%LAN_IP: =%"
if defined LAN_IP (
    set "LAN_API_URL=http://%LAN_IP%:%BACKEND_PORT%"
) else (
    set "LAN_API_URL=%LOCAL_API_URL%"
)

echo ============================================================
echo   SNABB DEV LAUNCHER
echo   Project: %ROOT%
echo ============================================================
echo.

if not exist "%BACKEND%\venv\Scripts\python.exe" (
    echo ERROR: Python venv not found at:
    echo   %BACKEND%\venv
    echo.
    echo Run:
    echo   cd /d "%BACKEND%"
    echo   python -m venv venv
    echo   venv\Scripts\python.exe -m pip install -r requirements.txt
    pause
    exit /b 1
)

if not exist "%WEB%\node_modules\" (
    echo ERROR: Web dependencies are not installed.
    echo Run: cd /d "%WEB%" ^&^& npm install
    pause
    exit /b 1
)

if not exist "%MOBILE%\node_modules\" (
    echo ERROR: Mobile dependencies are not installed.
    echo Run: cd /d "%MOBILE%" ^&^& npm install
    pause
    exit /b 1
)

if not exist "%BACKEND%\.env" (
    if exist "%BACKEND%\.env.example" (
        echo Creating backend .env from .env.example...
        copy "%BACKEND%\.env.example" "%BACKEND%\.env" >nul
        echo.
    )
)

if /i "%~1"=="--check" (
    echo Launcher checks passed.
    exit /b 0
)

echo Applying backend database migrations...
pushd "%BACKEND%"
set "DATABASE_URL=%LOCAL_DATABASE_URL%"
venv\Scripts\python.exe -m alembic -c alembic.ini upgrade head
if errorlevel 1 (
    popd
    echo ERROR: Backend database migration failed.
    pause
    exit /b 1
)
venv\Scripts\python.exe create_snabb_user.py
if errorlevel 1 (
    popd
    echo ERROR: Failed to create local dev user.
    pause
    exit /b 1
)
popd
echo.

echo [1/3] Starting Backend...
start "Snabb Backend" /d "%BACKEND%" cmd /k "set DATABASE_URL=%LOCAL_DATABASE_URL%&& venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port %BACKEND_PORT%"

timeout /t 3 /nobreak >nul

echo [2/3] Starting Web App...
start "Snabb Web" /d "%WEB%" cmd /k "npm run dev"

timeout /t 2 /nobreak >nul

echo [3/3] Starting Mobile App...
start "Snabb Mobile" /d "%MOBILE%" cmd /k "set EXPO_PUBLIC_API_URL=%LAN_API_URL%&& npm run start -- --port 8081"

echo.
echo Backend:  http://localhost:%BACKEND_PORT%
echo API Docs: http://localhost:%BACKEND_PORT%/docs
echo Web App:  http://localhost:3000
echo Mobile:   Expo window on port 8081
echo.
pause

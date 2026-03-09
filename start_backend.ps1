# Add Firewall Rule (Requires Admin, will fail silently if not)
New-NetFirewallRule -DisplayName "Snabb Backend" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue

# Start Backend
cd "H:\Coding\Agent WS\snabb-mobile\backend"
.\venv\Scripts\Activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

@echo off
REM Start the EduSaas demo: reset the demo roster, then serve the app on this PC and the local Wi-Fi.
cd /d "%~dp0backend"
python -m pip install -q -r requirements.txt
python manage.py migrate -v 0
REM Build the web app (React, served at /) when Node.js is installed; otherwise the last build in web\dist is served.
where npm >nul 2>nul
if %errorlevel%==0 (
  pushd "%~dp0web"
  if not exist node_modules call npm install --no-audit --no-fund
  call npm run build
  popd
) else (
  echo Node.js not found: serving the last build in web\dist. Install Node.js 20+ to rebuild the web app.
)
if "%1"=="--keep" goto serve
python manage.py seed_demo --admin-password demo-admin-2026
:serve
echo.
echo Open http://localhost:8000 on this PC, or http://YOUR-PC-IP:8000 on a phone on the same Wi-Fi.
echo Admin panel: http://localhost:8000/admin  (phone +923999990000, password demo-admin-2026)
echo Press Ctrl+C to stop.
python manage.py runserver 0.0.0.0:8000 --insecure

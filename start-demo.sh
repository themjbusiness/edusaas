#!/usr/bin/env sh
# Start the EduSaas demo: reset the demo roster, then serve on this machine and the local Wi-Fi.
# Use --keep to keep existing demo data instead of resetting it.
set -e
cd "$(dirname "$0")/backend"
python -m pip install -q -r requirements.txt
python manage.py migrate -v 0
# Build the web app (React, served at /) when Node.js is installed; otherwise the last build in web/dist is served.
if command -v npm >/dev/null 2>&1; then
  (cd ../web && { [ -d node_modules ] || npm install --no-audit --no-fund; } && npm run build)
else
  echo "Node.js not found: serving the last build in web/dist. Install Node.js 20+ to rebuild the web app."
fi
[ "$1" = "--keep" ] || python manage.py seed_demo --admin-password demo-admin-2026
echo "Open http://localhost:8000 (or http://<this-computer-ip>:8000 from a phone on the same Wi-Fi)."
exec python manage.py runserver 0.0.0.0:8000 --insecure

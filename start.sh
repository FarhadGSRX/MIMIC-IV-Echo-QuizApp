#!/usr/bin/env bash
# Start script for MIMIC-IV Echo Quiz App (macOS/Linux)

PORT=8000

if ! command -v python3 &>/dev/null && ! command -v python &>/dev/null; then
    echo "Python was not found on your system."
    echo "On macOS, install via: brew install python"
    echo "Or download from https://www.python.org/"
    exit 1
fi

# Prefer python3 (macOS default), fall back to python
PYTHON=$(command -v python3 || command -v python)

echo "Starting the web application on http://localhost:$PORT ..."

# Open browser after a short delay (gives server time to start)
(sleep 1 && open "http://localhost:$PORT" 2>/dev/null || xdg-open "http://localhost:$PORT" 2>/dev/null) &

cd "$(dirname "$0")/public" || { echo "Could not find public/ directory"; exit 1; }
"$PYTHON" -m http.server "$PORT"

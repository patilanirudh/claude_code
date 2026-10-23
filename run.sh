#!/usr/bin/env bash
# RiskPulse workshop console launcher.
# Deliberately dependency-free (stdlib Python only) so it runs on a bare VM
# before Node, Docker, or anything else in the stack has been installed.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT="${PORT:-8787}"

PYTHON_BIN=""
for candidate in python3 python; do
  if command -v "$candidate" >/dev/null 2>&1; then
    PYTHON_BIN="$candidate"
    break
  fi
done

if [ -z "$PYTHON_BIN" ]; then
  echo "ERROR: no python3/python found on this machine." >&2
  echo "The workshop console needs Python 3 to serve its UI. Install it and re-run ./run.sh" >&2
  exit 1
fi

echo "== RiskPulse workshop console =="
echo "Using: $($PYTHON_BIN --version 2>&1)"
echo ""
echo "-- environment check --"
"$PYTHON_BIN" "$ROOT_DIR/scripts/env_check.py" > /dev/null || echo "(environment check hit an issue, continuing anyway)"
echo "(full results shown in the UI's Environment Readiness panel)"

URL="http://localhost:${PORT}"
echo ""
echo "Starting UI server on ${URL}"
echo "On a remote VM: forward port ${PORT}, or browse to http://<vm-ip>:${PORT}"
echo "Press Ctrl+C to stop."
echo ""

open_browser() {
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$URL" >/dev/null 2>&1 &
  elif command -v open >/dev/null 2>&1; then
    open "$URL" >/dev/null 2>&1 &
  elif command -v cmd.exe >/dev/null 2>&1; then
    cmd.exe /c start "$URL" >/dev/null 2>&1 &
  fi
}

( sleep 1 && open_browser ) >/dev/null 2>&1 &

cd "$ROOT_DIR/ui"
exec "$PYTHON_BIN" -m http.server "$PORT" --bind 0.0.0.0

#!/usr/bin/env bash
# Helper: stop any process listening on a port and run the API
# Usage: ./scripts/start-api.sh [port]

set -eu
PORT=${1:-5200}
PROJ_DIR="$(cd "$(dirname "$0")/.." && pwd)/EvidenAuctionHouseAPI"

echo "Ensure API project dir: $PROJ_DIR"

# find any PIDs listening on the port
PIDS=$(lsof -t -iTCP:${PORT} -sTCP:LISTEN || true)
if [ -n "$PIDS" ]; then
  echo "Found process(es) listening on port ${PORT}: $PIDS"
  echo "Killing them..."
  # try graceful then force
  for pid in $PIDS; do
    kill $pid 2>/dev/null || true
  done
  sleep 1
  # ensure dead
  PIDS2=$(lsof -t -iTCP:${PORT} -sTCP:LISTEN || true)
  if [ -n "$PIDS2" ]; then
    echo "Still processes: $PIDS2 - sending SIGKILL"
    for pid in $PIDS2; do
      kill -9 $pid 2>/dev/null || true
    done
    sleep 1
  fi
fi

# Run the API in foreground so user can see logs
export ASPNETCORE_URLS="http://127.0.0.1:${PORT}"
cd "$PROJ_DIR"

echo "Starting API on http://127.0.0.1:${PORT}"
exec dotnet run --urls "http://127.0.0.1:${PORT}"

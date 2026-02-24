#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="${ROOT_DIR}/../Bc/project-y-backend"

port_in_use() {
  local port="$1"
  python - "$port" <<'PY'
import socket
import sys

port = int(sys.argv[1])
with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
    s.settimeout(0.2)
    in_use = s.connect_ex(("127.0.0.1", port)) == 0
    sys.exit(0 if in_use else 1)
PY
}

free_port() {
  python - <<'PY'
import socket
with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
    s.bind(("127.0.0.1", 0))
    print(s.getsockname()[1])
PY
}

BACKEND_PORT="${E2E_BACKEND_PORT:-8010}"
FRONTEND_PORT="${E2E_PORT:-3101}"

if port_in_use "${BACKEND_PORT}"; then
  BACKEND_PORT="$(free_port)"
  echo "E2E_BACKEND_PORT is busy; using ${BACKEND_PORT}"
fi

if port_in_use "${FRONTEND_PORT}"; then
  FRONTEND_PORT="$(free_port)"
  echo "E2E_PORT is busy; using ${FRONTEND_PORT}"
fi

BASE_ALLOWED_ORIGINS="${CORS_ALLOWED_ORIGINS:-http://127.0.0.1:3000,http://localhost:3000,http://127.0.0.1:3100,http://localhost:3100,http://127.0.0.1:3101,http://localhost:3101}"
DYNAMIC_ALLOWED_ORIGINS="http://127.0.0.1:${FRONTEND_PORT},http://localhost:${FRONTEND_PORT}"
E2E_CORS_ALLOWED_ORIGINS="${BASE_ALLOWED_ORIGINS},${DYNAMIC_ALLOWED_ORIGINS}"
E2E_CSRF_TRUSTED_ORIGINS="${CSRF_TRUSTED_ORIGINS:-${BASE_ALLOWED_ORIGINS}},${DYNAMIC_ALLOWED_ORIGINS}"

cd "${BACKEND_DIR}"
source .venv/bin/activate
python manage.py migrate --noinput >/dev/null
CORS_ALLOWED_ORIGINS="${E2E_CORS_ALLOWED_ORIGINS}" CSRF_TRUSTED_ORIGINS="${E2E_CSRF_TRUSTED_ORIGINS}" \
  python manage.py runserver "127.0.0.1:${BACKEND_PORT}" >/tmp/projecty-backend-e2e.log 2>&1 &
BACK_PID=$!
trap 'kill $BACK_PID 2>/dev/null || true' EXIT

for _ in {1..60}; do
  if curl -fsS "http://127.0.0.1:${BACKEND_PORT}/api/v1/status" >/dev/null; then
    break
  fi
  sleep 0.5
done
curl -fsS "http://127.0.0.1:${BACKEND_PORT}/api/v1/status" >/dev/null

cd "${ROOT_DIR}"
rm -f .next/dev/lock
E2E_PORT="${FRONTEND_PORT}" E2E_API_BASE="http://127.0.0.1:${BACKEND_PORT}/api/v1" playwright test e2e/backend.real.spec.ts

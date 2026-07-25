#!/usr/bin/env bash
# Run on the server from the project root after `git pull`.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Backend: install, build, migrate"
cd backend
npm ci
npm run build
npx prisma migrate deploy
cd "$ROOT"

echo "==> Frontend: ensure production API URL in .env"
if ! grep -q 'VITE_API_URL=https://social-link-saver.kareemsoft.org/api' .env 2>/dev/null; then
  echo "WARNING: Set VITE_API_URL=https://social-link-saver.kareemsoft.org/api in $ROOT/.env before building"
fi

echo "==> Frontend: install & build (use lockfile — do not upgrade Vite on server)"
npm ci
npm run build

echo "==> Restart backend (PM2)"
if command -v pm2 >/dev/null 2>&1; then
  pm2 restart all || pm2 restart social-link-saver-backend || true
  pm2 list
else
  echo "PM2 not found — restart your Node app in aaPanel (port 3007), do NOT run 'npm start' twice."
fi

echo "==> Done. Hard-refresh the site (Ctrl+Shift+R) or clear site data for PWA cache."
echo "    Health: curl -s http://127.0.0.1:3007/health"

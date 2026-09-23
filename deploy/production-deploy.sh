#!/usr/bin/env bash
# Run on the server from the project root after `git pull`.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Backend: install, build, migrate"
cd backend
npm ci
npm run build

echo "==> Database: ensure favorites column (idempotent)"
node -e "
import 'dotenv/config';
import { ensureLinksFavoritesColumn } from './dist/lib/ensureSchema.js';
import prisma from './dist/lib/prisma.js';
await ensureLinksFavoritesColumn();
await prisma.\$disconnect();
"

if ! npx prisma migrate deploy; then
  echo "==> Migration failed — resolving known add_link_favorites failure (P3009)..."
  npx prisma migrate resolve --applied 20250627120000_add_link_favorites
  npx prisma migrate deploy
fi
cd "$ROOT"

echo "==> Frontend: ensure production API URL in .env"
if ! grep -q 'VITE_API_URL=https://link-nest.digitaura.net/api' .env 2>/dev/null; then
  echo "WARNING: Set VITE_API_URL=https://link-nest.digitaura.net/api in $ROOT/.env before building"
fi

echo "==> Frontend: install & build (use lockfile — do not upgrade Vite on server)"
npm ci
npm run build

echo "==> Restart backend (PM2)"
if command -v pm2 >/dev/null 2>&1; then
  pm2 restart all || pm2 restart link-nest-backend || true
  pm2 list
else
  echo "PM2 not found — restart your Node app in aaPanel (port 3007), do NOT run 'npm start' twice."
fi

echo "==> Done. After deploy, mobile/PWA users get a Reload toast when an update is ready."
echo "    If still stale once: clear site data or reinstall the home-screen app."
echo "    Health: curl -s http://127.0.0.1:3007/health"

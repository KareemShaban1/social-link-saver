#!/usr/bin/env bash
# One-time fix for Prisma P3009: failed 20250627120000_add_link_favorites migration.
# Run from project root on the production server.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/backend"

echo "==> Build backend (needed for ensureSchema helper)"
npm run build

echo "==> Ensure links.is_favorite column exists"
node -e "
import 'dotenv/config';
import { ensureLinksFavoritesColumn } from './dist/lib/ensureSchema.js';
import prisma from './dist/lib/prisma.js';
await ensureLinksFavoritesColumn();
await prisma.\$disconnect();
"

echo "==> Mark failed migration as applied"
npx prisma migrate resolve --applied 20250627120000_add_link_favorites

echo "==> Verify migrations"
npx prisma migrate deploy

echo "==> Done. Re-run ./deploy/production-deploy.sh from project root."

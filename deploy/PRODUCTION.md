# Production deploy checklist

Site: https://social-link-saver.kareemsoft.org/app

## Why updates don't appear

| Cause | Symptom |
|-------|---------|
| Frontend not rebuilt | UI changes missing (pagination, stats modal, favorites star) |
| Wrong `VITE_API_URL` at build time | API calls fail or hit localhost |
| Backend not restarted | Favorites, stats API errors; old behavior |
| DB migration not run | `is_favorite` column missing → 500 on links |
| PWA / browser cache | Old JavaScript still runs after deploy — users see a **Reload** toast when a new version is ready |
| `npm start` while app already on 3007 | Build succeeds but new code never runs |

## One-time: production `.env` (project root)

```env
VITE_API_URL=https://social-link-saver.kareemsoft.org/api
```

Rebuild frontend **after** setting this — Vite bakes the value into `dist/`.

## npm ERESOLVE (Vite 8 vs plugin)

If `npm install` fails with `vite@8` vs `@vitejs/plugin-react-swc`:

The repo uses **Vite 5** (see `package-lock.json`). The server likely upgraded Vite without the lockfile.

```bash
cd /www/wwwroot/social-link-saver.kareemsoft.org
git checkout package.json package-lock.json
rm -rf node_modules
npm ci
npm run build
```

Do **not** use `npm install vite@latest` or `--force` unless you intend to upgrade the whole toolchain.

## Deploy after `git pull`

```bash
cd /www/wwwroot/social-link-saver.kareemsoft.org
git pull

# Option A: script
chmod +x deploy/production-deploy.sh
./deploy/production-deploy.sh

# Option B: manual
cd backend && npm install && npm run build && npx prisma migrate deploy && cd ..
npm install && npm run build
pm2 restart all   # or restart in aaPanel — do NOT npm start if port 3007 is in use
```

## Nginx

- Static files: serve from `dist/` (index.html + assets)
- API: proxy `/api` → `http://127.0.0.1:3007` (see `deploy/nginx-api-baota.snippet.conf`)

## Verify

```bash
curl -s http://127.0.0.1:3007/health
curl -s https://social-link-saver.kareemsoft.org/api/public/stats
```

In browser DevTools → Network: JS files should have new hashes after deploy.  
Hard refresh: **Ctrl+Shift+R** (or clear site data for the domain).

## PM2 / aaPanel

If you see `EADDRINUSE :::3007`, the app is **already running**. Use **restart**, not a second `npm start`.

```bash
pm2 list
pm2 restart <app-name>
pm2 logs --lines 30
```

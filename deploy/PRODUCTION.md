# Production deploy checklist

Site: https://social-link-saver.digitaura.net/app

## Why updates don't appear

| Cause | Symptom |
|-------|---------|
| Frontend not rebuilt | UI changes missing (pagination, stats modal, favorites star) |
| Wrong `VITE_API_URL` at build time | API calls fail or hit localhost |
| Backend not restarted | Favorites, stats API errors; old behavior |
| DB migration not run | `is_favorite` column missing → 500 on links |
| Prisma P3009 failed migration | `20250627120000_add_link_favorites` stuck as failed — run fix below |
| PWA / browser cache | **Incognito shows new UI, normal tabs / mobile do not** — old service worker serving cached CSS/JS |
| `sw.js` cached by Nginx | Mobile never picks up deploys — add `deploy/nginx-static-cache.snippet.conf` |
| `npm start` while app already on 3007 | Build succeeds but new code never runs |

### Clear stuck cache (one-time per device)

**Desktop (normal tab):** DevTools → Application → Service Workers → Unregister → Clear site data → hard refresh (`Ctrl+Shift+R`).

**Mobile Chrome:** Site lock icon / ⋮ → Site settings → Clear & reset → reload.  
If installed to home screen: remove the icon, clear site data, open in browser once, then re-add.

**Mobile Safari / iOS:** Settings → Safari → Advanced → Website Data → remove the domain (or Clear History and Website Data), then reopen. Home-screen apps keep their own cache — delete the icon and open via Safari.

## One-time: production `.env` (project root)

```env
VITE_API_URL=https://social-link-saver.digitaura.net/api
```

Rebuild frontend **after** setting this — Vite bakes the value into `dist/`.

## npm ERESOLVE (Vite 8 vs plugin)

If `npm install` fails with `vite@8` vs `@vitejs/plugin-react-swc`:

The repo uses **Vite 5** (see `package-lock.json`). The server likely upgraded Vite without the lockfile.

```bash
cd /www/wwwroot/social-link-saver.digitaura.net
git checkout package.json package-lock.json
rm -rf node_modules
npm ci
npm run build
```

Do **not** use `npm install vite@latest` or `--force` unless you intend to upgrade the whole toolchain.

## Deploy after `git pull`

```bash
cd /www/wwwroot/social-link-saver.digitaura.net
git pull

# Option A: script
chmod +x deploy/production-deploy.sh
./deploy/production-deploy.sh

# Option B: manual
cd backend && npm install && npm run build && npx prisma migrate deploy && cd ..
npm install && npm run build
pm2 restart all   # or restart in aaPanel — do NOT npm start if port 3007 is in use
```

## Fix P3009: failed favorites migration

If deploy stops with:

```text
Error: P3009
The `20250627120000_add_link_favorites` migration ... failed
```

The `is_favorite` column was likely already added by the app at startup (`ensureSchema.ts`), so Prisma recorded the migration as failed.

**Quick fix (run once on server):**

```bash
cd /www/wwwroot/social-link-saver.digitaura.net
chmod +x deploy/fix-failed-migration.sh
./deploy/fix-failed-migration.sh
./deploy/production-deploy.sh
```

**Or manually:**

```bash
cd /www/wwwroot/social-link-saver.digitaura.net/backend
npx prisma migrate resolve --applied 20250627120000_add_link_favorites
npx prisma migrate deploy
cd ..
./deploy/production-deploy.sh
```

## Nginx

- Static files: serve from `dist/` (index.html + assets)
- API: proxy `/api` → `http://127.0.0.1:3007` (see `deploy/nginx-api-baota.snippet.conf`)
- **Required for reliable UI updates:** add `deploy/nginx-static-cache.snippet.conf` so `sw.js` and `index.html` are never long-cached

## Verify

```bash
curl -s http://127.0.0.1:3007/health
curl -s https://social-link-saver.digitaura.net/api/public/stats
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

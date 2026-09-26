# Clash IQ – optimization notes

## Fixed

- Restored the complete `artifacts/api-server/src/routes/clash.ts`; the checked-in file had been truncated to 29 lines and blocked all builds.
- Restored player war-history access and corrected defensive-history attribution.
- Fixed TypeScript errors in AI response parsing, War Planner recommendations and the member dialog.
- Fixed the previous-period trend calculation in war intelligence.
- `CLASH_CLAN_TAG` now controls the server's default clan.

## Optimized

- Clan dashboard queries stay fresh for 30 seconds and remain cached for 10 minutes in the browser.
- Dashboard responses use a short private HTTP cache window.
- Historical recovery is coalesced per clan, cached for 15 minutes and uses bounded concurrency.
- Player history selects only required database fields and clamps result size.
- Vite proxies relative `/api` traffic to the local API server.
- Removed the duplicate unused Inter font request; the required fonts now load directly from the document head.
- Existing optimizations remain: route-level lazy loading, content-hashed asset caching and WebP branding assets.

## Validation

```bash
pnpm run typecheck
pnpm run build
```

Both commands pass as of 2026-09-26.

## APK

- `android-app/` is an independent Capacitor shell that loads the hosted app.
- The cold-start error page retries automatically.
- Run the GitHub Actions workflow **Build Clash IQ APK** or push an `apk-v*` tag.
- Play Store distribution still requires a signed release build and AAB.

## Still recommended

- Replace the global persisted active clan with a per-client or per-user selection.
- Add authentication and roles for write operations and paid AI features.
- Add unit/integration tests for war-state and statistics calculations.
- Consolidate duplicate root source directories with the workspace code under `artifacts/`.
- `/clashiq-hero-barbarian.png` is referenced by War Planner but missing from `public/`.
- Render free instances may sleep; monitor `/api/healthz` or use an always-on instance.

See `docs/UTVECKLINGSPLAN.md` for the prioritized product and technical roadmap.

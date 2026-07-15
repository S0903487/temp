# Changes — code review & fixes pass

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the current, accurate map
of the codebase. Summary of what changed and why:

## Fixed: slow API
`GET /api/influencers` (used by the dashboard, grid, table, pipeline
board — everywhere) was returning every influencer's profile photo as a
full base64 string on every request, because the upload form saved
`FileReader.readAsDataURL()` output straight into the database. That's
the main reason list/search pages felt slow. Photos are now uploaded,
resized to 256×256, converted to WebP, and stored in R2; the database
only ever holds a short `/api/uploads/<key>` URL.

## Fixed: broken / non-loading images (incl. Instagram/TikTok links)
Pasting a TikTok/Instagram CDN URL directly often rendered as a broken
image because those CDNs reject cross-origin hotlinking. There's now an
"Import" step (`POST /api/uploads/from-url`) that fetches the image
server-side (not subject to the same restrictions), resizes it, and
re-hosts it from our own origin. New/edited files:
`worker/handlers/uploads.ts`, `frontend/src/lib/image.ts`,
`frontend/src/lib/uploads.ts`, `frontend/src/features/influencers/components/AddInfluencerModal.tsx`.

Requires one-time setup before deploying: create the R2 bucket with
`npx wrangler r2 bucket create influenceos-images` (binding already added
to `wrangler.jsonc`). Local dev needs nothing extra — `server.ts` now
includes a filesystem-backed R2 shim.

## Removed dead code (the "confusing structure" problem)
These were never imported by the running app — leftovers from an earlier
mock-data version, or duplicate/never-wired scaffolding:
- `frontend/src/services/`, `repositories/`, `db/`, `types/` (top-level) —
  a whole parallel mock implementation of every feature, superseded by
  `frontend/src/features/*` months ago but never deleted.
- `frontend/src/app/router/AppRouter.tsx` — an older, unused duplicate of
  the routes actually defined in `App.tsx` (missing auth/protected routes).
- `frontend/src/features/influencers/components/InfluencerFilters.tsx` and
  `InfluencerStats.tsx` — superseded by `InfluencerFiltersPanel.tsx`, no
  longer referenced anywhere.
- `backend/` (a second, never-implemented Cloudflare Worker stub with its
  own placeholder `wrangler.toml`) — the real backend is `worker/`;
  `backend/` was listed in the root `package.json` workspaces but none of
  its scripts were ever actually run.
- Unused template leftovers: `frontend/src/assets/{react,vite}.svg`,
  `hero.png`, `frontend/public/icons.svg`.

Run `npm install` once after pulling this so the lockfile drops the
removed `backend` workspace entry.

## Docs
`docs/architecture.md`, `docs/database.md`, `docs/api.md` were
pre-implementation planning stubs that no longer matched the app (they
even described the repository/mock-data pattern that was just deleted).
Left them in place but marked clearly superseded, pointing to the new
root-level `ARCHITECTURE.md`, `schema.sql`, and `worker/*` as the sources
of truth. `docs/vision.md`, `roadmap.md`, `ui.md` were accurate as-is and
left untouched.

## Not done in this pass (documented, not silently skipped)
Styling is Tailwind utility classes, not per-page stylesheets (only 7
`.css` files exist total), and most forms already share one input style
via `components/shared/fields.tsx`. A few older components
(`InfluencerCard`, `InfluencerDetailsDrawer`, `InfluencerFiltersPanel`,
`Pagination`) still hand-roll similar-but-slightly-different classes
instead of using that shared file, and there's no shared `<Button>`
component yet (buttons are the most duplicated pattern in the app). See
`ARCHITECTURE.md`'s styling section for the recommended next step.

# Changes — code review & fixes pass

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the current, accurate map
of the codebase. Summary of what changed and why:

## Fixed: slow API
`GET /api/influencers` (used by the dashboard, grid, table, pipeline
board — everywhere) was returning every influencer's profile photo as a
full base64 string on every request, because the upload form saved
`FileReader.readAsDataURL()` output straight into the database at
whatever size the original file happened to be. That's the main reason
list/search pages felt slow. Photos are now always resized to 256×256
WebP client-side (~10-40KB) before being embedded the same way, so the
payload just never gets big again. The backend also rejects (400) any
`profileImage` over 200KB on create/update as a backstop.

## Fixed: broken / non-loading images (incl. Instagram/TikTok links)
Pasting a TikTok/Instagram CDN URL directly often rendered as a broken
image because those CDNs reject cross-origin hotlinking. There's now an
"Import" step (`POST /api/images/fetch-url`) that fetches the image
server-side (not subject to the same restrictions) and hands the bytes
back to the browser, which resizes them exactly like a local upload.
Nothing is stored server-side. New/edited files:
`worker/handlers/uploads.ts`, `frontend/src/lib/image.ts`,
`frontend/src/lib/uploads.ts`,
`frontend/src/features/influencers/components/AddInfluencerModal.tsx`.

No extra Cloudflare setup needed — this intentionally avoids R2 (an
earlier version of this fix used R2, but Cloudflare requires a payment
method on file to enable it even on the free tier, so it was dropped in
favor of embedding the small resized image directly, same as before but
now actually small).

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

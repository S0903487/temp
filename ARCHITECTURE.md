# InfluenceOS — Architecture

This is the map of how the app is actually put together today. (The docs
under `docs/` describe the original *plan*; this file describes what's
really running, and is the one to trust when they disagree.)

## The three moving parts

```
frontend/   React 19 + Vite + Tailwind SPA. Everything the user sees.
worker/     The real backend — a Cloudflare Worker + D1 (SQLite) + R2.
            This is what actually runs in production.
server.ts   A local-only dev harness. It runs the SAME worker/index.ts
            fetch handler, but wires it up to a plain SQLite file
            (via better-sqlite3) instead of D1, and a local folder
            instead of R2, so you can `npm run dev` without a
            Cloudflare account. It is not a second backend
            implementation — it's a shim around the one in worker/.
```

Production request flow: browser → Cloudflare Worker (`worker/index.ts`)
→ either serves the built SPA (`ASSETS` binding) or routes `/api/*` to a
handler in `worker/handlers/*` → D1 for data, R2 (`IMAGES` binding) for
avatar images.

Local dev flow: `npm run dev` → `server.ts` starts Express + Vite →
`/api/*` requests are converted into Fetch `Request` objects and handed
to the exact same `worker.fetch()` used in production, with `env.DB` and
`env.IMAGES` backed by `influenceos.db` (SQLite file) and `.local-r2/`
(a plain folder) respectively. Everything else is served by Vite's dev
middleware with HMR.

## Frontend structure (`frontend/src`)

```
main.tsx                Entry point, mounts <App />.
App.tsx                 Router — the ONLY place routes are defined.
features/<name>/        One folder per product area (influencers,
                         campaigns, clients, analytics, auth, dashboard,
                         settings, organizations, ai). Each one owns its
                         own pages, components, hooks, services, and
                         types — treat a feature folder as a
                         self-contained module.
  <name>Page.tsx           the route's top-level page component
  components/              page-specific components
  hooks/                   TanStack Query hooks (useInfluencers, etc.)
  services/                fetch wrappers calling the real API
                            (frontend/src/lib/api.ts's apiRequest)
  types.ts                 TypeScript types for this feature's data
components/
  layout/                  AppLayout, Sidebar, Topbar — the app chrome
  shared/                  Cross-feature UI: Avatar, PageShell, fields.tsx
                            (fieldClass/textAreaClass/labelClass/Select —
                            the shared input styling, use these instead of
                            hand-writing new Tailwind strings)
lib/
  api.ts                   apiRequest() — the one fetch wrapper every
                            feature's services/*.ts should call
  uploads.ts               uploadImageFile / uploadImageFromUrl — the
                            avatar upload pipeline (see below)
  image.ts                 resizeImageToWebp() — client-side canvas resize
  countries.ts, currency.ts  small static data/formatting helpers
```

There is intentionally no top-level `services/`, `repositories/`, `db/`,
or `types/` directory anymore — an earlier mock-data version of the app
lived there, App.tsx never imported it, and it was deleted (along with an
unused duplicate `app/router/AppRouter.tsx`) because it was actively
confusing to navigate alongside the real `features/*` code.

**Styling**: this app uses Tailwind, not per-page CSS files — there are
only 7 `.css` files total (global reset + a couple of CSS Modules for
layout chrome), everything else is Tailwind utility classes. The
"one class everywhere" ask is handled by `components/shared/fields.tsx`
(`fieldClass`, `textAreaClass`, `labelClass`, `<Select>`) for form
controls — import those instead of retyping border/background/focus
classes on a new `<input>`. A few older components (`InfluencerCard`,
`InfluencerDetailsDrawer`, `InfluencerFiltersPanel`, `Pagination`)
predate this and still hand-roll similar-but-not-identical classes;
migrating them to `fieldClass` (and to a shared `<Button>`, which doesn't
exist yet and would be a good next addition alongside `fields.tsx`) is
the natural next cleanup pass.

## Backend structure (`worker/`)

```
index.ts        Router. Reads the path, checks auth (Bearer token via
                 Authorization header, except /api/auth/* and GET
                 /api/uploads/* which are public), dispatches to handlers.
handlers/*.ts    One file per resource (influencers, campaigns, clients,
                 organizations, analytics, tags, auth, uploads). Each
                 handler talks to D1 directly with parameterized SQL —
                 no ORM.
utils.ts         json()/errorResponse() helpers, ID generation, PBKDF2
                 password hashing, session token generation.
types.ts         Env (the bindings available to the Worker: DB, ASSETS,
                 IMAGES) and AuthedRequest.
```

Every table lives in `schema.sql` (+ incremental changes in
`migrations/*.sql`); that file is the source of truth for the data model,
not `docs/database.md`.

## Avatar images: upload, resize, and why URLs used to be slow/broken

Profile photos used to be read client-side into a base64 string and
saved directly into the `influencers.profile_image` D1 column. Two
problems came from that:

1. **Slow list pages** — `GET /api/influencers` (used by the dashboard,
   the influencer grid/table/pipeline board, everywhere) returned every
   row's full base64 photo on every request. A page of 30 influencers
   could mean tens of megabytes of JSON for a screen that only shows
   40px thumbnails.
2. **Broken image URLs** — pasting a TikTok or Instagram profile picture
   link and saving it as-is often rendered as a broken image, because
   those CDNs commonly reject direct `<img>` hotlinking from another
   origin (they check Referer/Origin/User-Agent).

Both are fixed by the same pipeline now (`worker/handlers/uploads.ts`,
`frontend/src/lib/image.ts`, `frontend/src/lib/uploads.ts`):

- **File upload**: the browser resizes the image to 256×256 WebP with
  `<canvas>` (`resizeImageToWebp`) *before* sending it anywhere, then
  `POST /api/uploads/file` stores just that small file in R2.
- **Pasted URL**: `POST /api/uploads/from-url` fetches the image
  server-side (a Worker-to-origin fetch isn't subject to the browser's
  hotlink/CORS restrictions a TikTok/Instagram CDN checks for), attempts
  a 256×256 WebP resize via Cloudflare Image Resizing if the zone has it
  enabled, and stores the result in R2 either way.
- Either path returns a short `/api/uploads/<key>` URL. **That's** what
  gets saved on the influencer record — never raw bytes, never someone
  else's CDN link.
- `GET /api/uploads/<key>` serves the file back out of R2, publicly
  (no auth), because `<img src>` requests can't attach our Bearer token.

**One-time setup this requires** that wasn't needed before: an R2 bucket.
`wrangler.jsonc` now declares an `IMAGES` binding pointing at a bucket
named `influenceos-images` — create it once with
`npx wrangler r2 bucket create influenceos-images` before deploying.
Local dev doesn't need this — `server.ts`'s local R2 shim just uses a
`.local-r2/` folder automatically.

## Things intentionally not covered here

`docs/vision.md`, `docs/roadmap.md`, and `docs/ui.md` are legitimately
forward-looking (product vision / phased plan / design language) and are
still accurate as aspirational docs. `docs/architecture.md`,
`docs/database.md`, and `docs/api.md` described a pre-implementation plan
that this file now supersedes.

# InfluenceOS — Architecture

This is the map of how the app is actually put together today. (The docs
under `docs/` describe the original *plan*; this file describes what's
really running, and is the one to trust when they disagree.)

## The three moving parts

```
frontend/   React 19 + Vite + Tailwind SPA. Everything the user sees.
worker/     The real backend — a Cloudflare Worker + D1 (SQLite).
            This is what actually runs in production.
server.ts   A local-only dev harness. It runs the SAME worker/index.ts
            fetch handler, but wires it up to a plain SQLite file
            (via better-sqlite3) instead of D1, so you can `npm run dev`
            without a Cloudflare account. It is not a second backend
            implementation — it's a shim around the one in worker/.
```

Production request flow: browser → Cloudflare Worker (`worker/index.ts`)
→ either serves the built SPA (`ASSETS` binding) or routes `/api/*` to a
handler in `worker/handlers/*` → D1 for everything, including avatar
images (stored as small resized data URLs — see below, no separate
image storage product is used).

Local dev flow: `npm run dev` → `server.ts` starts Express + Vite →
`/api/*` requests are converted into Fetch `Request` objects and handed
to the exact same `worker.fetch()` used in production, with `env.DB`
backed by `influenceos.db` (a SQLite file). Everything else is served by Vite's dev
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
types.ts         Env (the bindings available to the Worker: DB, ASSETS)
                 and AuthedRequest.
```

Every table lives in `schema.sql` (+ incremental changes in
`migrations/*.sql`); that file is the source of truth for the data model,
not `docs/database.md`.

## Avatar images: resize client-side, no external storage needed

Profile photos used to be read client-side into a base64 string and
saved directly into the `influencers.profile_image` D1 column, at
whatever size the original file happened to be. Two problems came from
that:

1. **Slow list pages** — `GET /api/influencers` (used by the dashboard,
   the influencer grid/table/pipeline board, everywhere) returned every
   row's full base64 photo on every request. A page of 30 influencers
   could mean tens of megabytes of JSON for a screen that only shows
   40px thumbnails.
2. **Broken image URLs** — pasting a TikTok or Instagram profile picture
   link and saving it as-is often rendered as a broken image, because
   those CDNs commonly reject direct `<img>` hotlinking from another
   origin (they check Referer/Origin/User-Agent).

Both are fixed without needing any external storage product
(`frontend/src/lib/image.ts`, `frontend/src/lib/uploads.ts`,
`worker/handlers/uploads.ts`,
`frontend/src/features/influencers/components/AddInfluencerModal.tsx`):

- **File upload**: the browser resizes the image to a 256×256 WebP with
  `<canvas>` (`resizeImageToWebp`) and embeds *that* — not the original —
  as a `data:image/webp;base64,...` URL directly on the record. A
  resized photo is only ~10-40KB, so this is what actually fixes the
  slow-list problem: the record just never holds anything bigger again.
- **Pasted URL**: `POST /api/images/fetch-url` fetches the image
  server-side (a Worker-to-origin fetch isn't subject to the browser's
  hotlink/CORS restrictions a TikTok/Instagram CDN checks for) and
  streams the raw bytes back to the browser, which then runs them
  through the exact same `resizeImageToWebp` step as a local upload.
  Nothing is stored server-side — the Worker is just a pass-through that
  dodges hotlink blocking.
- The backend also rejects (`400`) any `profileImage` over 200KB on
  create/update as a backstop, in case a client ever sends something
  unresized.

**Why not R2 (Cloudflare's object storage)?** It was the first design
here, but Cloudflare requires a payment method on file to enable R2 even
to stay within its free tier — not workable for every deployment target.
Keeping images as small embedded data URLs avoids that entirely; no
Cloudflare product beyond Workers + D1 needs to be enabled. If the app
later wants a real image CDN (e.g. once traffic/photo count grows enough
that embedding stops making sense), R2 is the natural next step, but
that's a deliberate future upgrade, not something required to run the
app today.

## Things intentionally not covered here

`docs/vision.md`, `docs/roadmap.md`, and `docs/ui.md` are legitimately
forward-looking (product vision / phased plan / design language) and are
still accurate as aspirational docs. `docs/architecture.md`,
`docs/database.md`, and `docs/api.md` described a pre-implementation plan
that this file now supersedes.

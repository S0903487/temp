# InfluenceOS — D1 backend setup

This adds a real database and a JSON API to the worker that already serves
your site at `influenceos.sarmadhussain3702668.workers.dev`. The API lives at
`/api/*` in the **same worker** — no separate service, no CORS to configure.

## What was added

- `schema.sql` — D1 tables: organizations, users, sessions, clients,
  campaigns, influencers (extended with the fields your mock UI already
  displays: followers, engagementRate, category, country, etc.),
  campaign_influencers (many-to-many), analytics_records.
- `worker/` — the API implementation (auth + CRUD for every entity), plus
  `worker/index.ts` as the new entry point. Non-`/api` requests fall through
  to your static assets, unchanged.
- `wrangler.jsonc` — now points `main` at `worker/index.ts`, adds the `DB`
  (D1) and `ASSETS` bindings.

Nothing in `src/` was touched — your UI is unaffected until you wire it up.

## 1. Install the new dependency

```bash
npm install
```

(`@cloudflare/workers-types` was added to devDependencies so `D1Database`,
`Fetcher`, etc. type-check.)

## 2. Create the D1 database

```bash
npx wrangler d1 create influenceos-db
```

This prints a `database_id`. Copy it into `wrangler.jsonc`, replacing
`REPLACE_WITH_YOUR_D1_DATABASE_ID`.

## 3. Apply the schema

```bash
# local (for `wrangler dev` / `vite dev`)
npm run db:migrate:local

# production database
npm run db:migrate:remote
```

Re-run the `remote` command whenever you change `schema.sql` (it's
idempotent — every statement uses `IF NOT EXISTS`).

## 4. Run it locally

```bash
npm run dev
```

`@cloudflare/vite-plugin` runs the worker in the same process, so
`/api/*` and the React app are both live at your local Vite URL.

## 5. Deploy

```bash
npm run deploy
```

This builds the client, bundles `worker/index.ts`, and pushes both together
via `wrangler deploy`. Your existing `.workers.dev` route is unaffected.

## API reference

All request/response bodies are JSON. Every route except `/api/auth/*` and
`/api/health` requires `Authorization: Bearer <token>`.

### Auth

| Method | Path                     | Body                                    |
|--------|--------------------------|------------------------------------------|
| POST   | `/api/auth/register`     | `{ name, email, password, organizationName? }` |
| POST   | `/api/auth/login`        | `{ email, password }`                    |
| POST   | `/api/auth/logout`       | —                                         |
| GET    | `/api/auth/me`           | —                                         |
| POST   | `/api/auth/forgot-password` | `{ email }`                            |

`register` and `login` return `{ user, token }`. Store `token` (this is
exactly what `authService.ts`'s `setAuthToken` already does) and send it as
`Authorization: Bearer <token>` on every other call.

Registering creates a **new organization** for that user by default (an
InfluenceOS org = a tenant). Every resource below is scoped to the caller's
organization automatically — there's no cross-tenant leakage to guard
against on the client.

### Resources

All support `GET /api/<resource>` (list), `GET /api/<resource>/:id`,
`POST /api/<resource>`, `PUT /api/<resource>/:id`, `DELETE /api/<resource>/:id`:

- `/api/organizations` — actually just `/api/organizations/current` (GET/PUT) — a user only ever sees their own org.
- `/api/clients`
- `/api/campaigns` — plus:
  - `POST /api/campaigns/:id/influencers` `{ influencerId }` — link an influencer
  - `DELETE /api/campaigns/:id/influencers/:influencerId` — unlink
- `/api/influencers` — the extended shape (fullName, username, platform, category, country, language, followers, engagementRate, averageViews/Likes/Comments, email, phone, pricePost, priceStory, verified, brandSafe, status, notes, tags[], bio, profileImage)
- `/api/analytics` — supports `?influencerId=` and `?campaignId=` filters on list

### Quick smoke test once deployed

```bash
curl -X POST https://influenceos.sarmadhussain3702668.workers.dev/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Sarmad","email":"you@example.com","password":"changeme123"}'

# copy the returned token, then:
curl https://influenceos.sarmadhussain3702668.workers.dev/api/influencers \
  -H "Authorization: Bearer <token>"
```

## Wiring the UI (your part)

Each existing mock file maps to a real call:

- `src/features/auth/services/authService.ts` → replace the mock bodies with
  `apiClient.post('/api/auth/login', credentials)` etc. (the `ApiClient` in
  `src/lib/api.ts` already exists and needs no changes since baseUrl is
  same-origin by default.)
- `src/services/influencerService.ts`, `campaignService.ts`,
  `clientService.ts`, `analyticsService.ts` → same pattern, hitting
  `/api/influencers`, `/api/campaigns`, `/api/clients`, `/api/analytics`.
- `src/features/influencers/mockData.ts` / `data/mockInfluencers.ts` → once
  wired, these can be deleted or kept only as seed data for local testing.

## Notes / things worth knowing

- Passwords are hashed with PBKDF2 (100k iterations, SHA-256) via the
  platform's Web Crypto API — no extra crypto dependency needed.
- Sessions are opaque random tokens stored in a `sessions` table with a
  30-day expiry, not JWTs — simplest thing that works with D1 and needs no
  secret management. Swap for JWT later if you want stateless auth.
- `forgot-password` currently just acknowledges the request; there's no
  outbound email service wired up (would need something like Resend/Postmark
  from the worker, plus a secret via `wrangler secret put`).

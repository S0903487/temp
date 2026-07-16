-- InfluenceOS D1 schema
-- Apply with: wrangler d1 execute influenceos-db --file=./schema.sql (add --remote for production)

PRAGMA foreign_keys = ON;

-- ============ Organizations (tenants) ============
CREATE TABLE IF NOT EXISTS organizations (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  currency    TEXT NOT NULL DEFAULT 'USD',
  created_at  TEXT NOT NULL,
  updated_at  TEXT
);

-- ============ Users & Auth ============
CREATE TABLE IF NOT EXISTS users (
  id              TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  password_salt   TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'admin', -- admin | member | viewer
  created_at      TEXT NOT NULL,
  updated_at      TEXT
);
CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);

CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- ============ Clients ============
CREATE TABLE IF NOT EXISTS clients (
  id              TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  contact_email   TEXT,
  industry        TEXT,
  status          TEXT NOT NULL DEFAULT 'prospect', -- prospect | active
  created_at      TEXT NOT NULL,
  updated_at      TEXT
);
CREATE INDEX IF NOT EXISTS idx_clients_org ON clients(organization_id);

-- ============ Campaigns ============
CREATE TABLE IF NOT EXISTS campaigns (
  id          TEXT PRIMARY KEY,
  client_id   TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  start_date  TEXT,
  end_date    TEXT,
  budget      REAL,
  status      TEXT NOT NULL DEFAULT 'draft', -- draft | active | paused | completed | cancelled
  created_at  TEXT NOT NULL,
  updated_at  TEXT
);
CREATE INDEX IF NOT EXISTS idx_campaigns_client ON campaigns(client_id);

-- ============ Influencers ============
-- Extended to match the richer shape already rendered by the UI mock data
-- (features/influencers/types.ts) in addition to the relational fields.
CREATE TABLE IF NOT EXISTS influencers (
  id               TEXT PRIMARY KEY,
  organization_id  TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  full_name        TEXT NOT NULL,
  username         TEXT,
  platform         TEXT NOT NULL DEFAULT 'Instagram', -- Instagram | TikTok | YouTube
  category         TEXT,
  country          TEXT,
  language         TEXT,
  followers        INTEGER NOT NULL DEFAULT 0,
  engagement_rate  REAL NOT NULL DEFAULT 0,
  average_views    INTEGER NOT NULL DEFAULT 0,
  average_likes    INTEGER NOT NULL DEFAULT 0,
  average_comments INTEGER NOT NULL DEFAULT 0,
  email            TEXT,
  phone            TEXT,
  price_post       REAL,
  price_story      REAL,
  verified         INTEGER NOT NULL DEFAULT 0, -- 0/1
  brand_safe       INTEGER NOT NULL DEFAULT 1, -- 0/1
  status           TEXT NOT NULL DEFAULT 'Active', -- Active | Review | Paused | Booked
  pipeline_status  TEXT NOT NULL DEFAULT 'New', -- New|Reviewed|Contacted|Replied|Negotiating|Booked|Completed|Inactive
  notes            TEXT, -- legacy freeform note; see influencer_notes for the structured log
  tags             TEXT, -- legacy JSON array; see tags/influencer_tags for the normalized version
  bio              TEXT,
  profile_image    TEXT,
  profile_link     TEXT,
  roi              REAL,
  cpa              REAL,
  cpi              REAL,
  ltv              REAL,
  created_at       TEXT NOT NULL,
  updated_at       TEXT
);
CREATE INDEX IF NOT EXISTS idx_influencers_org ON influencers(organization_id);
CREATE INDEX IF NOT EXISTS idx_influencers_platform ON influencers(platform);
CREATE INDEX IF NOT EXISTS idx_influencers_status ON influencers(status);
CREATE INDEX IF NOT EXISTS idx_influencers_pipeline ON influencers(pipeline_status);

-- ============ Tags (normalized, org-scoped, many-to-many) ============
CREATE TABLE IF NOT EXISTS tags (
  id              TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  created_at      TEXT NOT NULL,
  UNIQUE (organization_id, name)
);
CREATE INDEX IF NOT EXISTS idx_tags_org ON tags(organization_id);

CREATE TABLE IF NOT EXISTS influencer_tags (
  influencer_id TEXT NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  tag_id        TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  added_at      TEXT NOT NULL,
  PRIMARY KEY (influencer_id, tag_id)
);
CREATE INDEX IF NOT EXISTS idx_influencer_tags_tag ON influencer_tags(tag_id);

-- ============ Notes (structured, timestamped, many per influencer) ============
CREATE TABLE IF NOT EXISTS influencer_notes (
  id            TEXT PRIMARY KEY,
  influencer_id TEXT NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  author_id     TEXT REFERENCES users(id) ON DELETE SET NULL,
  body          TEXT NOT NULL,
  created_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_influencer_notes_influencer ON influencer_notes(influencer_id);

-- ============ Analytics history (account growth, independent of campaigns) ============
CREATE TABLE IF NOT EXISTS influencer_snapshots (
  id                TEXT PRIMARY KEY,
  influencer_id     TEXT NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  date              TEXT NOT NULL,
  followers         INTEGER NOT NULL DEFAULT 0,
  average_views     INTEGER NOT NULL DEFAULT 0,
  average_likes     INTEGER NOT NULL DEFAULT 0,
  average_comments  INTEGER NOT NULL DEFAULT 0,
  engagement_rate   REAL NOT NULL DEFAULT 0,
  created_at        TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_influencer_snapshots_influencer ON influencer_snapshots(influencer_id, date);

-- ============ Campaign <-> Influencer (many-to-many) ============
CREATE TABLE IF NOT EXISTS campaign_influencers (
  campaign_id   TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  influencer_id TEXT NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  added_at      TEXT NOT NULL,
  PRIMARY KEY (campaign_id, influencer_id)
);
CREATE INDEX IF NOT EXISTS idx_ci_influencer ON campaign_influencers(influencer_id);

-- ============ Analytics ============
CREATE TABLE IF NOT EXISTS analytics_records (
  id            TEXT PRIMARY KEY,
  influencer_id TEXT NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  campaign_id   TEXT REFERENCES campaigns(id) ON DELETE SET NULL,
  date          TEXT NOT NULL,
  impressions   INTEGER,
  clicks        INTEGER,
  conversions   INTEGER,
  revenue       REAL,
  metadata      TEXT, -- JSON object
  created_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_analytics_influencer ON analytics_records(influencer_id);
CREATE INDEX IF NOT EXISTS idx_analytics_campaign ON analytics_records(campaign_id);

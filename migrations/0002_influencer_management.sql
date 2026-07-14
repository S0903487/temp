-- Influencer Management MVP: normalized tags, structured notes, growth
-- history (analytics_history), and a pipeline workflow status.
-- Apply with: wrangler d1 execute influenceos-db --remote --file=./migrations/0002_influencer_management.sql

PRAGMA foreign_keys = ON;

-- ============ Pipeline status ============
-- Separate from the existing `status` field (Active | Review | Paused |
-- Booked, used for account health) — pipeline_status tracks where an
-- influencer sits in the outreach workflow.
ALTER TABLE influencers ADD COLUMN pipeline_status TEXT NOT NULL DEFAULT 'New';
-- New | Reviewed | Contacted | Replied | Negotiating | Booked | Completed | Inactive
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

-- Backfill: turn each influencer's legacy `tags` JSON array into rows in
-- the normalized tables so nothing is lost when the UI switches over.
INSERT OR IGNORE INTO tags (id, organization_id, name, created_at)
SELECT
  'tag_' || lower(hex(randomblob(16))),
  i.organization_id,
  je.value,
  datetime('now')
FROM influencers i, json_each(i.tags) je
WHERE i.tags IS NOT NULL AND trim(i.tags) != '' AND trim(je.value) != '';

INSERT OR IGNORE INTO influencer_tags (influencer_id, tag_id, added_at)
SELECT i.id, t.id, datetime('now')
FROM influencers i, json_each(i.tags) je
JOIN tags t ON t.organization_id = i.organization_id AND t.name = je.value
WHERE i.tags IS NOT NULL AND trim(i.tags) != '' AND trim(je.value) != '';

-- ============ Notes (structured, timestamped, many per influencer) ============
CREATE TABLE IF NOT EXISTS influencer_notes (
  id            TEXT PRIMARY KEY,
  influencer_id TEXT NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  author_id     TEXT REFERENCES users(id) ON DELETE SET NULL,
  body          TEXT NOT NULL,
  created_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_influencer_notes_influencer ON influencer_notes(influencer_id);

-- Backfill: carry the old freeform `notes` text field over as the first note.
INSERT INTO influencer_notes (id, influencer_id, author_id, body, created_at)
SELECT 'note_' || lower(hex(randomblob(16))), i.id, NULL, i.notes, datetime('now')
FROM influencers i
WHERE i.notes IS NOT NULL AND trim(i.notes) != '';

-- ============ Analytics history (follower/engagement growth over time) ============
-- Distinct from `analytics_records` (campaign performance: impressions,
-- clicks, conversions, revenue). This tracks the creator's own account
-- growth trend, independent of any specific campaign.
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

-- Backfill: seed one snapshot per influencer from their current numbers so
-- every profile has at least one point on the growth chart immediately.
INSERT INTO influencer_snapshots (id, influencer_id, date, followers, average_views, average_likes, average_comments, engagement_rate, created_at)
SELECT
  'snap_' || lower(hex(randomblob(16))),
  i.id,
  date('now'),
  i.followers,
  i.average_views,
  i.average_likes,
  i.average_comments,
  i.engagement_rate,
  datetime('now')
FROM influencers i;

-- Migration to add financial columns and profile link to influencers table.
-- Apply with: wrangler d1 execute influenceos-db --remote --file=./migrations/0003_add_influencer_financials_and_link.sql

PRAGMA foreign_keys = ON;

ALTER TABLE influencers ADD COLUMN profile_link TEXT;
ALTER TABLE influencers ADD COLUMN roi REAL;
ALTER TABLE influencers ADD COLUMN cpa REAL;
ALTER TABLE influencers ADD COLUMN cpi REAL;
ALTER TABLE influencers ADD COLUMN ltv REAL;

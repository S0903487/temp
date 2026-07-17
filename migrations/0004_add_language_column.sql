-- Migration to add language column to influencers table if missing.
-- Apply with: wrangler d1 execute influenceos-db --remote --file=./migrations/0004_add_language_column.sql

PRAGMA foreign_keys = ON;

-- SQLite doesn't have ALTER TABLE IF NOT EXISTS, so this will run cleanly
-- on any database that does not have the column yet.
ALTER TABLE influencers ADD COLUMN language TEXT;

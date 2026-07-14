-- Adds currency preference to organizations. Safe to run once against an
-- already-deployed database (schema.sql alone won't alter existing tables).
-- Apply with: wrangler d1 execute influenceos-db --remote --file=./migrations/0001_add_organization_currency.sql
ALTER TABLE organizations ADD COLUMN currency TEXT NOT NULL DEFAULT 'USD';

# InfluenceOS Database Design

> Superseded by the real schema. `schema.sql` (plus incremental changes
> in `migrations/*.sql`) at the repo root is the source of truth for
> every table and column — read that instead of this file for anything
> current. See also [`/ARCHITECTURE.md`](../ARCHITECTURE.md).

## Planned persistence
- Organizations
- Influencers
- Campaigns
- Clients

## Notes
Database access will be organized through D1-friendly repository abstractions so the application can evolve from mock data to durable storage without major UI changes.

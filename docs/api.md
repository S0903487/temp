# InfluenceOS API Design

> Superseded by the real API. Every route is defined in `worker/index.ts`
> (dispatch table) with the implementation in `worker/handlers/*.ts` —
> read those instead of this file for anything current. See also
> [`/ARCHITECTURE.md`](../ARCHITECTURE.md).

The API layer will expose endpoints for organization, influencer, campaign, and client operations. The initial architecture keeps the API contract separate from the UI so future integrations can be introduced incrementally.

# InfluenceOS Architecture

> This was the pre-implementation plan. The app has since been built —
> see [`/ARCHITECTURE.md`](../ARCHITECTURE.md) at the repo root for how
> it actually works today (folder-by-folder structure, the Worker/D1/R2
> backend, and the avatar upload pipeline). Keeping this note here so
> nobody mistakes the old plan below for current behavior.

The application follows a feature-based architecture with clear separation between UI, domain services, repositories, and persistence models. This structure supports future Cloudflare Workers and D1 integration without coupling the interface to infrastructure details.

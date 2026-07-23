# InfluenceOS — High-Performance Influencer CRM & Campaign OS

InfluenceOS is an enterprise-grade influencer relationship management platform designed to track, analyze, and manage over **50,000+ creator profiles** with sub-millisecond query performance and high-throughput bulk spreadsheet operations.

---

## 🌟 Key Features

### 1. High-Performance Creator Repository (50K+ Scalability)
- **High-Throughput Database**: Powered by Cloudflare D1 / SQLite with multi-column compound indexes for sub-millisecond filtering across thousands of records.
- **Server-Side Pagination & Search**: Query creators by handle, name, bio keywords, tags, niche categories, and reach metrics without slowing down the client.
- **Flexible CRM Views**:
  - **Data Grid**: Dense tabular view with custom column visibility, sorting, and inline handle copies.
  - **Grid Cards**: Visual profile cards showcasing creator profile photos, tags, engagement rates, and reach.
  - **Kanban Board**: Drag-and-drop outreach pipeline stages (*New*, *Contacted*, *Negotiating*, *Booked*, *Completed*, *Passed*).

### 2. Bulk Import & Upsert Engine (Excel, CSV, JSON)
- **Multi-Format Support**: Upload `.xlsx`, `.xls` (Excel spreadsheets), `.csv` (Comma Separated Values), or `.json` files.
- **Smart Column Mapping**: Automatically detects variants of headers (e.g. `Handle`, `Instagram`, `Creator Name`, `Follower Count`, `Rate`) and normalizes them into structured fields.
- **Atomic Batch Upsert**: Performs high-speed chunked upserts (500 records per batch). If a creator already exists (matched by ID or handle), their metrics, rates, and contact info are updated seamlessly without creating duplicates.
- **Template Downloader**: Download pre-formatted Excel template sheets directly from the import modal.

### 3. Bulk Management & Action Bar
- **Multi-Select Controls**: Select individual creators or all creators across pages.
- **Floating Action Bar**: Perform bulk pipeline stage updates, export selected creators to CSV, or bulk-delete multiple entries in a single click.

### 4. Campaign & Analytics OS
- **Campaign Tracking**: Associate creators with specific marketing campaigns and budget allocations.
- **Historical Snapshots & Growth**: Monitor follower and engagement trends over time with dynamic analytical charts.

---

## 📄 Data Import & File Formats

InfluenceOS supports **Excel (.xlsx, .xls)**, **CSV (.csv)**, and **JSON (.json)** files.

### 1. Supported Field Reference

| Field Name | Standard Header Variants | Description | Example Value |
| :--- | :--- | :--- | :--- |
| **`fullName`** | `Full Name`, `Name`, `Creator Name`, `Title` | Primary display name of creator | `Alexander Wright` |
| **`username`** | `Username`, `Handle`, `Instagram`, `TikTok`, `User` | Social handle without `@` | `alex_tech_reviews` |
| **`platform`** | `Platform`, `Network`, `Channel` | Platform choice (`Instagram`, `TikTok`, `YouTube`) | `YouTube` |
| **`category`** | `Category`, `Niche`, `Industry`, `Tags` | Primary content niche | `Technology` |
| **`country`** | `Country`, `Location`, `Region` | Primary geographical market | `United States` |
| **`language`** | `Language`, `Lang` | Spoken/content language | `English` |
| **`followers`** | `Followers`, `Follower Count`, `Audience` | Number of followers/subscribers | `450000` |
| **`engagementRate`** | `Engagement Rate`, `Engagement`, `Eng Rate` | Engagement percentage (%) | `5.4` |
| **`averageViews`** | `Average Views`, `Avg Views`, `Views` | Average views per post | `125000` |
| **`email`** | `Email`, `Contact Email`, `Mail` | Business contact email | `alexander@techreviews.com` |
| **`phone`** | `Phone`, `Contact Phone`, `Mobile` | Contact telephone number | `+1 555-0192` |
| **`pipelineStatus`**| `Pipeline Status`, `Stage`, `Outreach Stage` | Outreach stage (`New`, `Contacted`, `Negotiating`, `Booked`, `Completed`, `Passed`) | `Booked` |
| **`pricePost`** | `Price Post`, `Rate Post`, `Price` | Standard feed post rate ($) | `1200` |
| **`priceStory`** | `Price Story`, `Rate Story` | Story post rate ($) | `450` |
| **`bio`** | `Bio`, `Description`, `Notes` | Short creator summary or internal notes | `Tech reviewer focused on mobile devices.` |

---

### 2. Example Data Formats

#### **JSON Format (`creators.json`)**
```json
[
  {
    "fullName": "Elena Rostova",
    "username": "elena_fits",
    "platform": "Instagram",
    "category": "Fitness & Wellness",
    "country": "United Kingdom",
    "language": "English",
    "followers": 180000,
    "engagementRate": 6.2,
    "averageViews": 45000,
    "email": "elena@rostovafit.co.uk",
    "phone": "+44 7700 900077",
    "pipelineStatus": "Booked",
    "pricePost": 750,
    "priceStory": 300
  }
]
```

#### **CSV Format (`creators.csv`)**
```csv
Full Name,Username,Platform,Category,Country,Followers,Engagement Rate,Email,Pipeline Status,Price Post
Alexander Wright,alex_tech_reviews,YouTube,Technology,United States,450000,5.4,alexander@techreviews.com,Contacted,1200
Elena Rostova,elena_fits,Instagram,Fitness & Wellness,United Kingdom,180000,6.2,elena@rostovafit.co.uk,Booked,750
```

---

## 🏗️ Technical Architecture & How It Works

1. **Frontend Architecture**:
   - Built with **React 19**, **TypeScript**, **Vite**, and **Tailwind CSS**.
   - State management powered by **@tanstack/react-query** for automatic caching, background fetching, and optimistic UI updates.
   - Excel and CSV parsing using **SheetJS (`xlsx`)** and **PapaParse**.

2. **Backend Engine**:
   - High-throughput **Cloudflare Workers API** service running on Edge runtime.
   - Persistence layer using **SQLite (D1)** with optimized indexing on `(organization_id, followers)`, `(organization_id, pipeline_status)`, `(organization_id, platform)`, and text search indexes on `full_name` and `username`.

3. **Security & Multi-Tenancy**:
   - Complete organization-scoped isolation. All database queries enforce tenant restrictions automatically based on session credentials.

---

## 🛠️ Development & Local Setup

```bash
# Install dependencies across monorepo
npm install

# Run dev server on port 3000
npm run dev

# Run linter
npm run lint

# Build for production
npm run build
```

---

*InfluenceOS — Engineered for scale, speed, and creator relationship management.*


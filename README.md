# 📰 ThreadNews

> A production-grade, fast, intelligent news aggregator and reader platform. Featuring automated real-time local and global feeds (RSS + Telegram), passive multi-source trend ranking, ad-free Reader Mode, 1-tap reactions, and AI 3-bullet summaries.

---

## 🏗️ Modular Architecture

```text
thread-news/
├── backend/            # Express Node.js API, Ingestion Engine (RSS + Telegram), Supabase DB
│   ├── src/
│   │   ├── config/     # Sources registry (Global, Local cities, Telegram channels)
│   │   ├── db/         # Supabase client & SQL migrations (001_initial_schema.sql, 002_rls_policies.sql)
│   │   ├── routes/     # Feed, article reader, and reaction endpoints
│   │   ├── services/   # Ingestion workers (Telegram, RSS, ENA), Readability parser, AI summarizer
│   │   └── index.js    # Express server entry point
│   └── package.json
│
├── web/                # Next.js Web Application (Desktop & Mobile Browser, SEO, Reader Mode)
│   └── package.json
│
├── mobile/             # React Native (Expo) Mobile App for iOS & Android
│   └── package.json
│
├── package.json        # Workspace orchestration
└── README.md
```

---

## 💡 The "Smart Reader" Experience

- **Zero Cold-Start / No Forced Voting**: Stories are ranked by **Velocity & Multi-Source Confirmation** (e.g. if both Tikvah Ethiopia and a local outlet report an event, it automatically bubbles to #1).
- **1-Tap Reactions**: Fast emotion badges (`🔥 Breaking`, `👍 Helpful`, `💡 Insightful`, `⚠️ Misleading`).
- **Offline Reader Mode**: Strips out ads and popups for instant 50ms reading.
- **AI 3-Bullet Summary**: Quick 5-second digest of any news story.

---

## 🚀 Quick Start (Backend API & Ingestion)

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create `backend/.env` (or copy from `.env.example`):
```env
PORT=5000
NODE_ENV=development
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key
```

### 3. Run the Backend API Server
```bash
npm run dev:backend
```
- API Server runs at `http://localhost:5000`
- Health check: `http://localhost:5000/api/health`
- Live Telegram feed test: `http://localhost:5000/api/feed/telegram/tikvahethiopia`

### 4. Trigger News Ingestion Sync
```bash
npm run sync
```
This fetches fresh articles from all registered outlets (Tikvah Telegram, Kulu Media, ENA, BBC, Al Jazeera, TechCrunch, The Verge) and idempotently saves them into Supabase with computed velocity scores.

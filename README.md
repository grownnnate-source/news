# 📰 ThreadNews

> A production-grade, fast, intelligent news aggregator and reader platform. Featuring automated real-time local and global feeds (RSS + Telegram), passive multi-source trend ranking, ad-free Reader Mode, 1-tap reactions, PesaCheck fact-checking badges, and Boring Report-style 3-bullet factual digests.

---

## 🏗️ Architecture

```text
thread-news/
├── backend/            # Express Node.js API, Ingestion Engine (RSS + Telegram + ENA), Supabase DB
│   ├── src/
│   │   ├── config/     # Sources registry (Global, Local cities, Telegram channels)
│   │   ├── db/         # Supabase client & SQL migrations
│   │   ├── routes/     # Feed, article reader, reactions, sources, and summarization
│   │   ├── services/   # Ingestion workers (Telegram, RSS, ENA), AI summarizer, cron scheduler
│   │   └── index.js    # Express server entry point & /health check
│   └── package.json
│
├── web/                # Next.js 16 (App Router) Broadsheet Web Application
│   ├── src/
│   │   ├── app/        # Layout, home page, global broadsheet styling
│   │   └── components/ # Masthead Header, LeadStory, StoryRow, ReaderModal, VideoModal
│   └── package.json
│
├── mobile/             # React Native (Expo) Mobile App for iOS & Android
│   ├── App.js          # Broadsheet mobile wire reader with offline storage & native share
│   └── package.json
│
├── render.yaml         # 1-Click Render Cloud Web Service deployment config
├── web/vercel.json     # Vercel Next.js edge deployment config
├── ROADMAP.md          # 8-Day production delivery schedule & verification checklist
├── package.json        # Workspace orchestration
└── README.md
```

---

## 💡 The "Smart Reader" Experience

- **Zero Cold-Start / No Forced Voting**: Stories are ranked by **Velocity & Multi-Source Confirmation** (e.g. if both Tikvah Ethiopia and a registered regional desk report an event, it automatically bubbles to #1).
- **1-Tap Reactions**: Fast emotion badges (`🔥 Breaking`, `👍 Helpful`, `💡 Insightful`, `⚠️ Misleading`).
- **PesaCheck Standards**: Accredited verification shield badges on corroborated dispatches (`🛡️ PesaCheck Corroborated`).
- **Offline Reader Mode**: Strips out ads and popups for instant 50ms reading on web and device-persisted offline storage on mobile.
- **AI 3-Bullet Takeaways**: Objective, de-sensationalized digests powered by Gemini 1.5 Flash (with zero-latency factual heuristic fallback).
- **1-Tap Native Share**: Direct WhatsApp, Telegram, X, and messaging shares with formatted headlines and takeaways.

---

## 🚀 Running the Project

### 1. Backend API & Ingestion Engine
```bash
# Start backend server (port 5000)
npm run dev:backend

# Run news ingestion sync across all 16 feeds
npm run sync
```
- API Server: `http://localhost:5000`
- Health check: `http://localhost:5000/api/health`
- Aggregated Feed: `http://localhost:5000/api/feed`

### 2. Next.js Broadsheet Web App
```bash
npm run dev:web
```
- Web Application: `http://localhost:3000`
- Production Build: `npm --prefix web run build`

### 3. Expo React Native Mobile App
```bash
npm run dev:mobile
```
- Scan the terminal QR code in **Expo Go** (iOS / Android) for live device testing.
- Press `w` to open in browser with mobile viewport emulation.

---

## 🌐 Production Deployment

- **Backend (Render)**: Connect repository to Render. It automatically detects `render.yaml` and provisions the web service.
- **Frontend (Vercel)**: Connect repository to Vercel with root directory set to `web`. Add environment variable:
  ```env
  NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
  ```

---

## 📋 8-Day Roadmap Status

All 8 milestones from [ROADMAP.md](ROADMAP.md) are **100% complete and verified**:

- [x] **Day 1**: Ingestion Engine (Telegram, RSS, ENA scrapers)
- [x] **Day 2**: Express API server with cached feed & reactions
- [x] **Day 3**: Supabase PostgreSQL database & 15-min background sync cron
- [x] **Day 4**: Next.js responsive feed layout & local/global scope switchers
- [x] **Day 5**: Ad-free Reader View, 1-tap reactions bar, and OpenGraph tags
- [x] **Day 6**: Expo React Native mobile feed setup & Expo Go testing
- [x] **Day 7**: Mobile offline storage, night mode, and native share sheets
- [x] **Day 8**: AI 3-bullet summaries, PesaCheck badges, and Render/Vercel configs

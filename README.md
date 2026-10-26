# 📰 ThreadNews

> A production-grade, fast, intelligent news aggregator and reader platform. Featuring automated real-time local and global feeds (RSS + Telegram), passive multi-source trend ranking, ad-free Reader Mode, 1-tap reactions, and AI 3-bullet summaries.

---

## 🏗️ Modular Architecture

```text
thread-news/
├── backend/            # Express Node.js API, Ingestion Engine (RSS + Telegram), Supabase DB
│   ├── src/
│   │   ├── config/     # Sources registry (Global, Local cities, Telegram channels)
│   │   ├── db/         # Supabase client & SQL migrations
│   │   ├── routes/     # Feed, article reader, and reaction endpoints
│   │   ├── services/   # Ingestion workers, Readability parser, AI 3-bullet summarizer
│   │   └── index.js    # Express server & background sync scheduler
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

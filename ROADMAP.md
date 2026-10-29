# 🗓️ ThreadNews — 8-Day Production Roadmap & Commit Schedule

> Daily paired-development roadmap ensuring high-velocity delivery, full architectural mastery, and a consistent green GitHub streak.

---

## 🟩 Overview Schedule

| Day | Date | Milestone | Key Deliverables | Planned Commit Message |
| :---: | :---: | :--- | :--- | :--- |
| **Day 1** | **Tue, Oct 27** | **Ingestion Engine** | • Multi-source ingest (Kulu, ENA, Google Gateway, Global)<br>• Ingestion tests & URL deduplication | `feat(ingest): add unified Ethiopian & global news engine` ✅ |
| **Day 2** | **Wed, Oct 28** | **Backend API & Cache** | • Express server on port 4000<br>• In-memory cache for instant 5ms responses<br>• `GET /api/feed` and `POST /api/articles/:id/react` | `feat(api): add cached feed endpoints & reaction system` |
| **Day 3** | **Thu, Oct 29** | **Database & Persistence** | • Connect Supabase PostgreSQL<br>• Tables for articles, sources, and reactions<br>• Background 15-minute sync scheduler | `feat(db): integrate Supabase schema & background sync cron` |
| **Day 4** | **Fri, Oct 30** | **Web App (Phase 1)** | • Next.js + Tailwind CSS in `web/`<br>• Top navigation: **Global** vs. **Local** toggle<br>• Responsive article cards & publisher badges | `feat(web): build Next.js feed layout & scope switcher` |
| **Day 5** | **Sat, Oct 31** | **Web App (Phase 2)** | • Ad-free **Reader View** page<br>• 1-tap reactions bar (`🔥`, `👍`, `💡`, `⚠️`)<br>• OpenGraph SEO tags for WhatsApp/Twitter previews | `feat(web): add Reader View, reactions & SEO preview tags` |
| **Day 6** | **Sun, Nov 1** | **Mobile App (Phase 1)** | • React Native (Expo) setup in `mobile/`<br>• Native feed UI & pull-to-refresh<br>• Live testing on physical phone via **Expo Go** | `feat(mobile): build Expo feed & test on physical device` |
| **Day 7** | **Mon, Nov 2** | **Mobile App (Phase 2)** | • Native article reader & night mode<br>• Offline storage (read without internet)<br>• Native share sheet for WhatsApp/Telegram | `feat(mobile): add offline article storage & native share` |
| **Day 8** | **Tue, Nov 3** | **AI Summaries & Launch** | • Free Google Gemini 3-bullet instant takeaway<br>• PesaCheck verification badge indicators<br>• Production deployment to Vercel & Render | `feat(ai): add 3-bullet summaries & deploy production build` |

---

## 📌 Daily Checklist & Standards

- [x] **Day 1**: Ingestion Engine verified with live local & global articles.
- [x] **Day 2**: Express API server running with `/api/feed`, `/api/articles/:id/reader`, and `/api/reactions`.
- [x] **Day 3**: Supabase database connected and background 15-minute sync scheduler active.
- [ ] **Day 4**: Web client displaying live news cards.
- [ ] **Day 5**: Reader mode with clean typography & instant reactions.
- [ ] **Day 6**: Mobile app running smoothly on Expo Go.
- [ ] **Day 7**: Offline caching working on device.
- [ ] **Day 8**: AI 3-bullet summaries active & production URLs live.

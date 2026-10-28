# ADR 001: Multi-Source Corroboration & Bilingual Verification Architecture

## Status
Accepted (October 28, 2026)

## Context
Regional news in the Horn of Africa, particularly Addis Ababa, is characterized by rapid dissemination through decentralized Telegram channels (e.g., `@tikvahethiopia`) alongside institutional state wires (ENA) and commercial press (The Reporter, Capital, Addis Standard, BBC Amharic). 

Key challenges:
1. **Linguistic Fragmentation**: Wires are published in Amharic, Afaan Oromoo, and English.
2. **Clickbait & Sensationalism**: Fast-moving breaking events frequently suffer from emotional hyperbole and unverified claims.
3. **CDN Availability**: Ethio Telecom routing occasionally throttles direct Telegram telesco.pe media links.

## Decisions

### 1. Bilingual Entity & Cluster Matching
Instead of naive word matching, articles are cross-referenced using:
- Normalized named entities (geographic locations, institutions, public figures).
- Temporal clustering within a rolling 6-hour window.
- Confidence scoring: When at least two independent sources report on the same entity cluster, the article receives the `Multi-Source Cross-Checked` verification badge.

### 2. Boring Report De-Sensationalization Model
Inspired by *Boring Report*, all incoming dispatches are parsed through a 3-bullet factual summarization pipeline. Sensationalist adjectives and clickbait emotional triggers are stripped, leaving 3 calm, declarative bullet points.

### 3. Broad-sheet Minimalist Reader
Ad-free reader mode with guaranteed <50ms load time, warm paper-white palette (`#FAF9F6`), serif typography, and double-ink rules modeled after *The New York Times* and *The Japan Times*.

### 4. Zero Cold-Start Velocity Metric
Articles are ranked dynamically via:
`velocity_score = (views_count / (hours_since_pub + 2)^1.5) + reaction_weight`
Ensuring fast-breaking bulletins rise instantly without requiring historical view thresholds.

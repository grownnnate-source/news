-- ==============================================================================
-- ThreadNews - Initial Database Schema Migration
-- Migration: 001_initial_schema.sql
-- Description: Core tables for sources, articles, reactions, and automated seed data
-- ==============================================================================

-- 1. Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Trigram extension for fast full-text title search

-- ------------------------------------------------------------------------------
-- 2. Table: sources
-- Tracks registered news outlets, Telegram channels, and RSS feeds
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(120) NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('telegram', 'rss', 'scraper')),
    handle_or_url TEXT NOT NULL,
    category VARCHAR(60) NOT NULL DEFAULT 'general',
    trust_tier SMALLINT NOT NULL DEFAULT 1 CHECK (trust_tier IN (1, 2, 3)),
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    scope VARCHAR(20) NOT NULL DEFAULT 'local' CHECK (scope IN ('local', 'global')),
    city VARCHAR(80),
    country_code VARCHAR(10),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_fetched_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint to prevent duplicate source registrations
CREATE UNIQUE INDEX IF NOT EXISTS idx_sources_handle_or_url ON sources(handle_or_url);

-- ------------------------------------------------------------------------------
-- 3. Table: articles
-- Core ingested news items, summaries, permanent media links, and ranking scores
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
    external_id VARCHAR(255) NOT NULL, -- e.g. 'tg-109132' or RSS GUID to prevent duplicates
    title TEXT NOT NULL,
    content TEXT,                      -- Clean article body or Telegram text
    summary JSONB,                     -- AI 3-bullet points: ["Point 1", "Point 2", "Point 3"]
    original_url TEXT NOT NULL,
    image_url TEXT,                    -- Permanent mirrored Supabase CDN URL
    original_image_url TEXT,           -- Original image URL before mirroring
    scope VARCHAR(20) NOT NULL DEFAULT 'local' CHECK (scope IN ('local', 'global')),
    city VARCHAR(80),
    category VARCHAR(60) NOT NULL DEFAULT 'general',
    views_count VARCHAR(40),           -- Raw view count if scraped (e.g., '109K')
    velocity_score FLOAT NOT NULL DEFAULT 0.0,
    cluster_id UUID,                   -- Grouping ID for multi-source confirmation
    is_breaking BOOLEAN NOT NULL DEFAULT FALSE,
    published_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Crucial: Idempotency index (never ingest the same article/post twice)
CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_source_external 
    ON articles(source_id, external_id);

-- Performance indexes for feeds, filtering, and velocity ranking
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_scope_city ON articles(scope, city, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_velocity ON articles(velocity_score DESC, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_title_trgm ON articles USING gin (title gin_trgm_ops);

-- ------------------------------------------------------------------------------
-- 4. Table: reactions
-- Fast 1-tap anonymous emotion reactions (breaking, helpful, insightful, misleading)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    device_hash VARCHAR(64) NOT NULL, -- SHA-256 client device fingerprint
    reaction_type VARCHAR(30) NOT NULL CHECK (reaction_type IN ('breaking', 'helpful', 'insightful', 'misleading')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Constraint: 1 reaction type per device per article
CREATE UNIQUE INDEX IF NOT EXISTS idx_reactions_unique_device 
    ON reactions(article_id, device_hash, reaction_type);

CREATE INDEX IF NOT EXISTS idx_reactions_article_id ON reactions(article_id);

-- ------------------------------------------------------------------------------
-- 5. Seed Data: Default Ethiopian and Global Sources
-- ------------------------------------------------------------------------------
INSERT INTO sources (name, type, handle_or_url, category, trust_tier, language, scope, city, country_code)
VALUES
    -- Telegram Sources
    ('Tikvah Ethiopia', 'telegram', 'tikvahethiopia', 'Breaking News', 2, 'am', 'local', 'Addis Ababa', 'ET'),
    
    -- Local Ethiopian Media
    ('Addis Standard', 'rss', 'https://addisstandard.com/feed/', 'Politics & Current Affairs', 1, 'en', 'local', 'Addis Ababa', 'ET'),
    ('Addis Standard Ethiopia Tag', 'rss', 'https://addisstandard.com/tag/ethiopia/feed/', 'National News', 1, 'en', 'local', 'Addis Ababa', 'ET'),
    ('Kulu Media', 'rss', 'https://kulu-media.com/feed/', 'Analysis & Society', 1, 'en', 'local', 'Addis Ababa', 'ET'),
    ('Ethiopian News Agency', 'scraper', 'https://www.ena.et/web/eng', 'National Wire', 1, 'en', 'local', 'Addis Ababa', 'ET'),
    
    -- Global Outlets
    ('BBC World News', 'rss', 'https://feeds.bbci.co.uk/news/world/rss.xml', 'World', 1, 'en', 'global', NULL, 'GB'),
    ('Al Jazeera English', 'rss', 'https://www.aljazeera.com/xml/rss/all.xml', 'World', 1, 'en', 'global', NULL, 'QA'),
    ('TechCrunch', 'rss', 'https://techcrunch.com/feed/', 'Technology', 1, 'en', 'global', NULL, 'US'),
    ('The Verge', 'rss', 'https://www.theverge.com/rss/index.xml', 'Technology', 1, 'en', 'global', NULL, 'US')
ON CONFLICT (handle_or_url) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 6. Helper View: articles_with_stats
-- Aggregates reaction counts per article for fast frontend consumption
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW articles_with_stats AS
SELECT 
    a.*,
    s.name AS source_name,
    s.type AS source_type,
    s.trust_tier AS source_trust_tier,
    COUNT(CASE WHEN r.reaction_type = 'breaking' THEN 1 END) AS count_breaking,
    COUNT(CASE WHEN r.reaction_type = 'helpful' THEN 1 END) AS count_helpful,
    COUNT(CASE WHEN r.reaction_type = 'insightful' THEN 1 END) AS count_insightful,
    COUNT(CASE WHEN r.reaction_type = 'misleading' THEN 1 END) AS count_misleading
FROM articles a
JOIN sources s ON a.source_id = s.id
LEFT JOIN reactions r ON a.id = r.article_id
GROUP BY a.id, s.name, s.type, s.trust_tier;

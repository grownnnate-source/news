-- ==============================================================================
-- ThreadNews - Expanded News Sources Migration
-- Migration: 003_expanded_sources.sql
-- Description: Adds high-credibility Ethiopian, African, and international feeds
-- ==============================================================================

INSERT INTO sources (name, type, handle_or_url, category, trust_tier, language, scope, city, country_code)
VALUES
    -- 1. Ethiopian Local & Regional Print / Wire Media
    ('BBC News Amharic', 'rss', 'https://feeds.bbci.co.uk/amharic/rss.xml', 'National News', 1, 'am', 'local', 'Addis Ababa', 'ET'),
    ('The Reporter Ethiopia', 'rss', 'https://www.thereporterethiopia.com/feed/', 'Politics & Business', 1, 'en', 'local', 'Addis Ababa', 'ET'),
    ('Capital Ethiopia', 'rss', 'https://capitalethiopia.com/feed/', 'Business & Economy', 1, 'en', 'local', 'Addis Ababa', 'ET'),
    ('Borkena News', 'rss', 'https://borkena.com/feed/', 'Politics & Current Affairs', 2, 'en', 'local', 'Addis Ababa', 'ET'),
    ('Google News Ethiopia', 'rss', 'https://news.google.com/rss/search?q=Ethiopia+when:3d&hl=en-US&gl=US&ceid=US:en', 'Aggregated Wire', 1, 'en', 'local', 'Addis Ababa', 'ET'),

    -- 2. Pan-African Coverage
    ('BBC News Africa', 'rss', 'https://feeds.bbci.co.uk/news/world/africa/rss.xml', 'Pan-Africa', 1, 'en', 'local', 'Nairobi', 'KE'),

    -- 3. International Prestige Outlets
    ('The Japan Times', 'rss', 'https://www.japantimes.co.jp/feed/', 'Asia & World', 1, 'en', 'global', 'Tokyo', 'JP')

ON CONFLICT (handle_or_url) DO NOTHING;

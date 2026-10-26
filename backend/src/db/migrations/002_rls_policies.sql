-- ==============================================================================
-- ThreadNews - Row Level Security (RLS) Policies
-- Migration: 002_rls_policies.sql
-- Description: Enables read/write access policies for mobile/web apps and users
-- ==============================================================================

-- 1. Enable RLS on all public tables
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if they were already created to prevent errors
DROP POLICY IF EXISTS "Public can view active sources" ON sources;
DROP POLICY IF EXISTS "Public can view all articles" ON articles;
DROP POLICY IF EXISTS "Public can view reactions" ON reactions;
DROP POLICY IF EXISTS "Anyone can insert reactions" ON reactions;

-- 3. Public Read Policies (Allow Web & Mobile clients to read news and sources)
CREATE POLICY "Public can view active sources" 
    ON sources FOR SELECT 
    USING (is_active = true);

CREATE POLICY "Public can view all articles" 
    ON articles FOR SELECT 
    USING (true);

CREATE POLICY "Public can view reactions" 
    ON reactions FOR SELECT 
    USING (true);

-- 4. Public Write Policies (Allow anonymous 1-tap reactions from devices)
CREATE POLICY "Anyone can insert reactions" 
    ON reactions FOR INSERT 
    WITH CHECK (true);

-- Note: Ingestion worker / Backend uses the Supabase 'service_role' secret key,
-- which automatically bypasses RLS to insert/update sources and articles securely.

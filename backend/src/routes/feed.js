import { Router } from "express";
import { fetchTelegramChannel } from "../services/telegramIngest.js";
import { supabase } from "../db/supabase.js";

const router = Router();

/**
 * GET /api/feed/telegram/:channel
 * Rapid direct scrape of any public Telegram channel for testing.
 */
router.get("/telegram/:channel", async (req, res) => {
  try {
    const { channel } = req.params;
    const limit = parseInt(req.query.limit, 10) || 10;

    console.log(`[API] Fetching Telegram feed for @${channel} (limit: ${limit})`);
    const posts = await fetchTelegramChannel(channel, limit);

    return res.json({
      success: true,
      channel,
      count: posts.length,
      data: posts
    });
  } catch (error) {
    console.error("[API Error] Telegram feed failed:", error.message);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch Telegram channel posts",
      details: error.message
    });
  }
});

/**
 * GET /api/feed
 * Main aggregated news feed with multi-factor filtering, velocity ranking, and pagination.
 * 
 * Query Params:
 *   - scope: 'local' | 'global' (default: 'local')
 *   - city: string (default: 'Addis Ababa')
 *   - category: string (optional)
 *   - sort: 'velocity' | 'latest' (default: 'latest')
 *   - search: string (optional query)
 *   - page: number (default: 1)
 *   - limit: number (default: 20)
 */
router.get("/", async (req, res) => {
  try {
    const {
      scope = "local",
      city = "Addis Ababa",
      category,
      sort = "latest",
      search,
      page = 1,
      limit = 20
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    // Build Supabase query using the articles_with_stats view
    let query = supabase
      .from("articles_with_stats")
      .select("*", { count: "exact" });

    // Scope filter (local vs global)
    if (scope) {
      query = query.eq("scope", scope);
    }

    // City filter (only applies to local scope)
    if (scope === "local" && city) {
      query = query.eq("city", city);
    }

    // Category filter
    if (category) {
      query = query.ilike("category", `%${category}%`);
    }

    // Full text search
    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    // Sorting: Velocity (Trending) vs Latest
    if (sort === "velocity") {
      query = query.order("velocity_score", { ascending: false });
    } else {
      query = query.order("published_at", { ascending: false });
    }

    // Pagination
    query = query.range(offset, offset + limitNum - 1);

    const { data: articles, count, error } = await query;

    // Fallback: If DB is empty, serve live preview from @tikvahethiopia
    if (error || !articles || articles.length === 0) {
      const fallbackPosts = await fetchTelegramChannel("tikvahethiopia", 5);
      return res.json({
        success: true,
        source: "live_fallback",
        message: "No articles found in database matching criteria. Serving live preview.",
        page: pageNum,
        total: fallbackPosts.length,
        count: fallbackPosts.length,
        data: fallbackPosts
      });
    }

    return res.json({
      success: true,
      source: "database",
      page: pageNum,
      limit: limitNum,
      total: count || articles.length,
      count: articles.length,
      data: articles
    });
  } catch (error) {
    console.error("[API Error] Feed retrieval failed:", error.message);
    return res.status(500).json({
      success: false,
      error: "Failed to retrieve feed",
      details: error.message
    });
  }
});

export default router;

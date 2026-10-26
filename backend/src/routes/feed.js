import { Router } from "express";
import { fetchTelegramChannel } from "../services/telegramIngest.js";
import { supabase } from "../db/supabase.js";

const router = Router();

/**
 * GET /api/feed/telegram/:channel
 * Scrapes or retrieves live posts directly from a public Telegram channel.
 * Perfect for rapid Postman testing and verification.
 * 
 * Query params:
 *   - limit: number (default 10)
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
 * Main aggregated news feed with scope and city filtering.
 * 
 * Query params:
 *   - scope: 'local' | 'global' (default: 'local')
 *   - city: string (default: 'Addis Ababa')
 *   - limit: number (default: 20)
 */
router.get("/", async (req, res) => {
  try {
    const { scope = "local", city = "Addis Ababa", limit = 20 } = req.query;

    // Try fetching from Supabase database
    const { data: articles, error } = await supabase
      .from("articles_with_stats")
      .select("*")
      .eq("scope", scope)
      .order("published_at", { ascending: false })
      .limit(parseInt(limit, 10));

    if (error || !articles || articles.length === 0) {
      // Fallback: If DB is not yet populated or credentials are placeholder,
      // return a live preview from @tikvahethiopia so the API is immediately testable!
      const fallbackPosts = await fetchTelegramChannel("tikvahethiopia", 5);
      return res.json({
        success: true,
        source: "live_fallback",
        message: "Database feed empty or not configured yet. Serving live preview.",
        count: fallbackPosts.length,
        data: fallbackPosts
      });
    }

    return res.json({
      success: true,
      source: "database",
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

import { Router } from "express";
import { supabase } from "../db/supabase.js";

const router = Router();

/**
 * GET /api/sources
 * Lists all registered news outlets, Telegram channels, and RSS feeds.
 */
router.get("/", async (req, res) => {
  try {
    const { data: sources, error } = await supabase
      .from("sources")
      .select("id, name, type, handle_or_url, category, trust_tier, language, scope, city, is_active, last_fetched_at")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      console.error("[API Error] Fetch sources error:", error.message);
      return res.status(500).json({
        success: false,
        error: "Failed to retrieve sources",
        details: error.message
      });
    }

    return res.json({
      success: true,
      count: sources?.length || 0,
      data: sources || []
    });
  } catch (error) {
    console.error("[API Error] Sources route failed:", error.message);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message
    });
  }
});

export default router;

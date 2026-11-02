import { Router } from "express";
import { supabase } from "../db/supabase.js";
import { generate3BulletDigest } from "../services/aiSummarizer.js";

const router = Router();

/**
 * Helper: Calculate reading time estimate in minutes
 */
function calculateReadingTime(text = "") {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
}

/**
 * GET /api/articles/:id
 * Retrieves a single article with aggregated reaction statistics and source details.
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data: article, error } = await supabase
      .from("articles_with_stats")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !article) {
      return res.status(404).json({
        success: false,
        error: "Article not found"
      });
    }

    return res.json({
      success: true,
      data: article
    });
  } catch (error) {
    console.error("[API Error] Fetch article failed:", error.message);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message
    });
  }
});

/**
 * GET /api/articles/:id/reader
 * Ad-free Reader Mode endpoint.
 * Returns clean sanitized article text, reading time, and source attribution.
 */
router.get("/:id/reader", async (req, res) => {
  try {
    const { id } = req.params;

    const { data: article, error } = await supabase
      .from("articles_with_stats")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !article) {
      return res.status(404).json({
        success: false,
        error: "Article not found for reader mode"
      });
    }

    const readingTime = calculateReadingTime(article.content || article.title);

    return res.json({
      success: true,
      readerMode: true,
      data: {
        id: article.id,
        title: article.title,
        content: article.content,
        summary: article.summary,
        imageUrl: article.image_url,
        publishedAt: article.published_at,
        readingTime,
        source: {
          name: article.source_name,
          type: article.source_type,
          url: article.original_url
        },
        reactions: {
          breaking: article.count_breaking || 0,
          helpful: article.count_helpful || 0,
          insightful: article.count_insightful || 0,
          misleading: article.count_misleading || 0
        }
      }
    });
  } catch (error) {
    console.error("[API Error] Reader mode failed:", error.message);
    return res.status(500).json({
      success: false,
      error: "Failed to generate reader mode",
      details: error.message
    });
  }
});

/**
 * POST /api/articles/:id/summarize
 * Generates an objective, 3-bullet factual digest using Gemini 1.5 Flash (with fallback),
 * saves it into Supabase, and returns the bullets.
 */
router.post("/:id/summarize", async (req, res) => {
  try {
    const { id } = req.params;

    const { data: article, error } = await supabase
      .from("articles")
      .select("id, title, content, summary")
      .eq("id", id)
      .single();

    if (error || !article) {
      return res.status(404).json({
        success: false,
        error: "Article not found"
      });
    }

    const summary = await generate3BulletDigest(article.title, article.content);

    // Persist generated summary into database
    await supabase
      .from("articles")
      .update({ summary })
      .eq("id", id);

    return res.json({
      success: true,
      articleId: id,
      engine: process.env.GEMINI_API_KEY ? "gemini-1.5-flash" : "factual-heuristic",
      summary
    });
  } catch (error) {
    console.error("[API Error] Summarization failed:", error.message);
    return res.status(500).json({
      success: false,
      error: "Failed to generate AI summary",
      details: error.message
    });
  }
});

export default router;

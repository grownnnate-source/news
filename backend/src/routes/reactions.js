import { Router } from "express";
import crypto from "node:crypto";
import { supabase } from "../db/supabase.js";

const router = Router();

const VALID_REACTIONS = ["breaking", "helpful", "insightful", "misleading"];

/**
 * POST /api/reactions
 * 1-Tap sentiment reaction endpoint.
 * Accepts anonymous device hash to prevent vote spamming without forcing user login.
 * 
 * Body:
 *   - articleId: string (UUID)
 *   - reactionType: 'breaking' | 'helpful' | 'insightful' | 'misleading'
 *   - deviceHash: string (optional, auto-generated from IP/User-Agent if not provided)
 */
router.post("/", async (req, res) => {
  try {
    const articleId = req.body.articleId || req.body.article_id;
    const reactionType = req.body.reactionType || req.body.reaction_type;
    const clientHash = req.body.deviceHash || req.body.device_hash;

    if (!articleId) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: articleId"
      });
    }

    if (!VALID_REACTIONS.includes(reactionType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid reactionType. Must be one of: ${VALID_REACTIONS.join(", ")}`
      });
    }

    // Generate fingerprint if client didn't provide one
    const deviceHash =
      clientHash ||
      crypto
        .createHash("sha256")
        .update((req.ip || "unknown") + (req.headers["user-agent"] || ""))
        .digest("hex");

    // Insert or ignore duplicate reaction from same device
    const { error: insertError } = await supabase
      .from("reactions")
      .upsert(
        {
          article_id: articleId,
          device_hash: deviceHash,
          reaction_type: reactionType
        },
        { onConflict: "article_id, device_hash, reaction_type" }
      );

    if (insertError) {
      console.error("[Reactions] Insert error:", insertError.message);
      return res.status(500).json({
        success: false,
        error: "Failed to record reaction",
        details: insertError.message
      });
    }

    // Retrieve updated reaction counts for this article
    const { data: counts } = await supabase
      .from("reactions")
      .select("reaction_type")
      .eq("article_id", articleId);

    const stats = {
      breaking: 0,
      helpful: 0,
      insightful: 0,
      misleading: 0
    };

    counts?.forEach((r) => {
      if (stats[r.reaction_type] !== undefined) {
        stats[r.reaction_type]++;
      }
    });

    return res.json({
      success: true,
      message: `Reaction '${reactionType}' recorded!`,
      articleId,
      reactions: stats
    });
  } catch (error) {
    console.error("[API Error] Reaction submission failed:", error.message);
    return res.status(500).json({
      success: false,
      error: "Failed to submit reaction",
      details: error.message
    });
  }
});

export default router;

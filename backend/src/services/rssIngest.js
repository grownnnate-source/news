import Parser from "rss-parser";
import crypto from "node:crypto";

const rssParser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  }
});

// Helper: Strip HTML tags to produce a clean text snippet
function cleanTextSnippet(htmlOrText = "") {
  if (!htmlOrText) return "";
  return htmlOrText
    .replace(/<[^>]*>?/gm, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 280);
}

/**
 * Generic RSS Feed Ingestion Service
 * Handles external ID normalization, thumbnail extraction, and SHA-256 hashing for long GUIDs.
 */
export async function fetchRssFeed(feedUrl, limit = 15) {
  try {
    const feed = await rssParser.parseURL(feedUrl);
    if (!feed?.items) return [];

    return feed.items.slice(0, limit).map((item) => {
      const rawText = item["content:encoded"] || item.content || item.contentSnippet || item.summary || "";
      const cleaned = cleanTextSnippet(rawText);
      const imageUrl = item.enclosure?.url || (item.mediaContent?.[0]?.$?.url) || null;
      const rawExternalId = item.guid || item.id || item.link;
      const externalId =
        String(rawExternalId).length > 250
          ? crypto.createHash("sha256").update(String(rawExternalId)).digest("hex")
          : String(rawExternalId);

      return {
        externalId,
        title: item.title ? item.title.trim() : "Untitled",
        content: cleaned,
        originalUrl: item.link || feedUrl,
        imageUrl,
        publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString()
      };
    });
  } catch (err) {
    console.warn(`[RSS Ingest] Warning for ${feedUrl}:`, err.message);
    return [];
  }
}

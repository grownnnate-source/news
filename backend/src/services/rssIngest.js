import dns from "node:dns";
import Parser from "rss-parser";

// Force IPv4 on Windows to prevent network timeouts
dns.setDefaultResultOrder?.("ipv4first");

const parser = new Parser({
  timeout: 12000,
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8"
  },
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: true }],
      ["media:thumbnail", "mediaThumbnail"],
      ["enclosure", "enclosure"]
    ]
  }
});

/**
 * Extracts the best image URL from an RSS item
 * Checks enclosures, media:content, media:thumbnail, and embedded <img> tags.
 */
function extractImageUrl(item) {
  // 1. Enclosure (e.g. podcasts or image attachments)
  if (item.enclosure?.url && item.enclosure.type?.startsWith("image/")) {
    return item.enclosure.url;
  }

  // 2. Media thumbnail
  if (item.mediaThumbnail?.$?.url) {
    return item.mediaThumbnail.$.url;
  }

  // 3. Media content array
  if (Array.isArray(item.mediaContent) && item.mediaContent.length > 0) {
    const imgObj = item.mediaContent.find(m => m?.$?.medium === "image" || m?.$?.url);
    if (imgObj?.$?.url) return imgObj.$.url;
  }

  // 4. Fallback: Parse <img> tag from content or description HTML
  const htmlBlob = item["content:encoded"] || item.content || item.description || "";
  const imgMatch = htmlBlob.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch && imgMatch[1]) {
    return imgMatch[1];
  }

  return null;
}

/**
 * Strips HTML tags and normalizes whitespace
 */
function cleanText(rawHtml) {
  if (!rawHtml) return "";
  return rawHtml
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Fetches and parses an RSS feed from a URL
 * 
 * @param {string} feedUrl - URL of the RSS feed
 * @param {number} limit - Maximum number of items to return (default: 15)
 * @returns {Promise<Array>} Normalized array of articles
 */
export async function fetchRssFeed(feedUrl, limit = 15) {
  try {
    const feed = await parser.parseURL(feedUrl);
    if (!feed?.items) return [];

    const items = feed.items.slice(0, limit).map((item) => {
      const rawText = item["content:encoded"] || item.content || item.contentSnippet || item.summary || "";
      const cleanedContent = cleanText(rawText);
      const imageUrl = extractImageUrl(item);

      // Unique external ID: GUID or Link or generated hash
      const externalId = item.guid || item.id || item.link;

      // Clean, normalized date
      let publishedAt = new Date().toISOString();
      if (item.isoDate) {
        publishedAt = item.isoDate;
      } else if (item.pubDate) {
        const parsed = new Date(item.pubDate);
        if (!isNaN(parsed.getTime())) {
          publishedAt = parsed.toISOString();
        }
      }

      return {
        externalId: String(externalId),
        title: item.title ? item.title.trim() : "Untitled",
        content: cleanedContent,
        originalUrl: item.link || feedUrl,
        imageUrl,
        publishedAt
      };
    });

    return items;
  } catch (error) {
    console.error(`[RSS Ingest] Failed to fetch feed ${feedUrl}:`, error.message);
    return [];
  }
}

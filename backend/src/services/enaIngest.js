import dns from "node:dns";
import axios from "axios";
import * as cheerio from "cheerio";

dns.setDefaultResultOrder?.("ipv4first");

/**
 * Scrapes breaking national wire news from Ethiopian News Agency (ENA) English portal.
 * 
 * @param {number} limit - Maximum articles to extract (default: 10)
 * @returns {Promise<Array>} Normalized array of articles
 */
export async function fetchEnaArticles(limit = 10) {
  try {
    const url = "https://www.ena.et/web/eng";
    const res = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      },
      timeout: 10000
    });

    const $ = cheerio.load(res.data);
    const articles = [];
    const seenLinks = new Set();

    $("a").each((i, el) => {
      const $el = $(el);
      const href = $el.attr("href");
      const title = $el.text().trim();

      if (
        href &&
        (href.includes("/web/eng/w/") || href.includes("article")) &&
        title.length > 25 &&
        !seenLinks.has(href)
      ) {
        seenLinks.add(href);
        const fullUrl = href.startsWith("http") ? href : `https://www.ena.et${href}`;
        const articleId = href.split("/").pop() || `ena-${Date.now()}-${i}`;

        // Look for adjacent or child image
        let imageUrl = null;
        const img = $el.find("img").attr("src") || $el.closest("div").find("img").attr("src");
        if (img) {
          imageUrl = img.startsWith("http") ? img : `https://www.ena.et${img}`;
        }

        articles.push({
          externalId: `ena-${articleId}`,
          title,
          content: title,
          originalUrl: fullUrl,
          imageUrl,
          publishedAt: new Date().toISOString()
        });
      }
    });

    return articles.slice(0, limit);
  } catch (err) {
    console.error("[ENA Ingest] Error scraping ENA:", err.message);
    return [];
  }
}

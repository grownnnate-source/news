import Parser from "rss-parser";
import axios from "axios";
import * as cheerio from "cheerio";
import { DEFAULT_CITIES, GLOBAL_FEEDS } from "../config/sources.js";

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

// 1. Ingest Kulu Media (Direct Ethiopian RSS)
export async function fetchKuluNews(limit = 10) {
  try {
    const feed = await rssParser.parseURL("https://kulu-media.com/feed/");
    return feed.items.slice(0, limit).map((item, idx) => ({
      id: `kulu-${idx}-${Buffer.from(item.link || "").toString("base64").slice(0, 10)}`,
      title: item.title ? item.title.trim() : "Untitled",
      summary: cleanTextSnippet(item.contentSnippet || item.content || ""),
      url: item.link,
      imageUrl: item.enclosure?.url || null,
      source: "Kulu Media",
      scope: "local",
      city: "Addis Ababa",
      country: "Ethiopia",
      category: "Regional News",
      trustTier: 2,
      publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString()
    }));
  } catch (error) {
    console.warn("[Ingest - Kulu] Warning:", error.message);
    return [];
  }
}

// 2. Ingest ENA (Ethiopian News Agency Headlines)
export async function fetchEnaNews(limit = 10) {
  try {
    const { data: html } = await axios.get("https://www.ena.et/web/eng", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      },
      timeout: 8000
    });

    const $ = cheerio.load(html);
    const articles = [];

    $("a").each((_, el) => {
      const href = $(el).attr("href");
      const title = $(el).text().trim();

      if (href && (href.includes("/web/eng/") || href.includes("article")) && title.length > 25) {
        const fullUrl = href.startsWith("http") ? href : `https://www.ena.et${href}`;
        // Avoid duplicate links in ENA list
        if (!articles.some((a) => a.url === fullUrl)) {
          articles.push({
            id: `ena-${Buffer.from(fullUrl).toString("base64").slice(0, 12)}`,
            title,
            summary: "Official dispatch from the Ethiopian News Agency (ENA).",
            url: fullUrl,
            imageUrl: null,
            source: "Ethiopian News Agency (ENA)",
            scope: "local",
            city: "Addis Ababa",
            country: "Ethiopia",
            category: "National",
            trustTier: 1,
            publishedAt: new Date().toISOString()
          });
        }
      }
    });

    return articles.slice(0, limit);
  } catch (error) {
    console.warn("[Ingest - ENA] Warning:", error.message);
    return [];
  }
}

// 3. Ingest Google News Geo-Search (for any city like Addis Ababa, Nairobi, London)
export async function fetchGoogleGeoNews(cityName = "Addis Ababa", countryCode = "ET", limit = 10) {
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(cityName)}+when:3d&hl=en&gl=${countryCode}&ceid=${countryCode}:en`;

  try {
    const feed = await rssParser.parseURL(rssUrl);
    return feed.items.slice(0, limit).map((item, idx) => {
      // Google News titles are usually "Title - Publisher"
      let title = item.title ? item.title.trim() : "Untitled";
      let publisher = "Google News";
      const parts = title.split(" - ");
      if (parts.length > 1) {
        publisher = parts.pop().trim();
        title = parts.join(" - ").trim();
      }

      return {
        id: `geo-${encodeURIComponent(cityName)}-${idx}-${Buffer.from(item.link || "").toString("base64").slice(0, 8)}`,
        title,
        summary: cleanTextSnippet(item.contentSnippet || item.content || ""),
        url: item.link,
        imageUrl: null,
        source: publisher,
        scope: "local",
        city: cityName,
        country: countryCode,
        category: "City News",
        trustTier: 2,
        publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString()
      };
    });
  } catch (error) {
    console.warn(`[Ingest - Geo ${cityName}] Warning:`, error.message);
    return [];
  }
}

// 4. Ingest Global Outlets (BBC, Al Jazeera, TechCrunch, The Verge)
export async function fetchGlobalOutlets(limitPerFeed = 5) {
  const promises = GLOBAL_FEEDS.map(async (feedConfig) => {
    try {
      const feed = await rssParser.parseURL(feedConfig.url);
      return feed.items.slice(0, limitPerFeed).map((item, idx) => ({
        id: `global-${feedConfig.name.toLowerCase().replace(/\s+/g, "-")}-${idx}`,
        title: item.title ? item.title.trim() : "Untitled",
        summary: cleanTextSnippet(item.contentSnippet || item.content || ""),
        url: item.link,
        imageUrl: item.enclosure?.url || null,
        source: feedConfig.name,
        scope: "global",
        city: null,
        country: "International",
        category: feedConfig.category,
        trustTier: feedConfig.trustTier || 1,
        publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString()
      }));
    } catch (err) {
      console.warn(`[Ingest - Global ${feedConfig.name}] Warning:`, err.message);
      return [];
    }
  });

  const results = await Promise.allSettled(promises);
  return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}

// 5. Unified Master Ingest: Pulls all and deduplicates
export async function fetchAllNews({ scope = "all", city = "Addis Ababa" } = {}) {
  const tasks = [];

  if (scope === "all" || scope === "local") {
    // Local sources
    tasks.push(fetchKuluNews(8));
    tasks.push(fetchEnaNews(8));
    tasks.push(fetchGoogleGeoNews(city, "ET", 8));
  }

  if (scope === "all" || scope === "global") {
    // Global sources
    tasks.push(fetchGlobalOutlets(5));
  }

  const results = await Promise.allSettled(tasks);
  const allArticles = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));

  // Deduplicate articles by title / url
  const seenUrls = new Set();
  const seenTitles = new Set();
  const deduplicated = [];

  for (const article of allArticles) {
    if (!article.url || !article.title) continue;
    const normalizedTitle = article.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 40);

    if (!seenUrls.has(article.url) && !seenTitles.has(normalizedTitle)) {
      seenUrls.add(article.url);
      seenTitles.add(normalizedTitle);
      deduplicated.push(article);
    }
  }

  // Sort by date (freshest first)
  deduplicated.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return deduplicated;
}

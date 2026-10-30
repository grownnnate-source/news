import { supabase } from "../db/supabase.js";
import { fetchTelegramChannel } from "../services/telegramIngest.js";
import { fetchRssFeed } from "../services/rssIngest.js";

/**
 * ThreadNews Pipeline Verification Suite
 * Tests Telegram scraping, RSS ingestion, and Supabase connectivity.
 */

async function runVerification() {
  console.log("🚀 Testing ThreadNews Pipeline...\n");

  // 1. Test Supabase Connectivity
  const { data: sources, error } = await supabase.from("sources").select("id, name, type").limit(3);
  if (error) {
    console.error("❌ Supabase DB check failed:", error.message);
  } else {
    console.log(`✅ Supabase Connected: ${sources.length} sample sources retrieved.`);
  }

  // 2. Test Telegram Ingest
  try {
    const tgArticles = await fetchTelegramChannel("tikvahethiopia", 3);
    console.log(`✅ Telegram Scraping: ${tgArticles.length} articles from @tikvahethiopia.`);
  } catch (err) {
    console.error("❌ Telegram Scraping failed:", err.message);
  }

  // 3. Test RSS Ingest
  try {
    const rssArticles = await fetchRssFeed("https://feeds.bbci.co.uk/news/world/rss.xml", 3);
    console.log(`✅ RSS Parsing: ${rssArticles.length} articles from BBC World News.`);
  } catch (err) {
    console.error("❌ RSS Parsing failed:", err.message);
  }

  console.log("\n🎉 Pipeline verification complete!\n");
  process.exit(0);
}

runVerification();

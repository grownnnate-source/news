import { supabase } from "../db/supabase.js";
import { fetchTelegramChannel } from "./telegramIngest.js";
import { fetchRssFeed } from "./rssIngest.js";
import { fetchEnaArticles } from "./enaIngest.js";

/**
 * Calculates a passive velocity score based on view counts and recency.
 * Avoids the "empty voting room / cold start" problem.
 */
function calculateVelocity(item) {
  let baseScore = 10.0;

  // If view count is known (e.g. "120K", "99.8K" on Telegram)
  if (item.views) {
    const rawViews = item.views.toUpperCase();
    if (rawViews.includes("K")) {
      const num = parseFloat(rawViews.replace("K", ""));
      baseScore += num * 1.5;
    } else if (rawViews.includes("M")) {
      const num = parseFloat(rawViews.replace("M", ""));
      baseScore += num * 1500;
    } else {
      const num = parseFloat(rawViews);
      if (!isNaN(num)) baseScore += num / 1000;
    }
  }

  // Recency factor: Decay score if published more than 24 hours ago
  const hoursOld = (Date.now() - new Date(item.publishedAt).getTime()) / (1000 * 60 * 60);
  if (hoursOld > 0) {
    const decay = Math.max(0.2, 1 - hoursOld * 0.03); // lose 3% per hour
    baseScore *= decay;
  }

  return parseFloat(baseScore.toFixed(2));
}

/**
 * Master Ingestion Worker
 * Iterates through all active sources, scrapes/fetches items, and upserts into Supabase.
 */
export async function runIngestionWorker() {
  console.log("\n=======================================================");
  console.log(`🚀 [Ingestion Worker] Starting news sync at ${new Date().toISOString()}`);
  console.log("=======================================================\n");

  const startTime = Date.now();
  let totalFetched = 0;
  let totalUpserted = 0;
  let totalErrors = 0;

  try {
    // 1. Fetch active sources from database
    const { data: sources, error } = await supabase
      .from("sources")
      .select("*")
      .eq("is_active", true);

    if (error) {
      throw new Error(`Failed to query sources from database: ${error.message}`);
    }

    if (!sources || sources.length === 0) {
      console.log("⚠️ No active sources found in 'sources' table.");
      return { totalFetched: 0, totalUpserted: 0 };
    }

    console.log(`📋 Found ${sources.length} active sources to sync.\n`);

    // 2. Process each source
    for (const source of sources) {
      console.log(`📡 Ingesting: [${source.type.toUpperCase()}] ${source.name} (${source.handle_or_url})...`);

      let rawItems = [];

      try {
        if (source.type === "telegram") {
          rawItems = await fetchTelegramChannel(source.handle_or_url, 15);
        } else if (source.type === "rss") {
          rawItems = await fetchRssFeed(source.handle_or_url, 15);
        } else if (source.type === "scraper" && (source.name.includes("ENA") || source.name.includes("Ethiopian News Agency"))) {
          rawItems = await fetchEnaArticles(15);
        }
      } catch (err) {
        console.error(`❌ Ingestion failed for ${source.name}:`, err.message);
        totalErrors++;
        continue;
      }

      if (!rawItems || rawItems.length === 0) {
        console.log(`   └─ 0 items retrieved (source may be temporarily unreachable or empty).\n`);
        continue;
      }

      totalFetched += rawItems.length;

      // 3. Map to database schema
      const articlesToUpsert = rawItems.map((item) => {
        const publishedAt = item.publishedAt || new Date().toISOString();
        const velocity = calculateVelocity(item);

        return {
          source_id: source.id,
          external_id: String(item.externalId || item.id || item.url || item.link),
          title: item.title,
          content: item.content || item.title,
          original_url: item.originalUrl || item.url || item.link,
          image_url: item.imageUrl || null,
          original_image_url: item.imageUrl || null,
          scope: source.scope || "local",
          city: source.city || null,
          category: source.category || "General",
          views_count: item.views || null,
          velocity_score: velocity,
          published_at: publishedAt
        };
      });

      // 4. Upsert into Supabase (Idempotent: updates if existing, inserts if new)
      const { data: upsertedData, error: upsertError } = await supabase
        .from("articles")
        .upsert(articlesToUpsert, {
          onConflict: "source_id, external_id",
          ignoreDuplicates: false
        })
        .select("id");

      if (upsertError) {
        console.error(`   └─ ❌ Upsert error into 'articles':`, upsertError.message);
        totalErrors++;
      } else {
        const count = upsertedData?.length || articlesToUpsert.length;
        totalUpserted += count;
        console.log(`   └─ ✅ Successfully synced ${count} articles into database.`);
      }

      // 5. Update last_fetched_at timestamp on source
      await supabase
        .from("sources")
        .update({ last_fetched_at: new Date().toISOString() })
        .eq("id", source.id);

      console.log("");
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log("=======================================================");
    console.log(`🎉 [Sync Complete] in ${duration}s`);
    console.log(`   Total Fetched : ${totalFetched}`);
    console.log(`   Total Upserted: ${totalUpserted}`);
    console.log(`   Errors / Skips: ${totalErrors}`);
    console.log("=======================================================\n");

    return { totalFetched, totalUpserted, totalErrors };
  } catch (err) {
    console.error("💥 Critical Ingestion Worker Failure:", err.message);
    throw err;
  }
}

// Allow direct CLI execution: node backend/src/services/ingestionWorker.js
if (process.argv[1]?.includes("ingestionWorker.js")) {
  runIngestionWorker()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

import { fetchAllNews } from "../services/rssIngest.js";

async function verify() {
  console.log("🚀 Running master ingest (Local Addis Ababa + Global Outlets)...\n");
  const startTime = Date.now();
  const articles = await fetchAllNews({ scope: "all", city: "Addis Ababa" });
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`✅ Ingest completed in ${duration}s. Total articles retrieved: ${articles.length}\n`);

  // Show breakdown by source
  const sourceCounts = {};
  articles.forEach((a) => {
    sourceCounts[a.source] = (sourceCounts[a.source] || 0) + 1;
  });

  console.log("📊 Breakdown by Source:");
  console.table(sourceCounts);

  console.log("\n📰 Top 3 Freshest Headlines:");
  articles.slice(0, 3).forEach((a, i) => {
    console.log(`[${i + 1}] [${a.source}] ${a.title}`);
    console.log(`    Date: ${a.publishedAt} | URL: ${a.url}\n`);
  });
}

verify();

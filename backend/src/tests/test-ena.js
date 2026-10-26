import axios from "axios";
import * as cheerio from "cheerio";

async function testEna() {
  try {
    const res = await axios.get("https://www.ena.et/web/eng", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      },
      timeout: 10000
    });
    const $ = cheerio.load(res.data);
    console.log(`ENA Title: ${$("title").text().trim()}`);
    
    // Look for article links
    const articles = [];
    $("a").each((i, el) => {
      const href = $(el).attr("href");
      const title = $(el).text().trim();
      if (href && (href.includes("/web/eng/") || href.includes("article")) && title.length > 25) {
        articles.push({ title, link: href.startsWith("http") ? href : `https://www.ena.et${href}` });
      }
    });

    console.log(`Found ${articles.length} news headlines on ENA homepage!`);
    articles.slice(0, 3).forEach((a, idx) => {
      console.log(`[ENA ${idx + 1}] ${a.title} -> ${a.link}`);
    });
  } catch (err) {
    console.error("ENA error:", err.message);
  }
}

testEna();

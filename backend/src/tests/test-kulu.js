import Parser from "rss-parser";

const parser = new Parser();

async function testKulu() {
  try {
    const feed = await parser.parseURL("https://kulu-media.com/feed/");
    console.log(`Feed Title: ${feed.title}`);
    console.log(`Total items: ${feed.items.length}\n`);
    feed.items.slice(0, 3).forEach((item, i) => {
      console.log(`[Item ${i+1}]`);
      console.log(`Title: ${item.title}`);
      console.log(`Date : ${item.pubDate}`);
      console.log(`Link : ${item.link}\n`);
    });
  } catch (err) {
    console.error("Kulu error:", err.message);
  }
}

testKulu();

import { fetchTelegramChannel } from "../services/telegramIngest.js";

async function test() {
  console.log("📡 Fetching latest 3 posts from @tikvahethiopia...\n");
  const posts = await fetchTelegramChannel("tikvahethiopia", 3);
  
  if (posts.length === 0) {
    console.log("❌ No posts retrieved. Check network connection.");
    return;
  }

  posts.forEach((p, i) => {
    console.log(`--- [Post ${i + 1}] ---`);
    console.log(`Headline : ${p.title}`);
    console.log(`Date     : ${p.publishedAt}`);
    console.log(`Views    : ${p.views}`);
    console.log(`Photo URL: ${p.imageUrl || 'None'}`);
    console.log(`Link     : ${p.url}\n`);
  });
  console.log(`✅ Success! Retrieved ${posts.length} real live posts.`);
}

test();

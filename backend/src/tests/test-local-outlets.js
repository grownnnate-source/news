import axios from "axios";

const urls = [
  "https://addisstandard.com/feed/",
  "https://addisstandard.com/tag/ethiopia/feed/",
  "https://kulu-media.com/feed/",
  "https://www.ena.et/web/eng"
];

async function check() {
  for (const url of urls) {
    try {
      const res = await axios.get(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
        timeout: 10000
      });
      console.log(`[${res.status} OK] ${url} - Content-Type: ${res.headers['content-type']}`);
    } catch (err) {
      console.log(`[ERR] ${url} -> ${err.message}`);
    }
  }
}

check();

import axios from "axios";

async function testAddisStandard() {
  try {
    const res = await axios.get("https://addisstandard.com/feed/", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5"
      },
      timeout: 10000
    });
    console.log(`Addis Standard with full header: ${res.status} OK!`);
  } catch (err) {
    console.log(`Addis Standard error: ${err.message} (Status: ${err.response?.status})`);
  }
}

testAddisStandard();

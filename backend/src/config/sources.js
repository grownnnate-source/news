// Supported Local Cities, Global RSS Feeds, and Telegram Channels

export const DEFAULT_CITIES = [
  { name: "Addis Ababa", countryCode: "ET", region: "East Africa" },
  { name: "Nairobi", countryCode: "KE", region: "East Africa" },
  { name: "London", countryCode: "GB", region: "Europe" },
  { name: "New York", countryCode: "US", region: "North America" },
  { name: "Tokyo", countryCode: "JP", region: "Asia" },
  { name: "Toronto", countryCode: "CA", region: "North America" }
];

export const TELEGRAM_CHANNELS = [
  {
    handle: "tikvahethiopia",
    name: "Tikvah Ethiopia",
    language: "am",
    category: "Breaking News",
    trustTier: 2
  }
];

export const GLOBAL_FEEDS = [
  {
    name: "BBC News",
    url: "https://feeds.bbci.co.uk/news/world/rss.xml",
    category: "World",
    trustTier: 1
  },
  {
    name: "Al Jazeera English",
    url: "https://www.aljazeera.com/xml/rss/all.xml",
    category: "World",
    trustTier: 1
  },
  {
    name: "TechCrunch",
    url: "https://techcrunch.com/feed/",
    category: "Technology",
    trustTier: 1
  },
  {
    name: "The Verge",
    url: "https://www.theverge.com/rss/index.xml",
    category: "Technology",
    trustTier: 1
  }
];

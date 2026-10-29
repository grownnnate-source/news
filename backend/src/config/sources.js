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

export const LOCAL_ETHIOPIAN_FEEDS = [
  {
    name: "BBC News Amharic",
    url: "https://feeds.bbci.co.uk/amharic/rss.xml",
    category: "National News",
    language: "am",
    trustTier: 1
  },
  {
    name: "The Reporter Ethiopia",
    url: "https://www.thereporterethiopia.com/feed/",
    category: "Politics & Business",
    language: "en",
    trustTier: 1
  },
  {
    name: "Capital Ethiopia",
    url: "https://capitalethiopia.com/feed/",
    category: "Business & Economy",
    language: "en",
    trustTier: 1
  },
  {
    name: "Kulu Media",
    url: "https://kulu-media.com/feed/",
    category: "Security & Regional News",
    language: "en",
    trustTier: 2
  },
  {
    name: "Borkena News",
    url: "https://borkena.com/feed/",
    category: "Current Affairs",
    language: "en",
    trustTier: 2
  },
  {
    name: "Google News Ethiopia",
    url: "https://news.google.com/rss/search?q=Ethiopia+when:3d&hl=en-US&gl=US&ceid=US:en",
    category: "Aggregated Wire",
    language: "en",
    trustTier: 1
  }
];

export const GLOBAL_FEEDS = [
  {
    name: "BBC News Africa",
    url: "https://feeds.bbci.co.uk/news/world/africa/rss.xml",
    category: "Pan-Africa",
    trustTier: 1
  },
  {
    name: "BBC World News",
    url: "https://feeds.bbci.co.uk/news/world/rss.xml",
    category: "World",
    trustTier: 1
  },
  {
    name: "Al Jazeera English",
    url: "https://www.aljazeera.com/xml/rss/all.xml",
    category: "World & Middle East",
    trustTier: 1
  },
  {
    name: "The Japan Times",
    url: "https://www.japantimes.co.jp/feed/",
    category: "Asia & World",
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

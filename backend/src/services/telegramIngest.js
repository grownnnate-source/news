import dns from "node:dns";
import axios from "axios";
import * as cheerio from "cheerio";

// Force IPv4 on Windows to prevent network timeouts
dns.setDefaultResultOrder?.("ipv4first");

/**
 * Scrapes the latest public messages from a Telegram channel using Telegram's web preview.
 * Example URL: https://t.me/s/tikvahethiopia
 * 
 * @param {string} channelHandle - The username of the public channel (e.g. "tikvahethiopia")
 * @param {number} limit - Maximum number of recent posts to extract (default 10)
 * @returns {Promise<Array>} Array of parsed news items
 */
export async function fetchTelegramChannel(channelHandle = "tikvahethiopia", limit = 10) {
  const url = `https://t.me/s/${channelHandle}`;

  try {
    const { data: html } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9,am;q=0.8"
      },
      timeout: 10000
    });

    const $ = cheerio.load(html);
    const posts = [];

    // Telegram renders each message in a container with class 'tgme_widget_message'
    $(".tgme_widget_message").each((index, el) => {
      const $el = $(el);

      // Extract permanent message link (e.g. https://t.me/tikvahethiopia/12345)
      const link = $el.find("a.tgme_widget_message_date").attr("href");
      if (!link) return;

      const messageId = link.split("/").pop();

      // Extract message text
      const rawText = $el.find(".tgme_widget_message_text").text().trim();
      if (!rawText) return; // Skip media-only messages with no text/caption

      // Extract date
      const timeElem = $el.find("time");
      const pubDate = timeElem.attr("datetime") || new Date().toISOString();

      // Extract photo if present (Telegram puts it in background-image style)
      let imageUrl = null;
      const photoWrap = $el.find(".tgme_widget_message_photo_wrap");
      if (photoWrap.length) {
        const style = photoWrap.attr("style") || "";
        const match = style.match(/background-image:url\('([^']+)'\)/);
        if (match && match[1]) {
          imageUrl = match[1];
        }
      }

      // Extract view count if visible (e.g. "150.2K")
      const views = $el.find(".tgme_widget_message_views").text().trim() || null;

      // Create a clean title from the first sentence or first 120 characters
      const firstLine = rawText.split("\n")[0].trim();
      const title = firstLine.length > 130 ? firstLine.slice(0, 127) + "..." : firstLine;

      posts.push({
        id: `tg-${channelHandle}-${messageId}`,
        telegramId: messageId,
        title,
        content: rawText,
        url: link,
        imageUrl,
        source: channelHandle === "tikvahethiopia" ? "Tikvah Ethiopia" : `@${channelHandle}`,
        channelHandle,
        views,
        scope: "local",
        city: "Addis Ababa",
        category: "Breaking News",
        verificationStatus: "verified",
        publishedAt: pubDate
      });
    });

    // Telegram shows oldest at top, so reverse to have freshest first, then take limit
    return posts.reverse().slice(0, limit);
  } catch (error) {
    console.error(`[Telegram Ingest] Failed to scrape @${channelHandle}:`, error.message);
    return [];
  }
}

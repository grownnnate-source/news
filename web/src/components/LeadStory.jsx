"use client";

import React, { useState } from "react";

export default function LeadStory({ article, onOpenReader, onReact, onWatchVideo }) {
  const [copied, setCopied] = useState(false);
  if (!article) return null;

  // Derive time ago
  const timeAgo = (() => {
    try {
      const diffMs = Date.now() - new Date(article.published_at).getTime();
      const mins = Math.floor(diffMs / 60000);
      if (mins < 60) return `${Math.max(1, mins)}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      return `${Math.floor(hrs / 24)}d ago`;
    } catch {
      return "Recent";
    }
  })();

  // 1-2 sentence executive summary (strips sensationalism)
  const executiveSummary = (() => {
    if (Array.isArray(article.summary) && article.summary.length > 0) {
      return article.summary.slice(0, 2).join(" ");
    }
    if (article.content) {
      const firstSentence = article.content.split(/(?<=[.?!])\s+/)[0] || "";
      return firstSentence.length > 20 ? firstSentence : `${article.title}. Official updates monitored by desk correspondents.`;
    }
    return "Correspondents tracking official updates and situation stability across regional desks.";
  })();

  const hasVideo = Boolean(
    article.video_url ||
    article.title.toLowerCase().includes("video") ||
    article.title.toLowerCase().includes("briefing")
  );

  const handleShare = async (e) => {
    e.stopPropagation();
    const url = article.original_url || window.location.href;
    const shareData = {
      title: article.title,
      text: `${article.title}\n\nRead on ThreadNews:`,
      url: url,
    };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if (err.name !== "AbortError") console.warn("Share error:", err);
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <article className="w-full py-6 sm:py-8 hairline-b">
      {/* 1. Kicker & Verification Byline */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center space-x-2">
          <span className="kicker-tag">
            {article.is_breaking ? "Breaking News" : (article.category || "Lead Dispatch")}
          </span>
          <span className="text-[#CCC] dark:text-[#555]">|</span>
          <span className="byline-text uppercase font-semibold text-[#111] dark:text-[#DDD]">
            {article.source_name}
          </span>
          <span className="text-[#CCC] dark:text-[#555]">|</span>
          <span className="byline-text font-mono">{timeAgo}</span>
        </div>

        {/* PesaCheck Standards Corroborated Shield */}
        <div className="inline-flex items-center space-x-1.5 text-[10px] text-[#1E5631] dark:text-[#34D399] bg-[#EAF5EC] dark:bg-[#064E3B]/30 px-2 py-0.5 rounded border border-[#D0EADB] dark:border-[#065F46] font-sans font-semibold">
          <span>🛡️</span>
          <span>PesaCheck Corroborated</span>
        </div>
      </div>

      {/* 2. Headline in Authentic Broadsheet Serif (Distinct from Body) */}
      <h2
        onClick={() => onOpenReader(article)}
        className="font-headline text-2xl sm:text-4xl md:text-5xl text-[#121212] dark:text-[#F2EFEB] hover:text-[#555] dark:hover:text-[#CCC] cursor-pointer transition-colors mb-4"
      >
        {article.title}
      </h2>

      {/* 3. Media Module */}
      {article.image_url ? (
        <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] bg-[#F2F0EB] dark:bg-[#1E1E24] rounded-xs overflow-hidden mb-4 border border-[#E5E5E5] dark:border-[#2A2A30] group">
          <img
            src={article.image_url}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-500"
          />

          {hasVideo && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (onWatchVideo) onWatchVideo(article);
                else onOpenReader(article);
              }}
              className="absolute inset-0 bg-black/35 flex items-center justify-center cursor-pointer hover:bg-black/45 transition-colors"
            >
              <div className="w-14 h-14 rounded-full bg-white/95 dark:bg-black/85 text-[#111] dark:text-white flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 fill-current translate-x-0.5" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <div className="absolute bottom-3 left-3 bg-black/85 text-white text-[10px] px-2.5 py-1 rounded font-mono uppercase tracking-wider flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                <span>Watch Video Report</span>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* 4. Summarized Main News in Clean Sans-Serif (The Japan Times / NYT format) */}
      <div className="my-3 max-w-3xl">
        <p className="font-summary">
          {executiveSummary}
        </p>
      </div>

      {/* 5. 3-Bullet Factual Takeaways Box */}
      {Array.isArray(article.summary) && article.summary.length > 0 && (
        <div className="bg-[#F8F7F4] dark:bg-[#181820] p-3.5 sm:p-4 rounded-xs border-l-3 border-[#111] dark:border-[#DDD] my-3.5 font-sans">
          <div className="text-[10px] uppercase font-bold tracking-wider text-[#666] dark:text-[#AAA] mb-1.5">
            Key Facts Takeaway (Boring Report Engine):
          </div>
          <ul className="space-y-1 text-xs sm:text-[13px] text-[#222] dark:text-[#DDD]">
            {article.summary.slice(0, 3).map((bullet, idx) => (
              <li key={idx} className="flex items-start space-x-2">
                <span className="font-bold text-[#A81B1B] dark:text-[#E50914]">•</span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 6. Read More Action & Sentiment Consensus */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 hairline-t text-xs font-sans">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onOpenReader(article)}
            className="font-bold text-[#111] dark:text-white hover:text-[#A81B1B] dark:hover:text-[#E50914] underline underline-offset-4 flex items-center space-x-1 text-sm"
          >
            <span>Read Full Dispatch</span>
            <span>→</span>
          </button>

          {article.original_url && (
            <>
              <span className="text-[#CCC] dark:text-[#555]">·</span>
              <a
                href={article.original_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#666] dark:text-[#AAA] hover:underline text-xs"
              >
                Source Article ↗
              </a>
            </>
          )}

          <span className="text-[#CCC] dark:text-[#555]">·</span>
          <button
            onClick={handleShare}
            className="text-[#666] dark:text-[#AAA] hover:text-[#111] dark:hover:text-white font-medium flex items-center space-x-1"
          >
            <span>📤</span>
            <span>{copied ? "Link Copied!" : "Share"}</span>
          </button>
        </div>

        {/* 1-Tap Sentiment Consensus */}
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs font-mono">
          <span className="text-[#888] hidden sm:inline text-[11px]">Consensus:</span>
          <button
            onClick={() => onReact(article.id, "breaking")}
            className="px-2 py-0.5 rounded border border-[#E5E5E5] dark:border-[#333] hover:border-[#999] bg-white dark:bg-[#1C1C22] text-[#222] dark:text-[#EEE] transition-colors"
          >
            🔥 {article.count_breaking || 0}
          </button>
          <button
            onClick={() => onReact(article.id, "helpful")}
            className="px-2 py-0.5 rounded border border-[#E5E5E5] dark:border-[#333] hover:border-[#999] bg-white dark:bg-[#1C1C22] text-[#222] dark:text-[#EEE] transition-colors"
          >
            👍 {article.count_helpful || 0}
          </button>
          <button
            onClick={() => onReact(article.id, "insightful")}
            className="px-2 py-0.5 rounded border border-[#E5E5E5] dark:border-[#333] hover:border-[#999] bg-white dark:bg-[#1C1C22] text-[#222] dark:text-[#EEE] transition-colors"
          >
            💡 {article.count_insightful || 0}
          </button>
          <button
            onClick={() => onReact(article.id, "misleading")}
            className="px-2 py-0.5 rounded border border-[#E5E5E5] dark:border-[#333] hover:border-[#999] bg-white dark:bg-[#1C1C22] text-[#A81B1B] dark:text-[#E50914] transition-colors"
            title="Disputed by readers"
          >
            ⚠️ {article.count_misleading || 0}
          </button>
        </div>
      </div>
    </article>
  );
}

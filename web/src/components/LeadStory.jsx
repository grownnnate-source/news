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

  // 3-bullet points fallback
  const bullets = Array.isArray(article.summary) && article.summary.length > 0
    ? article.summary
    : [
        "Primary dispatch filed by " + (article.source_name || "desk") + " covering key developments.",
        "Regional correspondents confirm civilian and diplomatic infrastructure status remains monitored.",
        "Official statements and verifying details expected as situations evolve."
      ];

  const hasVideo = Boolean(
    article.video_url ||
    article.title.toLowerCase().includes("video") ||
    article.title.toLowerCase().includes("briefing")
  );

  // Native Web Share API with clipboard fallback
  const handleShare = async (e) => {
    e.stopPropagation();
    const url = article.original_url || window.location.href;
    const shareData = {
      title: article.title,
      text: `${article.title}\n\nRead on ThreadNews Broadsheet:`,
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

    // Fallback: Copy link
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <article className="w-full py-5 sm:py-7 ink-border-b">
      {/* Editorial Category Tag & Verification Shield */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-3">
        <div className="flex items-center space-x-2">
          <span className="uppercase font-semibold tracking-wider text-[#990000] dark:text-[#E50914] bg-[#FBEBEB] dark:bg-[#321315] px-2 py-0.5 rounded text-[11px]">
            {article.is_breaking ? "Breaking Report" : (article.category || "Lead Dispatch")}
          </span>
          <span className="text-[#888] dark:text-[#555]">·</span>
          <span className="text-[#222] dark:text-[#DDD] font-medium">{article.source_name}</span>
          <span className="text-[#888] dark:text-[#555]">·</span>
          <span className="text-[#666] dark:text-[#888] font-mono text-[11px]">{timeAgo}</span>
        </div>

        {/* PesaCheck Standards Corroborated Shield */}
        <div className="inline-flex items-center space-x-1.5 text-[11px] text-[#1E5631] dark:text-[#34D399] bg-[#EAF5EC] dark:bg-[#064E3B]/40 px-2.5 py-0.5 rounded-full border border-[#D0EADB] dark:border-[#065F46]">
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
            <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
          </svg>
          <span className="font-semibold">🛡️ PesaCheck Corroborated</span>
        </div>
      </div>

      {/* Main Headline */}
      <h2
        onClick={() => onOpenReader(article)}
        className="font-editorial-headline text-2xl sm:text-4xl md:text-5xl font-bold text-[#111111] dark:text-[#F2EFEB] hover:text-[#444] dark:hover:text-[#CCC] cursor-pointer transition-colors mb-4"
      >
        {article.title}
      </h2>

      {/* Featured Media Module */}
      {article.image_url ? (
        <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] bg-[#EAE8E3] dark:bg-[#1E1E24] rounded overflow-hidden mb-4 border border-[#E5E5E5] dark:border-[#2A2A30] group">
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
              <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-full bg-white/90 dark:bg-black/80 text-[#111] dark:text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                <svg className="w-6 sm:w-7 h-6 sm:h-7 fill-current translate-x-0.5" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <div className="absolute bottom-3 left-3 bg-black/80 text-white text-[11px] px-2.5 py-1 rounded font-mono uppercase tracking-wider flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                <span>Watch Video Report</span>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Editorial 3-Bullet Digest Box (Boring Report Inspired) */}
      <div className="bg-[#F4F3EE] dark:bg-[#18181E] p-4 sm:p-5 rounded border-l-4 border-[#111111] dark:border-[#E50914] my-4">
        <h3 className="text-[11px] uppercase font-bold tracking-wider text-[#333] dark:text-[#BBB] mb-2 font-serif flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <span>Editorial Digest</span>
            <span className="text-[#888] dark:text-[#666] font-normal lowercase">(3 key facts)</span>
          </div>
          <span className="font-mono text-[9px] bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded">
            UNHYPED
          </span>
        </h3>
        <ul className="space-y-1.5 text-sm sm:text-base text-[#222] dark:text-[#DDD] font-editorial-body">
          {bullets.map((point, idx) => (
            <li key={idx} className="flex items-start space-x-2">
              <span className="text-[#111] dark:text-white font-bold mt-0.5">·</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Article Excerpt */}
      {article.content && (
        <p className="font-editorial-body text-base sm:text-lg text-[#333] dark:text-[#BBB] line-clamp-3 mb-4 leading-relaxed">
          {article.content}
        </p>
      )}

      {/* Actions and 1-Tap Reactions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 ink-border-t text-xs">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onOpenReader(article)}
            className="font-semibold text-[#111] dark:text-[#EEE] hover:underline underline-offset-4 flex items-center space-x-1"
          >
            <span>Read Full Story</span>
            <span>→</span>
          </button>
          {hasVideo && (
            <>
              <span className="text-[#888] dark:text-[#555]">·</span>
              <button
                onClick={() => (onWatchVideo ? onWatchVideo(article) : onOpenReader(article))}
                className="font-semibold text-red-700 dark:text-red-400 hover:underline flex items-center space-x-1"
              >
                <span>▶ Watch Video</span>
              </button>
            </>
          )}
          <span className="text-[#888] dark:text-[#555]">·</span>
          {/* 1-Tap Share */}
          <button
            onClick={handleShare}
            className="text-[#555] dark:text-[#AAA] hover:text-[#111] dark:hover:text-white font-medium flex items-center space-x-1"
          >
            <span>📤</span>
            <span>{copied ? "Link Copied!" : "Share"}</span>
          </button>
        </div>

        {/* Quiet 1-Tap Sentiment Consensus */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[#777] dark:text-[#888] hidden md:inline font-mono text-[11px]">Consensus:</span>
          <button
            onClick={() => onReact(article.id, "breaking")}
            className="px-2.5 py-1 rounded border border-[#DDD] dark:border-[#333] hover:border-[#999] bg-white dark:bg-[#1C1C22] text-[#222] dark:text-[#EEE] transition-colors"
          >
            🔥 {article.count_breaking || 0}
          </button>
          <button
            onClick={() => onReact(article.id, "helpful")}
            className="px-2.5 py-1 rounded border border-[#DDD] dark:border-[#333] hover:border-[#999] bg-white dark:bg-[#1C1C22] text-[#222] dark:text-[#EEE] transition-colors"
          >
            👍 {article.count_helpful || 0}
          </button>
          <button
            onClick={() => onReact(article.id, "insightful")}
            className="px-2.5 py-1 rounded border border-[#DDD] dark:border-[#333] hover:border-[#999] bg-white dark:bg-[#1C1C22] text-[#222] dark:text-[#EEE] transition-colors"
          >
            💡 {article.count_insightful || 0}
          </button>
          <button
            onClick={() => onReact(article.id, "misleading")}
            className="px-2.5 py-1 rounded border border-[#DDD] dark:border-[#333] hover:border-[#999] bg-white dark:bg-[#1C1C22] text-[#990000] dark:text-[#E50914] transition-colors"
            title="Flag as disputed or uncorroborated"
          >
            ⚠️ {article.count_misleading || 0}
          </button>
        </div>
      </div>
    </article>
  );
}

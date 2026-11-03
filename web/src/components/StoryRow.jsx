"use client";

import React, { useState } from "react";

export default function StoryRow({ article, onOpenReader, onReact }) {
  const [copied, setCopied] = useState(false);
  if (!article) return null;

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

  // 1-2 sentence concise summary teaser
  const summaryTeaser = (() => {
    if (Array.isArray(article.summary) && article.summary.length > 0) {
      return article.summary[0];
    }
    if (article.content) {
      const sentence = article.content.split(/(?<=[.?!])\s+/)[0] || "";
      return sentence.length > 15 ? sentence : article.content.slice(0, 140) + "...";
    }
    return "Dispatch filed by desk correspondents.";
  })();

  const hasHighMisleading = (article.count_misleading || 0) > 3;

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
    <article className="py-4 hairline-b group transition-colors hover:bg-[#F9F8F6]/60 dark:hover:bg-[#181820]/60 px-1 sm:px-2 rounded-xs">
      <div className="flex items-start justify-between gap-3 sm:gap-5">
        {/* Left: Kicker, Headline in Serif, Summary in Sans-Serif, Read More link */}
        <div className="flex-1 min-w-0">
          {/* 1. Kicker & Byline */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 font-sans">
            <span className="kicker-tag text-[10px]">
              {article.category || "Dispatch"}
            </span>
            <span className="text-[#CCC] dark:text-[#555]">|</span>
            <span className="byline-text uppercase font-semibold text-[#111] dark:text-[#DDD] text-[10px]">
              {article.source_name}
            </span>
            <span className="text-[#CCC] dark:text-[#555]">|</span>
            <span className="byline-text font-mono text-[10px]">{timeAgo}</span>
            {article.scope === "local" && (
              <span className="text-[9px] bg-[#EAE8E3] dark:bg-[#25252D] text-[#444] dark:text-[#DDD] px-1.5 py-0.2 rounded font-mono font-medium">
                🇪🇹 Local
              </span>
            )}
            <span className="text-[9px] bg-[#EAF5EC] dark:bg-[#064E3B]/30 text-[#1E5631] dark:text-[#34D399] px-1.5 py-0.2 rounded font-semibold border border-[#D0EADB] dark:border-[#065F46]">
              🛡️ PesaCheck
            </span>
          </div>

          {/* 2. Headline in Broadsheet Serif */}
          <h3
            onClick={() => onOpenReader(article)}
            className="font-headline text-base sm:text-xl text-[#121212] dark:text-[#F2EFEB] group-hover:text-[#A81B1B] dark:group-hover:text-[#E50914] cursor-pointer transition-colors leading-snug mb-2"
          >
            {article.title}
          </h3>

          {/* 3. Summarized News in Clean Sans-Serif (The Japan Times style) */}
          <p className="font-summary text-xs sm:text-[13px] line-clamp-2 mb-2 leading-relaxed">
            {summaryTeaser}
          </p>

          {/* Disputed Notice if flagged */}
          {hasHighMisleading && (
            <div className="mb-2 text-[11px] text-[#A81B1B] dark:text-[#F87171] bg-[#FFF0F0] dark:bg-[#3B1115] px-2 py-0.5 rounded border border-[#FFD0D0] dark:border-[#5C1D24] inline-block font-sans">
              ⚠️ Readers flagged this story for corroboration.
            </div>
          )}

          {/* 4. "Read More" Link + Actions */}
          <div className="flex items-center space-x-2.5 text-[11px] font-sans pt-0.5">
            <button
              onClick={() => onOpenReader(article)}
              className="text-[#111] dark:text-white font-bold hover:underline flex items-center space-x-1"
            >
              <span>Read More</span>
              <span>→</span>
            </button>
            <span className="text-[#CCC] dark:text-[#555]">·</span>
            {article.original_url && (
              <>
                <a
                  href={article.original_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#666] dark:text-[#AAA] hover:underline"
                >
                  Source ↗
                </a>
                <span className="text-[#CCC] dark:text-[#555]">·</span>
              </>
            )}
            <button
              onClick={() => onReact(article.id, "breaking")}
              className="text-[#666] dark:text-[#AAA] hover:text-black dark:hover:text-white transition-colors"
            >
              🔥 {article.count_breaking || 0}
            </button>
            <button
              onClick={() => onReact(article.id, "helpful")}
              className="text-[#666] dark:text-[#AAA] hover:text-black dark:hover:text-white transition-colors"
            >
              👍 {article.count_helpful || 0}
            </button>
            <button
              onClick={handleShare}
              className="text-[#666] dark:text-[#AAA] hover:text-black dark:hover:text-white transition-colors ml-auto font-medium"
            >
              {copied ? "Copied" : "📤 Share"}
            </button>
          </div>
        </div>

        {/* Right: Square Editorial Thumbnail (80px desktop, 64px mobile) */}
        {article.image_url ? (
          <div
            onClick={() => onOpenReader(article)}
            className="w-18 h-18 sm:w-22 sm:h-22 flex-shrink-0 rounded-xs overflow-hidden bg-[#F2F0EB] dark:bg-[#1E1E24] border border-[#E5E5E5] dark:border-[#333] cursor-pointer"
          >
            <img
              src={article.image_url}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </div>
        ) : null}
      </div>
    </article>
  );
}

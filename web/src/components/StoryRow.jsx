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
    <article className="py-3.5 sm:py-4 ink-border-b group transition-colors hover:bg-[#F7F5EE]/60 dark:hover:bg-[#1A1A22]/60 px-2 rounded">
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        {/* Left: Metadata, Headline, Snippet & Reactions */}
        <div className="flex-1 min-w-0">
          {/* Metadata Byline */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] text-[#666] dark:text-[#999] mb-1.5 font-sans">
            <span className="font-semibold text-[#111] dark:text-[#EEE] uppercase tracking-wider text-[10px] sm:text-[11px]">
              {article.source_name}
            </span>
            <span className="text-[#AAA] dark:text-[#555]">·</span>
            <span className="font-mono text-[10px]">{timeAgo}</span>
            {article.category && (
              <>
                <span className="text-[#AAA] dark:text-[#555]">·</span>
                <span className="text-[#555] dark:text-[#AAA] italic hidden sm:inline">{article.category}</span>
              </>
            )}
            {article.scope === "local" && (
              <span className="text-[10px] bg-[#EAE8E3] dark:bg-[#25252D] text-[#444] dark:text-[#DDD] px-1.5 py-0.2 rounded font-mono font-medium">
                🇪🇹 Local
              </span>
            )}
            <span className="text-[10px] bg-[#EAF5EC] dark:bg-[#064E3B]/40 text-[#1E5631] dark:text-[#34D399] px-1.5 py-0.2 rounded font-semibold border border-[#D0EADB] dark:border-[#065F46]">
              🛡️ PesaCheck
            </span>
            {(article.video_url || article.title?.toLowerCase().includes("video") || article.title?.toLowerCase().includes("briefing")) && (
              <span className="text-[10px] bg-[#FFF0F0] dark:bg-[#3D1418] text-red-700 dark:text-red-400 px-1.5 py-0.2 rounded font-mono font-semibold border border-red-200 dark:border-red-900">
                ▶ Video
              </span>
            )}
          </div>

          {/* Headline */}
          <h3
            onClick={() => onOpenReader(article)}
            className="font-editorial-headline text-base sm:text-lg md:text-xl font-bold text-[#111] dark:text-[#F2EFEB] group-hover:text-[#444] dark:group-hover:text-[#DDD] cursor-pointer transition-colors leading-snug mb-1.5"
          >
            {article.title}
          </h3>

          {/* Snippet */}
          {article.content && (
            <p className="font-editorial-body text-xs sm:text-sm text-[#555] dark:text-[#AAA] line-clamp-2 mb-2 leading-relaxed hidden sm:block">
              {article.content}
            </p>
          )}

          {/* Warning Flag if Disputed */}
          {hasHighMisleading && (
            <div className="mb-2 text-xs text-[#990000] dark:text-[#F87171] bg-[#FFF0F0] dark:bg-[#3B1115] px-2 py-1 rounded border border-[#FFD0D0] dark:border-[#5C1D24] inline-block font-sans">
              ⚠️ Readers flagged this story as requiring independent corroboration.
            </div>
          )}

          {/* Micro Reaction & Action Bar */}
          <div className="flex items-center space-x-2 text-[11px] text-[#666] dark:text-[#888] pt-0.5">
            <button
              onClick={() => onOpenReader(article)}
              className="text-[#111] dark:text-[#EEE] font-semibold hover:underline"
            >
              Read
            </button>
            <span className="text-[#AAA] dark:text-[#555]">·</span>
            <button
              onClick={() => onReact(article.id, "breaking")}
              className="hover:text-black dark:hover:text-white transition-colors"
            >
              🔥 {article.count_breaking || 0}
            </button>
            <button
              onClick={() => onReact(article.id, "helpful")}
              className="hover:text-black dark:hover:text-white transition-colors"
            >
              👍 {article.count_helpful || 0}
            </button>
            <button
              onClick={() => onReact(article.id, "insightful")}
              className="hover:text-black dark:hover:text-white transition-colors"
            >
              💡 {article.count_insightful || 0}
            </button>
            <button
              onClick={() => onReact(article.id, "misleading")}
              className="hover:text-[#990000] dark:hover:text-red-400 transition-colors"
              title="Disputed by readers"
            >
              ⚠️ {article.count_misleading || 0}
            </button>
            <span className="text-[#AAA] dark:text-[#555]">·</span>
            <button
              onClick={handleShare}
              className="hover:text-black dark:hover:text-white transition-colors font-medium"
            >
              {copied ? "Copied" : "📤 Share"}
            </button>
          </div>
        </div>

        {/* Right: Square Editorial Thumbnail */}
        {article.image_url ? (
          <div
            onClick={() => onOpenReader(article)}
            className="w-18 h-18 sm:w-24 sm:h-24 flex-shrink-0 rounded overflow-hidden bg-[#ECEAE4] dark:bg-[#202028] border border-[#E0DED7] dark:border-[#333] cursor-pointer"
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

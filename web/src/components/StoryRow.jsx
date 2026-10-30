"use client";

import React from "react";

export default function StoryRow({ article, onOpenReader, onReact }) {
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

  return (
    <article className="py-4 ink-border-b group transition-colors hover:bg-[#F7F5EE]/50 px-2 rounded">
      <div className="flex items-start justify-between gap-4">
        {/* Left: Metadata & Headline */}
        <div className="flex-1 min-w-0">
          {/* Metadata Byline */}
          <div className="flex items-center space-x-2 text-xs text-[#666666] mb-1.5 font-sans">
            <span className="font-semibold text-[#111111] uppercase tracking-wider text-[11px]">
              {article.source_name}
            </span>
            <span>·</span>
            <span>{timeAgo}</span>
            {article.category && (
              <>
                <span>·</span>
                <span className="text-[#555555] italic">{article.category}</span>
              </>
            )}
            {article.scope === "local" && (
              <span className="text-[10px] bg-[#EAE8E3] text-[#444] px-1.5 py-0.2 rounded font-mono">
                🇪🇹 Local
              </span>
            )}
          </div>

          {/* Headline */}
          <h3
            onClick={() => onOpenReader(article)}
            className="font-editorial-headline text-lg sm:text-xl font-bold text-[#111111] group-hover:text-[#444444] cursor-pointer transition-colors leading-snug mb-1.5"
          >
            {article.title}
          </h3>

          {/* Snippet */}
          {article.content && (
            <p className="font-editorial-body text-xs sm:text-sm text-[#555555] line-clamp-2 mb-2.5">
              {article.content}
            </p>
          )}

          {/* Warning Flag if Disputed */}
          {hasHighMisleading && (
            <div className="mb-2 text-xs text-[#990000] bg-[#FFF0F0] px-2 py-1 rounded border border-[#FFD0D0] inline-block font-sans">
              ⚠️ Readers flagged this story as requiring independent corroboration.
            </div>
          )}

          {/* Micro Reaction Bar */}
          <div className="flex items-center space-x-2 text-[11px] text-[#666]">
            <button
              onClick={() => onOpenReader(article)}
              className="text-[#111111] font-semibold hover:underline"
            >
              Read Mode
            </button>
            <span>·</span>
            <button
              onClick={() => onReact(article.id, "breaking")}
              className="hover:text-black transition-colors"
            >
              🔥 {article.count_breaking || 0}
            </button>
            <button
              onClick={() => onReact(article.id, "helpful")}
              className="hover:text-black transition-colors"
            >
              👍 {article.count_helpful || 0}
            </button>
            <button
              onClick={() => onReact(article.id, "insightful")}
              className="hover:text-black transition-colors"
            >
              💡 {article.count_insightful || 0}
            </button>
            <button
              onClick={() => onReact(article.id, "misleading")}
              className="hover:text-[#990000] transition-colors"
            >
              ⚠️ {article.count_misleading || 0}
            </button>
          </div>
        </div>

        {/* Right: Square Editorial Thumbnail */}
        {article.image_url ? (
          <div
            onClick={() => onOpenReader(article)}
            className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded overflow-hidden bg-[#ECEAE4] border border-[#E0DED7] cursor-pointer"
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

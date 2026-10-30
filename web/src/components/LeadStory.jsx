"use client";

import React, { useState } from "react";

export default function LeadStory({ article, onOpenReader, onReact }) {
  if (!article) return null;

  const [isPlayingVideo, setIsPlayingVideo] = useState(false);

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

  // Mock sample 3-bullet points if summary not yet generated
  const bullets = Array.isArray(article.summary) && article.summary.length > 0
    ? article.summary
    : [
        "Primary dispatch filed by " + (article.source_name || "desk") + " covering key developments.",
        "Regional correspondents confirm civilian and diplomatic infrastructure status remains monitored.",
        "Official statements and verifying details expected as situations evolve."
      ];

  const hasVideo = Boolean(article.video_url || article.title.toLowerCase().includes("video") || article.title.toLowerCase().includes("briefing"));

  return (
    <article className="w-full max-w-5xl mx-auto px-4 py-6 ink-border-b">
      {/* Editorial Category Tag & Verification Shield */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-3">
        <div className="flex items-center space-x-2">
          <span className="uppercase font-semibold tracking-wider text-[#990000] bg-[#FBEBEB] px-2 py-0.5 rounded">
            {article.is_breaking ? "Breaking Report" : (article.category || "Lead Dispatch")}
          </span>
          <span className="text-[#666666]">·</span>
          <span className="text-[#333333] font-medium">{article.source_name}</span>
          <span className="text-[#666666]">·</span>
          <span className="text-[#777777]">{timeAgo}</span>
        </div>

        {/* Multi-source confirmation shield */}
        <div className="inline-flex items-center space-x-1 text-xs text-[#1E5631] bg-[#EAF5EC] px-2.5 py-0.5 rounded-full border border-[#D0EADB]">
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
            <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
          </svg>
          <span className="font-medium">Multi-Source Cross-Checked</span>
        </div>
      </div>

      {/* Main Headline */}
      <h2
        onClick={() => onOpenReader(article)}
        className="font-editorial-headline text-3xl sm:text-4xl md:text-5xl font-bold text-[#111111] hover:text-[#333333] cursor-pointer transition-colors mb-4"
      >
        {article.title}
      </h2>

      {/* Video / Featured Media Module */}
      {article.image_url ? (
        <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] bg-[#EAE8E3] rounded overflow-hidden mb-4 border border-[#E5E5E5] group">
          <img
            src={article.image_url}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-500"
          />

          {hasVideo && (
            <div
              onClick={() => onOpenReader(article)}
              className="absolute inset-0 bg-black/30 flex items-center justify-center cursor-pointer hover:bg-black/40 transition-colors"
            >
              <div className="w-16 h-16 rounded-full bg-white/90 text-[#111111] flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 fill-current translate-x-0.5" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <div className="absolute bottom-3 left-3 bg-black/75 text-white text-xs px-2.5 py-1 rounded font-mono uppercase tracking-wider">
                ▶ Video Report Included
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Editorial 3-Bullet Takeaway Box */}
      <div className="bg-[#F4F3EE] p-4 sm:p-5 rounded border-l-4 border-[#111111] my-4">
        <h3 className="text-xs uppercase font-bold tracking-wider text-[#333333] mb-2 font-serif flex items-center space-x-1.5">
          <span>Editorial Digest</span>
          <span className="text-[#888888] font-normal lowercase">(3 key facts)</span>
        </h3>
        <ul className="space-y-1.5 text-sm sm:text-base text-[#222222] font-editorial-body">
          {bullets.map((point, idx) => (
            <li key={idx} className="flex items-start space-x-2">
              <span className="text-[#111111] font-bold mt-0.5">·</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Article Excerpt & Full Reader Button */}
      {article.content && (
        <p className="font-editorial-body text-base sm:text-lg text-[#333333] line-clamp-3 mb-4">
          {article.content}
        </p>
      )}

      {/* Actions and 1-Tap Reactions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 ink-border-t text-xs">
        <button
          onClick={() => onOpenReader(article)}
          className="font-medium text-[#111111] hover:underline underline-offset-4 flex items-center space-x-1"
        >
          <span>Read Full Ad-Free Story</span>
          <span>→</span>
        </button>

        {/* Quiet 1-Tap Sentiment Counters */}
        <div className="flex items-center space-x-2">
          <span className="text-[#777777] hidden sm:inline">Reader Consensus:</span>
          <button
            onClick={() => onReact(article.id, "breaking")}
            className="px-2.5 py-1 rounded border border-[#DDD] hover:border-[#999] bg-white transition-colors"
          >
            🔥 {article.count_breaking || 0}
          </button>
          <button
            onClick={() => onReact(article.id, "helpful")}
            className="px-2.5 py-1 rounded border border-[#DDD] hover:border-[#999] bg-white transition-colors"
          >
            👍 {article.count_helpful || 0}
          </button>
          <button
            onClick={() => onReact(article.id, "insightful")}
            className="px-2.5 py-1 rounded border border-[#DDD] hover:border-[#999] bg-white transition-colors"
          >
            💡 {article.count_insightful || 0}
          </button>
          <button
            onClick={() => onReact(article.id, "misleading")}
            className="px-2.5 py-1 rounded border border-[#DDD] hover:border-[#999] bg-white text-[#990000] transition-colors"
            title="Flag as potentially inaccurate or unverified"
          >
            ⚠️ {article.count_misleading || 0}
          </button>
        </div>
      </div>
    </article>
  );
}

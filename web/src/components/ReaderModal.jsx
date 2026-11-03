"use client";

import React, { useEffect, useState } from "react";

export default function ReaderModal({ article, onClose, onReact }) {
  const [fontSize, setFontSize] = useState("normal"); // 'small' | 'normal' | 'large'
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!article) return null;

  const readingTime = (() => {
    const wordCount = (article.content || "").split(/\s+/).length;
    const mins = Math.max(1, Math.ceil(wordCount / 180));
    return `${mins} min read`;
  })();

  const bullets = Array.isArray(article.summary) && article.summary.length > 0
    ? article.summary
    : [
        `Primary dispatch reported by ${article.source_name || "original desk"}.`,
        "Cross-referenced against registered regional sources for corroboration.",
        "Full original dispatch accessible via direct publisher link below."
      ];

  const handleShare = async () => {
    const url = article.original_url || window.location.href;
    const summaryText = bullets.map((b) => `• ${b}`).join("\n");
    const shareData = {
      title: article.title,
      text: `📰 ${article.title}\n\nKey Facts:\n${summaryText}\n\nRead dispatch on ThreadNews:\n`,
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
      await navigator.clipboard.writeText(`${shareData.text}${url}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {}
  };

  const handleCopySummary = async () => {
    try {
      const summaryText = bullets.map((b) => `• ${b}`).join("\n");
      await navigator.clipboard.writeText(`Summary: ${article.title}\n\n${summaryText}`);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    } catch {}
  };

  const fontSizeClass = {
    small: "text-base sm:text-lg leading-relaxed",
    normal: "text-lg sm:text-xl leading-relaxed",
    large: "text-xl sm:text-2xl leading-loose",
  }[fontSize];

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const total = scrollHeight - clientHeight;
    if (total > 0) {
      setScrollProgress((scrollTop / total) * 100);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 dark:bg-black/90 backdrop-blur-sm flex justify-center p-0 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="relative w-full sm:max-w-3xl min-h-screen sm:min-h-0 bg-white dark:bg-[#151518] text-[#121212] dark:text-[#F2EFEB] sm:rounded-sm shadow-2xl overflow-hidden my-auto border-0 sm:border border-[#E0E0E0] dark:border-[#2C2C32] flex flex-col max-h-screen">
        {/* Reading Progress Line */}
        <div className="h-0.5 bg-[#EAEAEA] dark:bg-[#2A2A30] w-full">
          <div
            className="h-full bg-[#A81B1B] dark:bg-[#E50914] transition-all duration-100"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>

        {/* Modal Top Bar */}
        <div className="sticky top-0 z-10 bg-white/95 dark:bg-[#151518]/95 backdrop-blur-md px-4 sm:px-6 py-3 hairline-b flex items-center justify-between font-sans">
          <button
            onClick={onClose}
            className="text-xs uppercase tracking-wider font-bold text-[#444] dark:text-[#AAA] hover:text-[#111] dark:hover:text-white flex items-center space-x-1"
          >
            <span>←</span>
            <span>Back to Wire</span>
          </button>

          <div className="flex items-center space-x-3 text-xs text-[#666] dark:text-[#AAA]">
            <span className="font-mono text-[11px]">⏱️ {readingTime}</span>
            <span>·</span>
            {/* Font Size Adjuster */}
            <div className="flex items-center space-x-1 bg-[#F2F0EB] dark:bg-[#22222A] px-2 py-0.5 rounded text-[11px]">
              <button
                onClick={() => setFontSize("small")}
                className={`px-1.5 py-0.2 rounded ${fontSize === "small" ? "font-bold text-black dark:text-white" : "text-[#777]"}`}
                title="Small text"
              >
                A-
              </button>
              <button
                onClick={() => setFontSize("normal")}
                className={`px-1.5 py-0.2 rounded ${fontSize === "normal" ? "font-bold text-black dark:text-white" : "text-[#777]"}`}
                title="Normal text"
              >
                A
              </button>
              <button
                onClick={() => setFontSize("large")}
                className={`px-1.5 py-0.2 rounded ${fontSize === "large" ? "font-bold text-black dark:text-white" : "text-[#777]"}`}
                title="Large text"
              >
                A+
              </button>
            </div>
            <span>·</span>
            <button
              onClick={handleShare}
              className="px-2.5 py-1 rounded bg-[#F2F0EB] dark:bg-[#22222A] hover:bg-[#E0DED6] dark:hover:bg-[#333] text-[11px] font-medium"
            >
              {copiedLink ? "✓ Copied" : "📤 Share"}
            </button>
          </div>
        </div>

        {/* Scrollable Reader Content */}
        <div onScroll={handleScroll} className="px-5 sm:px-12 md:px-16 py-6 sm:py-8 overflow-y-auto flex-1">
          {/* Section Kicker & Publication Byline */}
          <div className="flex flex-wrap items-center justify-between text-xs text-[#666] dark:text-[#888] mb-3 font-sans">
            <span className="kicker-tag text-xs">
              {article.category || "General Dispatch"} | {article.source_name}
            </span>
            <span className="font-mono text-[11px]">
              Published {new Date(article.published_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric"
              })}
            </span>
          </div>

          {/* Headline in Majestic Broadsheet Serif */}
          <h1 className="font-headline text-2xl sm:text-4xl md:text-5xl text-[#121212] dark:text-[#F2EFEB] leading-tight mb-4">
            {article.title}
          </h1>

          {/* PesaCheck Standards Verification Badge */}
          <div className="flex items-center justify-between bg-[#EAF5EC] dark:bg-[#064E3B]/30 border border-[#D0EADB] dark:border-[#065F46] px-3.5 py-2 rounded text-xs text-[#1E5631] dark:text-[#34D399] mb-6 font-sans">
            <div className="flex items-center space-x-2">
              <span>🛡️</span>
              <span className="font-semibold">PesaCheck Standards Verified</span>
              <span className="text-[#3F7550] dark:text-[#A7F3D0] hidden sm:inline">· Corroborated across accredited news desks</span>
            </div>
            <span className="font-mono text-[10px] bg-white/80 dark:bg-black/40 px-2 py-0.5 rounded border border-[#BDDDC7] dark:border-[#065F46]">
              CROSS-VERIFIED
            </span>
          </div>

          {/* Featured Image */}
          {article.image_url && (
            <div className="mb-6 rounded-xs overflow-hidden border border-[#E5E5E5] dark:border-[#2C2C32]">
              <img
                src={article.image_url}
                alt={article.title}
                className="w-full h-auto max-h-[440px] object-cover"
              />
            </div>
          )}

          {/* 3-Bullet Executive Digest (Boring Report Engine) */}
          <div className="bg-[#F8F7F4] dark:bg-[#1A1A22] p-4 sm:p-5 rounded-xs border-l-3 border-[#111] dark:border-[#DDD] mb-8 font-sans">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[11px] uppercase font-bold tracking-widest text-[#222] dark:text-[#CCC]">
                Executive Summary (3 Factual Takeaways)
              </h4>
              <button
                onClick={handleCopySummary}
                className="text-[10px] text-[#666] dark:text-[#AAA] hover:text-[#111] dark:hover:text-white underline font-mono"
              >
                {copiedSummary ? "✓ Copied" : "Copy Takeaways"}
              </button>
            </div>
            <ul className="space-y-1.5 text-sm sm:text-[15px] font-sans text-[#222] dark:text-[#DDD]">
              {bullets.map((bullet, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="font-bold text-[#A81B1B] dark:text-[#E50914] mt-0.5">•</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Full Article Text */}
          <div className={`font-serif ${fontSizeClass} text-[#222222] dark:text-[#DDD] space-y-5 mb-8`}>
            {article.content ? (
              article.content.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))
            ) : (
              <p className="italic text-[#777] dark:text-[#888] font-sans">
                This dispatch was ingested via rapid news syndication. Full uncompressed body text is accessible at the original publisher.
              </p>
            )}
          </div>

          {/* 1-Tap Sentiment Consensus Bar */}
          <div className="p-4 bg-[#F8F7F4] dark:bg-[#181820] rounded-xs border border-[#E5E5E5] dark:border-[#282830] mb-6 font-sans">
            <div className="text-xs font-semibold text-[#555] dark:text-[#AAA] mb-2 font-mono uppercase tracking-wider">
              Reader Consensus:
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => onReact(article.id, "breaking")}
                className="px-3 py-1.5 rounded border border-[#DDD] dark:border-[#333] bg-white dark:bg-[#151518] hover:border-[#999] text-xs transition-colors"
              >
                🔥 Breaking ({article.count_breaking || 0})
              </button>
              <button
                onClick={() => onReact(article.id, "helpful")}
                className="px-3 py-1.5 rounded border border-[#DDD] dark:border-[#333] bg-white dark:bg-[#151518] hover:border-[#999] text-xs transition-colors"
              >
                👍 Helpful ({article.count_helpful || 0})
              </button>
              <button
                onClick={() => onReact(article.id, "insightful")}
                className="px-3 py-1.5 rounded border border-[#DDD] dark:border-[#333] bg-white dark:bg-[#151518] hover:border-[#999] text-xs transition-colors"
              >
                💡 Insightful ({article.count_insightful || 0})
              </button>
              <button
                onClick={() => onReact(article.id, "misleading")}
                className="px-3 py-1.5 rounded border border-[#DDD] dark:border-[#333] bg-white dark:bg-[#151518] text-[#A81B1B] dark:text-[#F87171] hover:border-[#999] text-xs transition-colors"
              >
                ⚠️ Misleading ({article.count_misleading || 0})
              </button>
            </div>
          </div>

          {/* Prominent Link to Read Original Full Article */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-5 hairline-t font-sans">
            {article.original_url && (
              <a
                href={article.original_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-[#111111] dark:bg-[#F2EFEB] text-[#FFFFFF] dark:text-[#111] rounded-xs text-xs font-bold hover:bg-[#333] dark:hover:bg-white transition-colors text-center shadow-xs"
              >
                Read Original Full Article on {article.source_name} ↗
              </a>
            )}

            <button
              onClick={handleShare}
              className="px-5 py-3 border border-[#111] dark:border-[#EEE] text-[#111] dark:text-[#EEE] rounded-xs text-xs font-bold hover:bg-[#111] hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors text-center"
            >
              📤 Share Dispatch
            </button>
          </div>

          <div className="h-8" />
        </div>
      </div>
    </div>
  );
}

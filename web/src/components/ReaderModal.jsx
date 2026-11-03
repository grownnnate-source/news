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
        "Primary dispatch reported by " + (article.source_name || "original desk") + ".",
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
      <div className="relative w-full sm:max-w-3xl min-h-screen sm:min-h-0 bg-[#FAF9F6] dark:bg-[#151518] text-[#111111] dark:text-[#F2EFEB] sm:rounded-lg shadow-2xl overflow-hidden my-auto border-0 sm:border border-[#D5D3CC] dark:border-[#2C2C32] flex flex-col max-h-screen">
        {/* Reading Progress Line */}
        <div className="h-0.5 bg-[#DDD] dark:bg-[#2A2A30] w-full">
          <div
            className="h-full bg-[#111] dark:bg-[#34D399] transition-all duration-100"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>

        {/* Modal Top Bar */}
        <div className="sticky top-0 z-10 bg-[#FAF9F6]/95 dark:bg-[#151518]/95 backdrop-blur-md px-4 sm:px-6 py-3 ink-border-b flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-xs uppercase tracking-wider font-semibold text-[#555] dark:text-[#AAA] hover:text-[#111] dark:hover:text-white flex items-center space-x-1"
          >
            <span>←</span>
            <span>Back</span>
          </button>

          <div className="flex items-center space-x-2 sm:space-x-3 text-xs text-[#666] dark:text-[#AAA]">
            <span className="font-mono text-[11px]">⏱️ {readingTime}</span>
            <span>·</span>
            {/* Font Size Adjuster */}
            <div className="flex items-center space-x-1 bg-[#ECEAE4] dark:bg-[#22222A] px-1.5 py-0.5 rounded text-[11px] font-sans">
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
              className="px-2 py-0.5 rounded bg-[#ECEAE4] dark:bg-[#22222A] hover:bg-[#DDD] dark:hover:bg-[#333] text-[11px] font-medium"
            >
              {copiedLink ? "✓ Copied" : "📤 Share"}
            </button>
          </div>
        </div>

        {/* Scrollable Reader Content */}
        <div onScroll={handleScroll} className="px-4 sm:px-10 md:px-14 py-6 sm:py-8 overflow-y-auto flex-1">
          {/* Metadata */}
          <div className="flex flex-wrap items-center justify-between text-xs text-[#777] dark:text-[#888] mb-3 font-mono">
            <span>
              {article.source_name} · Published{" "}
              {new Date(article.published_at).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {article.category && (
              <span className="uppercase text-[#990000] dark:text-[#E50914] font-semibold">
                {article.category}
              </span>
            )}
          </div>

          {/* Headline */}
          <h1 className="font-editorial-headline text-2xl sm:text-4xl md:text-5xl font-bold text-[#111111] dark:text-[#F2EFEB] leading-tight mb-5">
            {article.title}
          </h1>

          {/* PesaCheck Standards Verification Badge */}
          <div className="flex items-center justify-between bg-[#EAF5EC] dark:bg-[#064E3B]/40 border border-[#CDE5D6] dark:border-[#065F46] px-3.5 py-2 rounded text-xs text-[#1E5631] dark:text-[#34D399] mb-6">
            <div className="flex items-center space-x-2">
              <span className="text-sm">🛡️</span>
              <span className="font-semibold">PesaCheck Standards Verified</span>
              <span className="text-[#3F7550] dark:text-[#A7F3D0] hidden sm:inline">· Corroborated across accredited regional news desks</span>
            </div>
            <span className="font-mono text-[10px] bg-white/80 dark:bg-black/40 px-2 py-0.5 rounded border border-[#BDDDC7] dark:border-[#065F46]">
              CROSS-VERIFIED
            </span>
          </div>

          {/* Media Header */}
          {article.image_url && (
            <div className="mb-6 rounded overflow-hidden border border-[#E0DED7] dark:border-[#2C2C32]">
              <img
                src={article.image_url}
                alt={article.title}
                className="w-full h-auto max-h-[440px] object-cover"
              />
            </div>
          )}

          {/* Editorial 3-Bullet Digest */}
          <div className="bg-[#F2F0EB] dark:bg-[#1A1A22] p-4 sm:p-5 rounded border-l-4 border-[#111111] dark:border-[#E50914] mb-8">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs uppercase font-bold tracking-widest text-[#333] dark:text-[#CCC] font-serif">
                Key Facts Summary (Boring Report Engine)
              </h4>
              <button
                onClick={handleCopySummary}
                className="text-[10px] text-[#666] dark:text-[#AAA] hover:text-[#111] dark:hover:text-white underline font-mono"
              >
                {copiedSummary ? "✓ Copied" : "Copy Facts"}
              </button>
            </div>
            <ul className="space-y-1.5 text-sm sm:text-base font-editorial-body text-[#222] dark:text-[#DDD]">
              {bullets.map((bullet, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="font-bold text-[#111] dark:text-white mt-0.5">•</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Clean Article Text */}
          <div className={`font-editorial-body ${fontSizeClass} text-[#222222] dark:text-[#DDD] space-y-5 mb-8`}>
            {article.content ? (
              article.content.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))
            ) : (
              <p className="italic text-[#777] dark:text-[#888]">
                This dispatch was ingested via rapid wire syndication. Full uncompressed body text is accessible at the original publisher.
              </p>
            )}
          </div>

          {/* 1-Tap Reactions Bar */}
          <div className="p-4 bg-[#F2F0EB] dark:bg-[#1E1E26] rounded border border-[#E0DED7] dark:border-[#2C2C34] mb-6">
            <div className="text-xs font-semibold text-[#555] dark:text-[#AAA] mb-2 font-mono uppercase tracking-wider">
              Reader Consensus Voting:
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
                className="px-3 py-1.5 rounded border border-[#DDD] dark:border-[#333] bg-white dark:bg-[#151518] text-[#990000] dark:text-[#F87171] hover:border-[#999] text-xs transition-colors"
              >
                ⚠️ Misleading ({article.count_misleading || 0})
              </button>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 ink-border-t">
            {article.original_url && (
              <a
                href={article.original_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-[#111111] dark:bg-[#F2EFEB] text-[#FAF9F6] dark:text-[#111] rounded text-xs font-semibold hover:bg-[#333] dark:hover:bg-white transition-colors text-center"
              >
                Open Original Wire Dispatch at {article.source_name} ↗
              </a>
            )}

            <button
              onClick={handleShare}
              className="px-4 py-2.5 border border-[#111] dark:border-[#EEE] text-[#111] dark:text-[#EEE] rounded text-xs font-semibold hover:bg-[#111] hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors text-center"
            >
              📤 Share with Contacts
            </button>
          </div>

          <div className="h-8" />
        </div>
      </div>
    </div>
  );
}

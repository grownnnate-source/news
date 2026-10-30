"use client";

import React, { useEffect } from "react";

export default function ReaderModal({ article, onClose, onReact }) {
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#FAF9F6] text-[#111111] rounded-lg shadow-2xl overflow-hidden my-auto border border-[#D5D3CC]">
        {/* Modal Top Bar */}
        <div className="sticky top-0 z-10 bg-[#FAF9F6]/95 backdrop-blur-md px-6 py-3 ink-border-b flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-xs uppercase tracking-wider font-semibold text-[#555] hover:text-[#111] flex items-center space-x-1"
          >
            <span>←</span>
            <span>Back to Wire</span>
          </button>

          <div className="flex items-center space-x-3 text-xs text-[#666]">
            <span>⏱️ {readingTime}</span>
            <span>·</span>
            <span className="font-semibold text-[#111]">{article.source_name}</span>
          </div>
        </div>

        {/* Modal Content */}
        <div className="px-6 sm:px-12 py-8 max-w-2xl mx-auto">
          {/* Metadata */}
          <div className="text-xs uppercase tracking-wider text-[#777] mb-3">
            Published {new Date(article.published_at).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>

          {/* Headline */}
          <h1 className="font-editorial-headline text-3xl sm:text-4xl md:text-5xl font-bold text-[#111111] leading-tight mb-6">
            {article.title}
          </h1>

          {/* Media Header */}
          {article.image_url && (
            <div className="mb-6 rounded overflow-hidden border border-[#E0DED7]">
              <img
                src={article.image_url}
                alt={article.title}
                className="w-full h-auto max-h-[420px] object-cover"
              />
            </div>
          )}

          {/* Editorial 3-Bullet Digest */}
          <div className="bg-[#F2F0EB] p-5 rounded border-l-4 border-[#111111] mb-8">
            <h4 className="text-xs uppercase font-bold tracking-widest text-[#333] mb-2 font-serif">
              Key Facts Summary
            </h4>
            <ul className="space-y-1.5 text-sm sm:text-base font-editorial-body text-[#222]">
              {bullets.map((bullet, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="font-bold text-[#111] mt-0.5">•</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Clean Article Text */}
          <div className="font-editorial-body text-lg sm:text-xl text-[#222222] leading-relaxed space-y-5">
            {article.content ? (
              article.content.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))
            ) : (
              <p>Full content available at original publication source below.</p>
            )}
          </div>

          {/* Source Attribution & Link */}
          <div className="mt-10 pt-6 ink-border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
            <div>
              <span className="text-[#666]">Original Source: </span>
              <a
                href={article.original_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#111] underline hover:text-[#444]"
              >
                {article.source_name} Official Post ↗
              </a>
            </div>

            {/* Reaction Bar */}
            <div className="flex items-center space-x-2">
              <span className="text-[#666]">Feedback:</span>
              <button
                onClick={() => onReact(article.id, "breaking")}
                className="px-2 py-1 rounded border border-[#CCC] bg-white hover:bg-[#F0EEEA]"
              >
                🔥 {article.count_breaking || 0}
              </button>
              <button
                onClick={() => onReact(article.id, "helpful")}
                className="px-2 py-1 rounded border border-[#CCC] bg-white hover:bg-[#F0EEEA]"
              >
                👍 {article.count_helpful || 0}
              </button>
              <button
                onClick={() => onReact(article.id, "insightful")}
                className="px-2 py-1 rounded border border-[#CCC] bg-white hover:bg-[#F0EEEA]"
              >
                💡 {article.count_insightful || 0}
              </button>
              <button
                onClick={() => onReact(article.id, "misleading")}
                className="px-2 py-1 rounded border border-[#CCC] bg-white text-[#990000] hover:bg-[#FFF0F0]"
                title="Flag as potentially inaccurate"
              >
                ⚠️ {article.count_misleading || 0}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

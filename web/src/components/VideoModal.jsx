"use client";

import React, { useEffect } from "react";

/**
 * Broadsheet Video Journalism Theater Modal
 * Plays televised press conferences, field dispatches, and broadcast video reports.
 */
export default function VideoModal({ video, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!video) return null;

  // Resolve video embed URL if YouTube or fallback video
  const resolvedEmbed = (() => {
    const url = video.video_url || "";
    if (url.includes("youtube.com/watch?v=")) {
      const videoId = url.split("v=")[1]?.split("&")[0];
      return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
    }
    if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1]?.split("?")[0];
      return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
    }
    return url;
  })();

  const isDirectVideo = resolvedEmbed && (resolvedEmbed.endsWith(".mp4") || resolvedEmbed.endsWith(".webm"));

  // 3-bullet takeaway points
  const bullets = Array.isArray(video.summary) && video.summary.length > 0
    ? video.summary
    : [
        `Televised briefing filed by ${video.source_name || "news desk"}.`,
        "Live field dispatches and audio statements verified by regional correspondents.",
        "Full unedited footage preserved for archival and corroboration purposes."
      ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#141414] text-[#FAF9F6] rounded-lg shadow-2xl overflow-hidden border border-[#2A2A2A]">
        {/* Header Bar */}
        <div className="px-5 py-3.5 bg-[#1C1C1C] border-b border-[#2A2A2A] flex items-center justify-between">
          <div className="flex items-center space-x-2.5 text-xs">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
            <span className="uppercase tracking-widest font-bold text-red-500 font-mono">
              VIDEO REPORT
            </span>
            <span className="text-[#666]">·</span>
            <span className="font-semibold text-[#DDD]">{video.source_name}</span>
          </div>

          <button
            onClick={onClose}
            className="text-xs uppercase tracking-wider text-[#999] hover:text-white px-2.5 py-1 rounded bg-[#2A2A2A] hover:bg-[#3A3A3A] transition-colors flex items-center space-x-1"
          >
            <span>Close (Esc)</span>
            <span>✕</span>
          </button>
        </div>

        {/* Video Player Container */}
        <div className="relative w-full aspect-video bg-black flex items-center justify-center">
          {resolvedEmbed ? (
            isDirectVideo ? (
              <video
                src={resolvedEmbed}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            ) : (
              <iframe
                src={resolvedEmbed}
                title={video.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )
          ) : (
            // Editorial Broadcast Fallback Player
            <div className="relative w-full h-full flex flex-col items-center justify-center bg-[#0D0D0D] p-6 text-center">
              {video.image_url ? (
                <img
                  src={video.image_url}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-25 filter blur-sm"
                />
              ) : null}

              <div className="relative z-10 max-w-lg">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7 fill-current translate-x-0.5" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <p className="font-mono text-xs uppercase tracking-widest text-red-400 mb-1">
                  Televised News Wire Feed
                </p>
                <h4 className="font-editorial-headline text-lg sm:text-xl font-bold text-white mb-3">
                  {video.title}
                </h4>
                <p className="text-xs text-[#AAA] max-w-md mx-auto mb-4">
                  Broadcast segment syndication provided by {video.source_name}. Access direct multimedia broadcast stream at the original wire publisher.
                </p>
                {video.original_url && (
                  <a
                    href={video.original_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-white text-[#111] text-xs font-semibold rounded hover:bg-[#ECEAE4] transition-colors"
                  >
                    <span>Watch on {video.source_name} Official Stream</span>
                    <span>↗</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Video Story Info & Takeaway Box */}
        <div className="p-5 sm:p-6 bg-[#161616]">
          <h2 className="font-editorial-headline text-xl sm:text-2xl font-bold text-[#F4F3EE] mb-2 leading-snug">
            {video.title}
          </h2>

          <div className="text-xs text-[#888] mb-4 flex items-center space-x-2">
            <span>Published {new Date(video.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            <span>·</span>
            <span className="uppercase text-[#BBB]">{video.category || "Televised Wire"}</span>
          </div>

          {/* 3 Key Takeaway Bullets */}
          <div className="bg-[#1F1F1F] p-4 rounded border-l-4 border-red-600">
            <h5 className="font-serif text-[11px] uppercase tracking-wider font-bold text-[#CCC] mb-2">
              Broadcast Key Facts Digest
            </h5>
            <ul className="space-y-1.5 text-xs sm:text-sm text-[#DDD] font-editorial-body">
              {bullets.map((bullet, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

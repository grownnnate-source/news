"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Header from "../components/Header";
import LeadStory from "../components/LeadStory";
import StoryRow from "../components/StoryRow";
import ReaderModal from "../components/ReaderModal";
import VideoModal from "../components/VideoModal";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const CATEGORIES = ["Politics", "Economy", "Diplomacy", "Technology", "Security", "Fact-Checks"];

export default function HomePage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeScope, setActiveScope] = useState("all");
  const [activeCategory, setActiveCategory] = useState("");
  // Default language is strictly English as requested
  const [activeLanguage, setActiveLanguage] = useState("en"); // 'en' | 'am' | 'all'
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStory, setActiveStory] = useState(null);
  const [activeVideo, setActiveVideo] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch articles from backend API
  const fetchArticles = useCallback(
    async (targetPage = 1, append = false) => {
      try {
        if (!append) setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: targetPage.toString(),
          limit: "35",
          scope: activeScope,
        });

        if (activeCategory) {
          params.append("category", activeCategory);
        }

        const res = await fetch(`${API_BASE}/api/feed?${params.toString()}`);
        if (!res.ok) {
          throw new Error(`Wire feed server responded with ${res.status}`);
        }

        const json = await res.json();
        const incoming = json.data || [];

        if (append) {
          setArticles((prev) => {
            const existingIds = new Set(prev.map((a) => a.id));
            const fresh = incoming.filter((a) => !existingIds.has(a.id));
            return [...prev, ...fresh];
          });
        } else {
          setArticles(incoming);
        }

        setHasMore(incoming.length === 35);
        setPage(targetPage);
      } catch (err) {
        console.error("[Wire Error] Failed fetching articles:", err);
        setError(err.message || "Failed to connect to the wire dispatch server.");
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [activeScope, activeCategory]
  );

  useEffect(() => {
    fetchArticles(1, false);
  }, [fetchArticles]);

  // Handle 1-Tap Sentiment Reactions with optimistic local state update
  const handleReaction = async (articleId, reactionType) => {
    setArticles((prev) =>
      prev.map((art) => {
        if (art.id !== articleId) return art;
        const key = `count_${reactionType}`;
        return {
          ...art,
          [key]: (art[key] || 0) + 1,
        };
      })
    );

    if (activeStory && activeStory.id === articleId) {
      const key = `count_${reactionType}`;
      setActiveStory((prev) => ({
        ...prev,
        [key]: (prev[key] || 0) + 1,
      }));
    }

    try {
      await fetch(`${API_BASE}/api/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          article_id: articleId,
          reaction_type: reactionType,
        }),
      });
    } catch (err) {
      console.warn("[Reaction] Failed to sync reaction with server:", err);
    }
  };

  // Filter articles by language (Default: English) and search query
  const filteredArticles = useMemo(() => {
    let result = articles;

    // 1. Language Filter (Strict English Default)
    if (activeLanguage === "en") {
      result = result.filter(
        (a) =>
          !/[\u1200-\u137F]/.test(a.title) &&
          !a.source_name?.toLowerCase().includes("amharic")
      );
    } else if (activeLanguage === "am") {
      result = result.filter(
        (a) =>
          /[\u1200-\u137F]/.test(a.title) ||
          /[\u1200-\u137F]/.test(a.content || "") ||
          a.source_name?.toLowerCase().includes("amharic") ||
          a.source_name?.toLowerCase().includes("tikvah")
      );
    }

    // 2. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.title?.toLowerCase().includes(q) ||
          a.content?.toLowerCase().includes(q) ||
          a.source_name?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [articles, activeLanguage, searchQuery]);

  // Lead article is the first article with an image or highest velocity
  const leadArticle = filteredArticles[0] || null;
  const subsequentArticles = filteredArticles.slice(1);

  // Trending / Velocity top ranked list (The Japan Times / NYT style numbered sidebar)
  const trendingArticles = useMemo(() => {
    return [...filteredArticles]
      .sort((a, b) => (b.velocity_score || 0) - (a.velocity_score || 0))
      .slice(0, 5);
  }, [filteredArticles]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#111113] text-[#121212] dark:text-[#F2EFEB] font-sans antialiased selection:bg-[#EAEAEA] dark:selection:bg-[#33333C]">
      {/* Broadsheet Masthead Header */}
      <Header
        activeScope={activeScope}
        setActiveScope={setActiveScope}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        activeLanguage={activeLanguage}
        setActiveLanguage={setActiveLanguage}
        categories={CATEGORIES}
      />

      {/* Main Broadsheet Container */}
      <main className="w-full editorial-container py-3 sm:py-5">
        {/* Search & Wire Feed Status Strip */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pb-2.5 mb-4 hairline-b text-xs font-sans">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-80">
              <input
                type="text"
                placeholder="Search headlines, desks, or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-[#F9F8F6] dark:bg-[#1C1C22] border border-[#E5E5E5] dark:border-[#2E2E36] rounded-xs text-xs text-[#111] dark:text-[#EEE] placeholder-[#888] focus:outline-none focus:border-[#111] dark:focus:border-[#DDD]"
              />
              <span className="absolute left-2.5 top-1.5 text-[#888]">🔍</span>
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-[#666] dark:text-[#999] hover:text-[#111] dark:hover:text-white underline text-[11px]"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3 text-[#666] dark:text-[#888] text-xs font-sans">
            <span className="flex items-center space-x-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400"></span>
              <span>Showing <strong>{filteredArticles.length}</strong> {activeLanguage === "en" ? "English" : activeLanguage === "am" ? "Amharic" : "Total"} Dispatches</span>
            </span>
            <span className="text-[#CCC]">|</span>
            <button
              onClick={() => {
                setIsRefreshing(true);
                fetchArticles(1, false);
              }}
              disabled={isRefreshing}
              className="text-[#111] dark:text-[#EEE] hover:underline font-bold flex items-center space-x-1"
            >
              <span>{isRefreshing ? "Syncing..." : "Sync Latest ↻"}</span>
            </button>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="py-24 text-center">
            <div className="inline-block w-7 h-7 border-2 border-[#111] dark:border-white border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="font-serif italic text-[#666] dark:text-[#888] text-sm">
              Retrieving verified broadsheet wire dispatches...
            </p>
          </div>
        )}

        {/* Error Notice */}
        {error && !loading && (
          <div className="p-6 bg-[#FFF5F5] dark:bg-[#2D1214] border border-[#FFD2D2] dark:border-[#4D1E22] rounded-xs text-center my-6">
            <p className="font-serif font-bold text-[#A81B1B] dark:text-[#F87171] mb-1">Wire Notice</p>
            <p className="text-sm text-[#666] dark:text-[#AAA] mb-4">{error}</p>
            <button
              onClick={() => fetchArticles(1, false)}
              className="px-4 py-1.5 bg-[#111] dark:bg-[#F2EFEB] text-white dark:text-[#111] text-xs font-bold rounded-xs hover:bg-[#333]"
            >
              Reconnect
            </button>
          </div>
        )}

        {/* Editorial Feed Content */}
        {!loading && !error && (
          <>
            {/* The Japan Times / NYT Multi-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
              {/* Left Column: Lead Story + Continuous Wire (8 Cols) */}
              <div className="lg:col-span-8 space-y-2">
                {/* 1. Lead Story */}
                {leadArticle && (
                  <LeadStory
                    article={leadArticle}
                    onOpenReader={setActiveStory}
                    onReact={handleReaction}
                    onWatchVideo={setActiveVideo}
                  />
                )}

                {/* 2. The Continuous Wire Header */}
                <div className="pt-4 pb-2 mb-2 hairline-b flex items-center justify-between">
                  <h3 className="font-headline text-xl sm:text-2xl text-[#121212] dark:text-[#F2EFEB]">
                    The Wire Dispatch Stream
                  </h3>
                  <span className="byline-text uppercase font-semibold">
                    Ranked by Velocity & Verification
                  </span>
                </div>

                {/* 3. Wire Story Rows */}
                {subsequentArticles.length === 0 ? (
                  <p className="py-12 text-center text-sm text-[#777] font-serif italic">
                    No dispatches found matching the current filter.
                  </p>
                ) : (
                  subsequentArticles.map((article) => (
                    <StoryRow
                      key={article.id}
                      article={article}
                      onOpenReader={setActiveStory}
                      onReact={handleReaction}
                    />
                  ))
                )}

                {/* 4. Load More Pagination */}
                {hasMore && (
                  <div className="text-center pt-8 pb-4">
                    <button
                      onClick={() => fetchArticles(page + 1, true)}
                      className="px-6 py-2.5 bg-white dark:bg-[#1A1A22] border border-[#111] dark:border-[#444] text-[#111] dark:text-[#EEE] text-xs font-bold uppercase tracking-wider hover:bg-[#111] hover:text-white dark:hover:bg-white dark:hover:text-black transition-all rounded-xs"
                    >
                      Load More Dispatches ↓
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column: Sidebar (4 Cols) — The Japan Times / NYT style */}
              <aside className="lg:col-span-4 space-y-6 lg:pl-6 lg:hairline-l">
                {/* Section A: Numbered Velocity Ranking (01, 02, 03, 04, 05) */}
                <div className="bg-[#FAF9F6] dark:bg-[#16161C] p-4.5 rounded-xs border border-[#E5E5E5] dark:border-[#282830]">
                  <div className="flex items-center justify-between pb-2 mb-3 hairline-b">
                    <h4 className="font-headline text-sm uppercase tracking-wider text-[#111] dark:text-[#EEE]">
                      Trending Dispatches
                    </h4>
                    <span className="text-[10px] text-[#A81B1B] dark:text-[#E50914] font-mono font-bold">
                      TOP 5
                    </span>
                  </div>

                  <div className="space-y-3.5">
                    {trendingArticles.map((story, idx) => (
                      <div
                        key={story.id}
                        onClick={() => setActiveStory(story)}
                        className="cursor-pointer group flex items-start space-x-3 pb-3 hairline-b last:border-b-0"
                      >
                        <span className="font-serif text-2xl font-bold text-[#CCC] dark:text-[#444] leading-none w-6">
                          0{idx + 1}
                        </span>
                        <div className="flex-1">
                          <span className="kicker-tag text-[9px]">
                            {story.source_name}
                          </span>
                          <h5 className="font-headline text-xs font-bold text-[#111] dark:text-[#DDD] group-hover:text-[#A81B1B] dark:group-hover:text-[#E50914] line-clamp-2 leading-snug mt-0.5">
                            {story.title}
                          </h5>
                          <span className="byline-text text-[10px] mt-1 inline-block">
                            Read Dispatch →
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section B: Video Report Spotlight */}
                <div className="bg-[#121212] text-white p-4.5 rounded-xs border border-[#2A2A2A] text-xs space-y-2.5">
                  <div className="flex items-center justify-between font-sans">
                    <div className="flex items-center space-x-1.5 font-bold text-red-500">
                      <span>▶</span>
                      <span className="uppercase tracking-wider font-mono text-[10px]">Broadcast Dispatch</span>
                    </div>
                    <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.2 rounded font-mono font-bold">
                      VIDEO
                    </span>
                  </div>
                  <p className="text-[#AAA] leading-relaxed font-sans text-xs">
                    Watch televised press conferences, international summits, and regional video reports directly in ThreadNews.
                  </p>
                  {leadArticle && (
                    <button
                      onClick={() => setActiveVideo(leadArticle)}
                      className="w-full mt-1 py-2 bg-white text-[#111] rounded-xs text-xs font-bold hover:bg-[#EEE] transition-colors flex items-center justify-center space-x-1"
                    >
                      <span>▶ Open Video Theater</span>
                    </button>
                  )}
                </div>

                {/* Section C: PesaCheck Standards & Editorial Integrity Card */}
                <div className="bg-white dark:bg-[#1A1A22] p-4.5 rounded-xs border border-[#E5E5E5] dark:border-[#2C2C34] text-xs space-y-2">
                  <div className="flex items-center space-x-1.5 font-bold text-[#111] dark:text-[#EEE] font-serif">
                    <span>🛡️</span>
                    <span className="font-sans text-xs uppercase tracking-wider font-bold">Editorial Integrity</span>
                  </div>
                  <p className="text-[#555] dark:text-[#AAA] leading-relaxed font-sans text-xs">
                    All dispatches are monitored against <strong>PesaCheck</strong> verification standards and de-sensationalized into 3 objective factual takeaways.
                  </p>
                  <div className="pt-2 text-[10px] text-[#666] dark:text-[#AAA] flex items-center space-x-2 font-mono">
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">✓ Ad-Free</span>
                    <span>·</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">✓ Factual</span>
                    <span>·</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">✓ Multi-Source</span>
                  </div>
                </div>

                {/* Section D: Connected Wire Desks */}
                <div className="p-4 bg-[#FAF9F6] dark:bg-[#151518] rounded-xs border border-[#E5E5E5] dark:border-[#26262E] font-sans">
                  <h4 className="font-bold text-[11px] uppercase tracking-wider text-[#333] dark:text-[#DDD] mb-2.5 font-mono">
                    Accredited Wire Desks (16)
                  </h4>
                  <div className="space-y-1.5 text-xs text-[#555] dark:text-[#AAA]">
                    <div className="flex items-center justify-between">
                      <span>The Japan Times</span>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-semibold">Active</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>BBC World News & Africa</span>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-semibold">Active</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Ethiopian News Agency (ENA)</span>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-semibold">Active</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>The Reporter Ethiopia</span>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-semibold">Active</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Capital Ethiopia</span>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-semibold">Active</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Tikvah Ethiopia (@tikvahethiopia)</span>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-semibold">Active</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>TechCrunch & The Verge</span>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-semibold">Active</span>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}
      </main>

      {/* Reader Mode Overlay Modal */}
      {activeStory && (
        <ReaderModal
          article={activeStory}
          onClose={() => setActiveStory(null)}
          onReact={handleReaction}
        />
      )}

      {/* Video Journalism Player Modal */}
      {activeVideo && (
        <VideoModal
          video={activeVideo}
          onClose={() => setActiveVideo(null)}
        />
      )}

      {/* The Japan Times / NYT Broadsheet Footer */}
      <footer className="w-full editorial-container mt-16 pt-8 pb-12 hairline-t text-xs text-[#666] dark:text-[#888] font-sans">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
          <div>
            <h5 className="font-masthead font-bold text-base text-[#111] dark:text-[#EEE] mb-2">THREADNEWS</h5>
            <p className="leading-relaxed text-[#555] dark:text-[#999]">
              An independent, multi-source regional and international wire service delivering unhyped, fast, corroborative journalism.
            </p>
          </div>
          <div>
            <h5 className="font-bold text-xs uppercase tracking-wider text-[#111] dark:text-[#EEE] mb-2 font-mono">
              Editorial Standards
            </h5>
            <ul className="space-y-1 text-[#555] dark:text-[#999]">
              <li>• Multi-Source Corroboration & Cross-Checking</li>
              <li>• Minimalist Broadsheet Layout (Japan Times / NYT)</li>
              <li>• Zero Third-Party Advertising Trackers</li>
              <li>• 1-Tap Reader Consensus Voting</li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-xs uppercase tracking-wider text-[#111] dark:text-[#EEE] mb-2 font-mono">
              Syndication Desks
            </h5>
            <p className="leading-relaxed mb-2 text-[#555] dark:text-[#999]">
              Tokyo · Addis Ababa · London · New York · Nairobi
            </p>
            <p className="font-mono text-[11px] text-[#888] dark:text-[#666]">
              © 2026 ThreadNews Wire Syndicate. All Rights Reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

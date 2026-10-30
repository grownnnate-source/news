"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Header from "../components/Header";
import LeadStory from "../components/LeadStory";
import StoryRow from "../components/StoryRow";
import ReaderModal from "../components/ReaderModal";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const CATEGORIES = ["Politics", "Economy", "Diplomacy", "Technology", "Security"];

export default function HomePage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeScope, setActiveScope] = useState("all");
  const [activeCategory, setActiveCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStory, setActiveStory] = useState(null);
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
          limit: "15",
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

        setHasMore(incoming.length === 15);
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
    // 1. Optimistic update
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

    // 2. Transmit to backend
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

  // Filter articles by search query
  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) return articles;
    const q = searchQuery.toLowerCase();
    return articles.filter(
      (a) =>
        a.title?.toLowerCase().includes(q) ||
        a.content?.toLowerCase().includes(q) ||
        a.source_name?.toLowerCase().includes(q)
    );
  }, [articles, searchQuery]);

  // Lead article is the first article with an image or highest velocity
  const leadArticle = filteredArticles[0] || null;
  const subsequentArticles = filteredArticles.slice(1);

  // Local wire highlights (e.g. Tikvah, ENA, BBC Amharic)
  const localPulseStories = useMemo(() => {
    return articles
      .filter((a) => a.scope === "local" || a.source_type === "telegram")
      .slice(0, 5);
  }, [articles]);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#111111] font-sans antialiased selection:bg-[#E2DFC9]">
      {/* Broadsheet Masthead Header */}
      <Header
        activeScope={activeScope}
        setActiveScope={setActiveScope}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        categories={CATEGORIES}
      />

      {/* Main Container */}
      <main className="w-full max-w-5xl mx-auto px-4 py-4">
        {/* Search & Wire Status Strip */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 mb-4 ink-border-b text-xs">
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <input
                type="text"
                placeholder="Search headlines, desks, or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 bg-[#F2F0EB] border border-[#DDD] rounded text-xs text-[#111] placeholder-[#888] focus:outline-none focus:border-[#111]"
              />
              <span className="absolute left-2.5 top-2 text-[#888]">🔍</span>
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-[#666] hover:text-[#111] underline text-[11px]"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center space-x-4 text-[#666] text-xs">
            <span className="flex items-center space-x-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              <span>Wire Stream: <strong>{articles.length} dispatches loaded</strong></span>
            </span>
            <button
              onClick={() => {
                setIsRefreshing(true);
                fetchArticles(1, false);
              }}
              disabled={isRefreshing}
              className="text-[#111] hover:underline font-medium flex items-center space-x-1"
            >
              <span>{isRefreshing ? "Syncing..." : "Sync Latest ↻"}</span>
            </button>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="py-24 text-center">
            <div className="inline-block w-8 h-8 border-2 border-[#111] border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="font-serif italic text-[#666] text-sm">
              Retrieving verified dispatches from Addis Ababa & global desks...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-6 bg-[#FFF2F2] border border-[#FFD2D2] rounded text-center my-6">
            <p className="font-serif font-bold text-[#990000] mb-1">Wire Connection Notice</p>
            <p className="text-sm text-[#666] mb-4">{error}</p>
            <button
              onClick={() => fetchArticles(1, false)}
              className="px-4 py-1.5 bg-[#111] text-[#FAF9F6] text-xs rounded hover:bg-[#333]"
            >
              Reconnect to Wire
            </button>
          </div>
        )}

        {/* Editorial Feed Content */}
        {!loading && !error && (
          <>
            {/* Lead Story Feature */}
            {leadArticle && (
              <LeadStory
                article={leadArticle}
                onOpenReader={setActiveStory}
                onReact={handleReaction}
              />
            )}

            {/* Broadsheet Columns Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-8">
              {/* Primary Story Feed (Left 8 Cols) */}
              <div className="md:col-span-8 space-y-2">
                <div className="flex items-center justify-between pb-2 mb-2 ink-border-b">
                  <h3 className="font-editorial-headline text-xl font-bold tracking-tight text-[#111]">
                    The Continuous Wire
                  </h3>
                  <span className="text-xs text-[#777] uppercase tracking-wider font-mono">
                    Ranked by Velocity & Verification
                  </span>
                </div>

                {subsequentArticles.length === 0 ? (
                  <p className="py-8 text-center text-sm text-[#777] font-serif italic">
                    No additional stories matching your filter.
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

                {/* Load More Pagination */}
                {hasMore && (
                  <div className="text-center pt-8 pb-4">
                    <button
                      onClick={() => fetchArticles(page + 1, true)}
                      className="px-6 py-2.5 bg-white border border-[#111] text-[#111] text-xs font-semibold uppercase tracking-wider hover:bg-[#111] hover:text-[#FAF9F6] transition-all rounded"
                    >
                      Load More Dispatches ↓
                    </button>
                  </div>
                )}
              </div>

              {/* Sidebar Column (Right 4 Cols) */}
              <aside className="md:col-span-4 space-y-6 md:pl-6 md:border-l md:border-[#E0DED7]">
                {/* Ethiopia & Horn Regional Pulse */}
                <div className="bg-[#F6F4EE] p-4 rounded border border-[#E4E1D8]">
                  <div className="flex items-center justify-between pb-2 mb-3 ink-border-b">
                    <h4 className="font-serif font-bold text-sm uppercase tracking-wider text-[#111]">
                      🇪🇹 Horn Pulse
                    </h4>
                    <span className="text-[10px] bg-[#111] text-white px-1.5 py-0.5 rounded font-mono">
                      LIVE
                    </span>
                  </div>

                  <p className="text-xs text-[#666] mb-3">
                    Fast-breaking bulletins direct from Addis Ababa wires and Telegram channels.
                  </p>

                  <div className="space-y-3">
                    {localPulseStories.map((story) => (
                      <div
                        key={story.id}
                        onClick={() => setActiveStory(story)}
                        className="cursor-pointer group pb-2 ink-border-b last:border-b-0"
                      >
                        <span className="text-[10px] uppercase font-bold text-[#990000] tracking-wider">
                          {story.source_name}
                        </span>
                        <h5 className="font-editorial-headline text-xs font-semibold text-[#111] group-hover:text-[#444] line-clamp-2 leading-snug mt-0.5">
                          {story.title}
                        </h5>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Boring Report De-Sensationalization Card */}
                <div className="bg-white p-4 rounded border border-[#DDD] text-xs space-y-2">
                  <div className="flex items-center space-x-1.5 font-bold text-[#111] font-serif">
                    <span>📰</span>
                    <span>De-Sensationalized Fact Summaries</span>
                  </div>
                  <p className="text-[#666] leading-relaxed">
                    Inspired by <em>Boring Report</em>: sensationalist adjectives and clickbait emotional hooks are automatically stripped down to 3 objective, verifiable key facts.
                  </p>
                  <div className="pt-2 text-[11px] text-[#444] flex items-center space-x-2">
                    <span className="text-emerald-700 font-bold">✓ Ad-Free</span>
                    <span>·</span>
                    <span className="text-emerald-700 font-bold">✓ 50ms Reader</span>
                    <span>·</span>
                    <span className="text-emerald-700 font-bold">✓ Factual</span>
                  </div>
                </div>

                {/* Verified News Desks List */}
                <div className="p-4 bg-[#F9F8F5] rounded border border-[#E5E3DC]">
                  <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-[#333] mb-3">
                    Connected Desks (16)
                  </h4>
                  <div className="space-y-1.5 text-xs text-[#555]">
                    <div className="flex items-center justify-between">
                      <span>Tikvah Ethiopia (@tikvahethiopia)</span>
                      <span className="text-[10px] text-emerald-700 font-mono">Active</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Ethiopian News Agency (ENA)</span>
                      <span className="text-[10px] text-emerald-700 font-mono">Active</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>BBC News Amharic</span>
                      <span className="text-[10px] text-emerald-700 font-mono">Active</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>The Reporter Ethiopia</span>
                      <span className="text-[10px] text-emerald-700 font-mono">Active</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Capital Ethiopia</span>
                      <span className="text-[10px] text-emerald-700 font-mono">Active</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>The Japan Times</span>
                      <span className="text-[10px] text-emerald-700 font-mono">Active</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>BBC World News & Africa</span>
                      <span className="text-[10px] text-emerald-700 font-mono">Active</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>TechCrunch & The Verge</span>
                      <span className="text-[10px] text-emerald-700 font-mono">Active</span>
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

      {/* Broadsheet Editorial Footer */}
      <footer className="w-full max-w-5xl mx-auto px-4 mt-16 pt-8 pb-12 double-ink-border-t text-xs text-[#666]">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
          <div>
            <h5 className="font-serif font-bold text-sm text-[#111] mb-2">THREADNEWS</h5>
            <p className="leading-relaxed">
              An independent, multi-source regional and international wire service delivering unhyped, fast, corroborative journalism.
            </p>
          </div>
          <div>
            <h5 className="font-serif font-bold text-sm text-[#111] mb-2">Editorial Principles</h5>
            <ul className="space-y-1">
              <li>• Multi-Source Cross-Checking</li>
              <li>• Minimalist Broadsheet Layout</li>
              <li>• Zero Clickbait & Zero Third-Party Ad Trackers</li>
              <li>• 1-Tap Reader Consensus Voting</li>
            </ul>
          </div>
          <div>
            <h5 className="font-serif font-bold text-sm text-[#111] mb-2">Editions</h5>
            <p className="leading-relaxed mb-2">
              Serving Addis Ababa, the Horn of Africa, Tokyo, London, and Global technology hubs.
            </p>
            <p className="font-mono text-[11px] text-[#888]">
              © 2026 ThreadNews Wire Syndicate. All Rights Reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

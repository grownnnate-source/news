"use client";

import React, { useState, useEffect } from "react";

export default function Header({
  activeScope,
  setActiveScope,
  activeCategory,
  setActiveCategory,
  activeLanguage = "all",
  setActiveLanguage,
  categories = []
}) {
  const [currentDate, setCurrentDate] = useState("Verified Daily Broadsheet Edition");

  useEffect(() => {
    try {
      setCurrentDate(
        new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      );
    } catch {}
  }, []);

  return (
    <header className="w-full max-w-5xl mx-auto px-4 pt-6 pb-2">
      {/* Top Utility Bar */}
      <div className="flex flex-wrap items-center justify-between text-xs text-[#555555] uppercase tracking-wider py-1.5 ink-border-b gap-2">
        <div className="flex items-center space-x-2">
          <span>{currentDate}</span>
          <span>·</span>
          <span>Addis Ababa · London · Tokyo</span>
        </div>

        {/* Right Utility: Bilingual Language Selector & Live Feed Indicator */}
        <div className="flex items-center space-x-3">
          {/* 1-Tap Bilingual Switcher */}
          <div className="flex items-center space-x-1 bg-[#ECEAE4] p-0.5 rounded border border-[#D5D3CC] text-[11px] normal-case">
            <button
              onClick={() => setActiveLanguage && setActiveLanguage("all")}
              className={`px-2 py-0.5 rounded transition-all font-medium ${
                activeLanguage === "all"
                  ? "bg-[#111111] text-white font-bold shadow-xs"
                  : "text-[#555555] hover:text-[#111111]"
              }`}
            >
              All Wires
            </button>
            <button
              onClick={() => setActiveLanguage && setActiveLanguage("am")}
              className={`px-2 py-0.5 rounded transition-all font-medium ${
                activeLanguage === "am"
                  ? "bg-[#111111] text-white font-bold shadow-xs"
                  : "text-[#555555] hover:text-[#111111]"
              }`}
              title="Filter for Amharic local dispatches (BBC Amharic, Tikvah)"
            >
              አማርኛ
            </button>
            <button
              onClick={() => setActiveLanguage && setActiveLanguage("en")}
              className={`px-2 py-0.5 rounded transition-all font-medium ${
                activeLanguage === "en"
                  ? "bg-[#111111] text-white font-bold shadow-xs"
                  : "text-[#555555] hover:text-[#111111]"
              }`}
              title="Filter for English broadsheet dispatches"
            >
              English
            </button>
          </div>

          <span className="hidden sm:inline text-[#777]">·</span>
          <span className="text-[#111111] font-semibold hidden sm:inline">16 Feeds Live</span>
        </div>
      </div>

      {/* Broadsheet Centered Masthead */}
      <div className="text-center py-6">
        <h1 className="font-masthead text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[#111111]">
          THREADNEWS
        </h1>
        <p className="text-xs uppercase tracking-[0.25em] text-[#666666] mt-1 font-serif italic">
          {activeLanguage === "am"
            ? "የተረጋገጡ የሀገር ውስጥና ዓለም አቀፍ ዜናዎች"
            : "The Verified Regional & Global Dispatch"}
        </p>
      </div>

      {/* Scope Switcher Bar (Double Ink Rules) */}
      <div className="double-ink-border-t double-ink-border-b py-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
        {/* Scope Pill Buttons */}
        <div className="flex items-center space-x-1 p-1 bg-[#ECEAE4] rounded-md text-xs font-medium">
          <button
            onClick={() => setActiveScope("all")}
            className={`px-3 py-1.5 rounded transition-all ${
              activeScope === "all"
                ? "bg-[#111111] text-[#FAF9F6] shadow-sm font-semibold"
                : "text-[#555555] hover:text-[#111111]"
            }`}
          >
            All Desks
          </button>
          <button
            onClick={() => setActiveScope("local")}
            className={`px-3 py-1.5 rounded transition-all flex items-center space-x-1 ${
              activeScope === "local"
                ? "bg-[#111111] text-[#FAF9F6] shadow-sm font-semibold"
                : "text-[#555555] hover:text-[#111111]"
            }`}
          >
            <span>🇪🇹 Addis Ababa & Horn</span>
          </button>
          <button
            onClick={() => setActiveScope("global")}
            className={`px-3 py-1.5 rounded transition-all flex items-center space-x-1 ${
              activeScope === "global"
                ? "bg-[#111111] text-[#FAF9F6] shadow-sm font-semibold"
                : "text-[#555555] hover:text-[#111111]"
            }`}
          >
            <span>🌍 Global Broadsheets</span>
          </button>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center space-x-4 overflow-x-auto max-w-full pb-1 sm:pb-0 text-xs font-serif">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat === activeCategory ? "" : cat)}
              className={`whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? "text-[#111111] font-bold underline underline-offset-4"
                  : "text-[#666666] hover:text-[#111111]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

"use client";

import React, { useState, useEffect } from "react";

export default function Header({
  activeScope,
  setActiveScope,
  activeCategory,
  setActiveCategory,
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
      <div className="flex items-center justify-between text-xs text-[#555555] uppercase tracking-wider py-1 ink-border-b">
        <div>
          <span>{currentDate}</span>
          <span className="mx-2">·</span>
          <span>Addis Ababa · London · Tokyo</span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="hidden sm:inline">Edition: <strong>Independent Wire</strong></span>
          <span>·</span>
          <span className="text-[#111111] font-semibold">16 Verified Feeds Live</span>
        </div>
      </div>

      {/* Broadsheet Centered Masthead */}
      <div className="text-center py-6">
        <h1 className="font-masthead text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[#111111]">
          THREADNEWS
        </h1>
        <p className="text-xs uppercase tracking-[0.25em] text-[#666666] mt-1 font-serif italic">
          The Verified Regional & Global Dispatch
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

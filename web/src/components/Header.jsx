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
  const [currentDate, setCurrentDate] = useState("Tuesday, November 3, 2026");
  const [isDarkMode, setIsDarkMode] = useState(false);

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
      const savedTheme = localStorage.getItem("threadnews_theme");
      if (savedTheme === "dark") {
        setIsDarkMode(true);
        document.documentElement.classList.add("dark");
      }
    } catch {}
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("threadnews_theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("threadnews_theme", "light");
      }
      return next;
    });
  };

  return (
    <header className="w-full editorial-container pt-4 pb-2">
      {/* Top Utility & Dateline Bar */}
      <div className="flex flex-wrap items-center justify-between text-[11px] sm:text-xs text-[#666] dark:text-[#999] uppercase tracking-wider py-2 ink-border-b gap-2 font-mono">
        {/* Left: Dateline & Edition */}
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-[#111] dark:text-[#EEE]">{currentDate}</span>
          <span className="text-[#AAA] dark:text-[#555]">·</span>
          <span className="hidden sm:inline">Addis Ababa · Tokyo · London · Nairobi</span>
          <span className="sm:hidden">Global Edition</span>
        </div>

        {/* Right: Bilingual Selector, Dark Mode Toggle & Live Indicator */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* 1-Tap Bilingual Switcher */}
          <div className="flex items-center space-x-0.5 bg-[#ECEAE4] dark:bg-[#202026] p-0.5 rounded border border-[#D5D3CC] dark:border-[#333] text-[10px] sm:text-[11px] normal-case font-sans">
            <button
              onClick={() => setActiveLanguage && setActiveLanguage("all")}
              className={`px-2 py-0.5 rounded transition-all ${
                activeLanguage === "all"
                  ? "bg-[#111111] dark:bg-[#F2EFEB] text-white dark:text-[#111] font-bold shadow-xs"
                  : "text-[#555] dark:text-[#AAA] hover:text-[#111] dark:hover:text-white"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveLanguage && setActiveLanguage("am")}
              className={`px-2 py-0.5 rounded transition-all ${
                activeLanguage === "am"
                  ? "bg-[#111111] dark:bg-[#F2EFEB] text-white dark:text-[#111] font-bold shadow-xs"
                  : "text-[#555] dark:text-[#AAA] hover:text-[#111] dark:hover:text-white"
              }`}
              title="Filter for Amharic dispatches"
            >
              አማርኛ
            </button>
            <button
              onClick={() => setActiveLanguage && setActiveLanguage("en")}
              className={`px-2 py-0.5 rounded transition-all ${
                activeLanguage === "en"
                  ? "bg-[#111111] dark:bg-[#F2EFEB] text-white dark:text-[#111] font-bold shadow-xs"
                  : "text-[#555] dark:text-[#AAA] hover:text-[#111] dark:hover:text-white"
              }`}
              title="Filter for English dispatches"
            >
              EN
            </button>
          </div>

          {/* 1-Tap Night Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="px-2 py-1 bg-[#ECEAE4] dark:bg-[#202026] hover:bg-[#E0DED6] dark:hover:bg-[#2A2A32] rounded border border-[#D5D3CC] dark:border-[#333] text-[11px] text-[#444] dark:text-[#DDD] font-sans flex items-center space-x-1"
            title="Toggle Broadsheet Night Mode"
          >
            <span>{isDarkMode ? "☀️" : "🌙"}</span>
            <span className="hidden md:inline">{isDarkMode ? "Day" : "Night"}</span>
          </button>

          {/* Wire Live Indicator */}
          <div className="hidden sm:flex items-center space-x-1.5 text-emerald-700 dark:text-emerald-400 font-semibold font-mono text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse"></span>
            <span>16 Wires</span>
          </div>
        </div>
      </div>

      {/* Broadsheet Masthead */}
      <div className="text-center py-5 sm:py-7">
        <h1 className="font-masthead text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[#111111] dark:text-[#F2EFEB] leading-none">
          THREADNEWS
        </h1>
        <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] sm:tracking-[0.3em] text-[#666666] dark:text-[#9E9E9E] mt-2 font-serif italic">
          {activeLanguage === "am"
            ? "የተረጋገጡ የሀገር ውስጥና ዓለም አቀፍ ዜናዎች"
            : "The Independent Regional & Global Wire Dispatch"}
        </p>
      </div>

      {/* Scope Switcher & Category Strip (Classic Broadsheet Double Hairlines) */}
      <div className="double-ink-border-t double-ink-border-b py-2.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
        {/* Scope Pill Buttons */}
        <div className="flex items-center space-x-1 p-1 bg-[#ECEAE4] dark:bg-[#1E1E24] rounded-md text-xs font-medium overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveScope("all")}
            className={`flex-1 sm:flex-none whitespace-nowrap px-3 py-1.5 rounded transition-all text-center ${
              activeScope === "all"
                ? "bg-[#111111] dark:bg-[#F2EFEB] text-[#FAF9F6] dark:text-[#111] shadow-xs font-semibold"
                : "text-[#555] dark:text-[#AAA] hover:text-[#111] dark:hover:text-white"
            }`}
          >
            All Desks
          </button>
          <button
            onClick={() => setActiveScope("local")}
            className={`flex-1 sm:flex-none whitespace-nowrap px-3 py-1.5 rounded transition-all flex items-center justify-center space-x-1 ${
              activeScope === "local"
                ? "bg-[#111111] dark:bg-[#F2EFEB] text-[#FAF9F6] dark:text-[#111] shadow-xs font-semibold"
                : "text-[#555] dark:text-[#AAA] hover:text-[#111] dark:hover:text-white"
            }`}
          >
            <span>🇪🇹 Addis & Horn</span>
          </button>
          <button
            onClick={() => setActiveScope("global")}
            className={`flex-1 sm:flex-none whitespace-nowrap px-3 py-1.5 rounded transition-all flex items-center justify-center space-x-1 ${
              activeScope === "global"
                ? "bg-[#111111] dark:bg-[#F2EFEB] text-[#FAF9F6] dark:text-[#111] shadow-xs font-semibold"
                : "text-[#555] dark:text-[#AAA] hover:text-[#111] dark:hover:text-white"
            }`}
          >
            <span>🌍 Global</span>
          </button>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center space-x-3 overflow-x-auto no-scrollbar py-1 text-xs font-serif">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat === activeCategory ? "" : cat)}
              className={`whitespace-nowrap px-1.5 py-0.5 rounded transition-colors ${
                activeCategory === cat
                  ? "text-[#111] dark:text-white font-bold underline underline-offset-4"
                  : "text-[#666] dark:text-[#999] hover:text-[#111] dark:hover:text-white"
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

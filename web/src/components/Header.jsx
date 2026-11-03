"use client";

import React, { useState, useEffect } from "react";

export default function Header({
  activeScope,
  setActiveScope,
  activeCategory,
  setActiveCategory,
  activeLanguage = "en",
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
    <header className="w-full editorial-container pt-3 pb-1">
      {/* 1. Top Utility Dateline Bar */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-[#666] dark:text-[#999] py-1.5 hairline-b gap-2 font-sans">
        {/* Left: Dateline & International Desks */}
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-[#111] dark:text-[#EEE]">{currentDate}</span>
          <span className="text-[#CCC] dark:text-[#444]">|</span>
          <span className="hidden sm:inline">Addis Ababa · Tokyo · London · New York</span>
          <span className="text-[#CCC] dark:text-[#444] hidden sm:inline">|</span>
          <span className="text-emerald-700 dark:text-emerald-400 font-medium hidden md:inline">● 16 Live News Wires</span>
        </div>

        {/* Right: Language Switcher (Default: English) & Dark Mode */}
        <div className="flex items-center space-x-3 text-[11px]">
          {/* Minimalist Editorial Language Switcher */}
          <div className="flex items-center space-x-2">
            <span className="text-[#888] hidden sm:inline">Language:</span>
            <button
              onClick={() => setActiveLanguage && setActiveLanguage("en")}
              className={`transition-colors uppercase font-medium ${
                activeLanguage === "en"
                  ? "text-[#111] dark:text-white font-bold border-b-2 border-[#111] dark:border-white pb-0.5"
                  : "text-[#666] dark:text-[#999] hover:text-[#111] dark:hover:text-white"
              }`}
            >
              English
            </button>
            <span className="text-[#DDD] dark:text-[#444]">·</span>
            <button
              onClick={() => setActiveLanguage && setActiveLanguage("am")}
              className={`transition-colors font-medium ${
                activeLanguage === "am"
                  ? "text-[#111] dark:text-white font-bold border-b-2 border-[#111] dark:border-white pb-0.5"
                  : "text-[#666] dark:text-[#999] hover:text-[#111] dark:hover:text-white"
              }`}
              title="Switch to Amharic local dispatches"
            >
              አማርኛ
            </button>
            <span className="text-[#DDD] dark:text-[#444]">·</span>
            <button
              onClick={() => setActiveLanguage && setActiveLanguage("all")}
              className={`transition-colors uppercase font-medium ${
                activeLanguage === "all"
                  ? "text-[#111] dark:text-white font-bold border-b-2 border-[#111] dark:border-white pb-0.5"
                  : "text-[#666] dark:text-[#999] hover:text-[#111] dark:hover:text-white"
              }`}
            >
              All Wires
            </button>
          </div>

          <span className="text-[#DDD] dark:text-[#444]">|</span>

          {/* Minimalist Night Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="text-[#666] dark:text-[#AAA] hover:text-[#111] dark:hover:text-white font-medium flex items-center space-x-1"
          >
            <span>{isDarkMode ? "☀️ Light Mode" : "🌙 Night Mode"}</span>
          </button>
        </div>
      </div>

      {/* 2. Dignified Broadsheet Masthead (The Japan Times & NYT Benchmark) */}
      <div className="text-center py-6 sm:py-8">
        <h1 className="font-masthead text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[#111] dark:text-[#F2EFEB]">
          THREADNEWS
        </h1>
        <div className="flex items-center justify-center space-x-2 mt-2">
          <span className="h-[1px] w-8 sm:w-16 bg-[#DDD] dark:bg-[#333]"></span>
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-[#666] dark:text-[#999] font-serif italic">
            {activeLanguage === "am"
              ? "የተረጋገጡ የሀገር ውስጥና ዓለም አቀፍ ዜናዎች"
              : "The Regional & Global Dispatch · Multi-Source Verified Wire"}
          </p>
          <span className="h-[1px] w-8 sm:w-16 bg-[#DDD] dark:bg-[#333]"></span>
        </div>
      </div>

      {/* 3. Section Navigation Bar (The Japan Times Style: 2px Top Border, 1px Bottom Border) */}
      <nav className="broadsheet-nav-bar py-2 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2">
        {/* Desk Scope Tabs */}
        <div className="flex items-center space-x-4 sm:space-x-6 overflow-x-auto no-scrollbar py-1 text-xs font-sans uppercase font-bold tracking-wider">
          <button
            onClick={() => setActiveScope("all")}
            className={`transition-colors whitespace-nowrap pb-1 ${
              activeScope === "all"
                ? "text-[#111] dark:text-white border-b-2 border-[#111] dark:border-white"
                : "text-[#666] dark:text-[#999] hover:text-[#111] dark:hover:text-white"
            }`}
          >
            Front Page
          </button>
          <button
            onClick={() => setActiveScope("local")}
            className={`transition-colors whitespace-nowrap pb-1 ${
              activeScope === "local"
                ? "text-[#111] dark:text-white border-b-2 border-[#111] dark:border-white"
                : "text-[#666] dark:text-[#999] hover:text-[#111] dark:hover:text-white"
            }`}
          >
            🇪🇹 Addis & Horn
          </button>
          <button
            onClick={() => setActiveScope("global")}
            className={`transition-colors whitespace-nowrap pb-1 ${
              activeScope === "global"
                ? "text-[#111] dark:text-white border-b-2 border-[#111] dark:border-white"
                : "text-[#666] dark:text-[#999] hover:text-[#111] dark:hover:text-white"
            }`}
          >
            🌍 Global Desks
          </button>
        </div>

        {/* Categories Strip */}
        <div className="flex items-center space-x-3 sm:space-x-4 overflow-x-auto no-scrollbar py-1 text-[11px] font-sans tracking-wide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat === activeCategory ? "" : cat)}
              className={`whitespace-nowrap transition-colors uppercase ${
                activeCategory === cat
                  ? "text-[#A81B1B] dark:text-[#E50914] font-bold underline underline-offset-4"
                  : "text-[#666] dark:text-[#999] hover:text-[#111] dark:hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </nav>
    </header>
  );
}

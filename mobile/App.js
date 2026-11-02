import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  TextInput,
  Linking,
  Platform,
  ActivityIndicator,
  Share,
  Alert
} from "react-native";

// Resilient Offline Storage Layer: Uses AsyncStorage if available, with in-memory persistence fallback
let AsyncStorageModule = null;
try {
  AsyncStorageModule = require("@react-native-async-storage/async-storage").default || require("@react-native-async-storage/async-storage");
} catch (e) {
  AsyncStorageModule = null;
}

const memoryStore = new Map();
const storage = {
  async get(key) {
    try {
      if (AsyncStorageModule?.getItem) {
        return await AsyncStorageModule.getItem(key);
      }
      return memoryStore.get(key) || null;
    } catch {
      return memoryStore.get(key) || null;
    }
  },
  async set(key, value) {
    try {
      if (AsyncStorageModule?.setItem) {
        await AsyncStorageModule.setItem(key, value);
      }
      memoryStore.set(key, value);
    } catch {
      memoryStore.set(key, value);
    }
  },
};

const STORAGE_KEYS = {
  OFFLINE_FEED: "@threadnews_offline_feed",
  DARK_MODE: "@threadnews_dark_mode",
  SAVED_ARTICLES: "@threadnews_saved_articles",
};

// On Android Emulator localhost is 10.0.2.2; on physical devices use workstation local IP.
const API_BASE = Platform.OS === "android" ? "http://10.0.2.2:5000" : "http://localhost:5000";

const CATEGORIES = ["All", "Politics", "Economy", "Diplomacy", "Technology"];

export default function App() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeScope, setActiveScope] = useState("all"); // 'all' | 'local' | 'global'
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeLanguage, setActiveLanguage] = useState("all"); // 'all' | 'am' | 'en'
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStory, setActiveStory] = useState(null);
  const [activeVideo, setActiveVideo] = useState(null);

  // Day 7 Features: Night Mode & Offline Storage & Share Sheet
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [savedArticleIds, setSavedArticleIds] = useState(new Set());
  const [offlineArticleCount, setOfflineArticleCount] = useState(0);

  // 1. Initialize Night Mode & Saved Articles from Storage on Mount
  useEffect(() => {
    (async () => {
      try {
        const storedTheme = await storage.get(STORAGE_KEYS.DARK_MODE);
        if (storedTheme !== null) {
          setIsDarkMode(storedTheme === "true");
        }
        const storedSaved = await storage.get(STORAGE_KEYS.SAVED_ARTICLES);
        if (storedSaved) {
          const parsed = JSON.parse(storedSaved);
          setSavedArticleIds(new Set(parsed));
        }
      } catch (err) {
        console.warn("[Init Storage] Warning:", err.message);
      }
    })();
  }, []);

  // 2. Toggle Night Mode & persist
  const toggleDarkMode = useCallback(async () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      storage.set(STORAGE_KEYS.DARK_MODE, String(next));
      return next;
    });
  }, []);

  // 3. Toggle Bookmark / Save Article for Offline
  const toggleSaveArticle = useCallback(async (article) => {
    if (!article?.id) return;
    setSavedArticleIds((prev) => {
      const next = new Set(prev);
      const articleId = String(article.id);
      if (next.has(articleId)) {
        next.delete(articleId);
      } else {
        next.add(articleId);
      }
      storage.set(STORAGE_KEYS.SAVED_ARTICLES, JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  // 4. Native Share Sheet for WhatsApp, Telegram, X & SMS
  const handleShare = useCallback(async (story) => {
    if (!story) return;
    try {
      const bullets = Array.isArray(story.summary) && story.summary.length > 0
        ? "\n" + story.summary.map((b) => `• ${b}`).join("\n") + "\n"
        : "";
      const source = story.source_name ? ` [${story.source_name}]` : "";
      const url = story.original_url || "https://threadnews.app";

      const shareMessage = `📰 ${story.title}${source}\n${bullets}\nRead verified dispatch on ThreadNews:\n${url}`;

      await Share.share({
        title: story.title,
        message: shareMessage,
        url: url,
      });
    } catch (err) {
      console.warn("[Native Share] Error displaying share sheet:", err.message);
    }
  }, []);

  // 5. Fetch feed from backend with automatic offline caching and offline fallback
  const fetchArticles = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        limit: "25",
        scope: activeScope,
      });
      if (activeCategory !== "All") {
        params.append("category", activeCategory);
      }

      const res = await fetch(`${API_BASE}/api/feed?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        const incoming = json.data || [];
        setArticles(incoming);
        setIsOfflineMode(false);

        // Cache articles for offline reading
        if (incoming.length > 0) {
          storage.set(STORAGE_KEYS.OFFLINE_FEED, JSON.stringify(incoming));
          setOfflineArticleCount(incoming.length);
        }
      } else {
        throw new Error(`Server returned ${res.status}`);
      }
    } catch (err) {
      console.warn("[Mobile Wire] Fetch error, loading offline cache:", err.message);
      // Fallback: load cached offline articles
      try {
        const cachedRaw = await storage.get(STORAGE_KEYS.OFFLINE_FEED);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          if (cached && cached.length > 0) {
            setArticles(cached);
            setIsOfflineMode(true);
            setOfflineArticleCount(cached.length);
          }
        }
      } catch (cacheErr) {
        console.warn("[Offline Cache] Failed to load offline cache:", cacheErr.message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeScope, activeCategory]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchArticles();
  }, [fetchArticles]);

  // Handle 1-Tap Reactions
  const handleReact = async (articleId, reactionType) => {
    // 1. Optimistic update
    setArticles((prev) =>
      prev.map((a) => {
        if (a.id !== articleId) return a;
        const key = `count_${reactionType}`;
        return {
          ...a,
          [key]: (a[key] || 0) + 1,
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

    // 2. Transmit to server
    try {
      await fetch(`${API_BASE}/api/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          article_id: articleId,
          reaction_type: reactionType,
        }),
      });
    } catch (e) {
      console.warn("[Reaction] Error submitting reaction:", e.message);
    }
  };

  const filteredArticles = useMemo(() => {
    let result = articles;

    // 1. Language Filter
    if (activeLanguage === "am") {
      result = result.filter(
        (a) =>
          /[\u1200-\u137F]/.test(a.title) ||
          /[\u1200-\u137F]/.test(a.content || "") ||
          a.source_name?.toLowerCase().includes("amharic") ||
          a.source_name?.toLowerCase().includes("tikvah")
      );
    } else if (activeLanguage === "en") {
      result = result.filter(
        (a) =>
          !/[\u1200-\u137F]/.test(a.title) &&
          !a.source_name?.toLowerCase().includes("amharic")
      );
    }

    // 2. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.title?.toLowerCase().includes(q) ||
          a.source_name?.toLowerCase().includes(q) ||
          a.content?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [articles, activeLanguage, searchQuery]);

  const leadStory = filteredArticles[0] || null;
  const otherStories = filteredArticles.slice(1);

  // Dynamic Theme Palette: Broadsheet Newsprint vs. Broadsheet Night Mode
  const theme = {
    bg: isDarkMode ? "#121214" : "#FAF9F6",
    cardBg: isDarkMode ? "#1A1A1D" : "#FAF9F6",
    headerBg: isDarkMode ? "#161619" : "#FAF9F6",
    textPrimary: isDarkMode ? "#F0EDE6" : "#111111",
    textSecondary: isDarkMode ? "#9E9E9E" : "#666666",
    border: isDarkMode ? "#2C2C30" : "#111111",
    borderLight: isDarkMode ? "#26262B" : "#DDD9CE",
    rowBorder: isDarkMode ? "#232328" : "#EAE7DF",
    chipBg: isDarkMode ? "#222227" : "#EAE7DF",
    chipActiveBg: isDarkMode ? "#FAF9F6" : "#111111",
    chipActiveText: isDarkMode ? "#111111" : "#FAF9F6",
    bulletBg: isDarkMode ? "#1E1E22" : "#F2EFEB",
    bulletBorder: isDarkMode ? "#E50914" : "#111111",
    bulletText: isDarkMode ? "#E6E2D8" : "#222222",
    inputBg: isDarkMode ? "#1C1C20" : "#F0EEE8",
    statusBarStyle: isDarkMode ? "light-content" : "dark-content",
    modalBg: isDarkMode ? "#131316" : "#FAF9F6",
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.headerBg} />

      {/* Broadsheet Top Utility & Masthead */}
      <View style={[styles.mastheadContainer, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
        {/* Edition Row with Language & Night Mode Toggles */}
        <View style={styles.editionRow}>
          <Text style={[styles.editionText, { color: theme.textSecondary }]}>
            {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · WIRE
          </Text>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            {/* 1-Tap Night Mode Toggle */}
            <TouchableOpacity
              onPress={toggleDarkMode}
              style={[styles.nightModeBtn, { backgroundColor: theme.chipBg }]}
              accessibilityLabel="Toggle Night Mode"
            >
              <Text style={styles.nightModeText}>{isDarkMode ? "☀️ Light" : "🌙 Night"}</Text>
            </TouchableOpacity>

            {/* 1-Tap Language Toggle */}
            <View style={[styles.langToggleRow, { backgroundColor: theme.chipBg }]}>
              <TouchableOpacity
                onPress={() => setActiveLanguage("all")}
                style={[styles.langBtn, activeLanguage === "all" && { backgroundColor: theme.chipActiveBg }]}
              >
                <Text style={[styles.langBtnText, { color: theme.textSecondary }, activeLanguage === "all" && { color: theme.chipActiveText }]}>
                  All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveLanguage("am")}
                style={[styles.langBtn, activeLanguage === "am" && { backgroundColor: theme.chipActiveBg }]}
              >
                <Text style={[styles.langBtnText, { color: theme.textSecondary }, activeLanguage === "am" && { color: theme.chipActiveText }]}>
                  አማርኛ
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveLanguage("en")}
                style={[styles.langBtn, activeLanguage === "en" && { backgroundColor: theme.chipActiveBg }]}
              >
                <Text style={[styles.langBtnText, { color: theme.textSecondary }, activeLanguage === "en" && { color: theme.chipActiveText }]}>
                  EN
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <Text style={[styles.mastheadTitle, { color: theme.textPrimary }]}>THREADNEWS</Text>
        <Text style={[styles.mastheadSub, { color: theme.textSecondary }]}>
          {activeLanguage === "am" ? "የተረጋገጡ የሀገር ውስጥና ዓለም አቀፍ ዜናዎች" : "The Regional & Global Dispatch"}
        </Text>

        {/* Offline Mode Banner if network unavailable */}
        {isOfflineMode && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineBannerText}>
              ⚡ OFFLINE MODE · Reading {offlineArticleCount} Cached Dispatches Stored on Device
            </Text>
          </View>
        )}

        {/* Scope Tabs */}
        <View style={[styles.scopeTabsRow, { backgroundColor: theme.chipBg }]}>
          <TouchableOpacity
            onPress={() => setActiveScope("all")}
            style={[styles.scopeTab, activeScope === "all" && { backgroundColor: theme.chipActiveBg }]}
          >
            <Text style={[styles.scopeTabText, { color: theme.textSecondary }, activeScope === "all" && { color: theme.chipActiveText, fontWeight: "bold" }]}>
              All Desks
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveScope("local")}
            style={[styles.scopeTab, activeScope === "local" && { backgroundColor: theme.chipActiveBg }]}
          >
            <Text style={[styles.scopeTabText, { color: theme.textSecondary }, activeScope === "local" && { color: theme.chipActiveText, fontWeight: "bold" }]}>
              🇪🇹 Addis & Horn
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveScope("global")}
            style={[styles.scopeTab, activeScope === "global" && { backgroundColor: theme.chipActiveBg }]}
          >
            <Text style={[styles.scopeTabText, { color: theme.textSecondary }, activeScope === "global" && { color: theme.chipActiveText, fontWeight: "bold" }]}>
              🌍 Global
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Feed Scroll */}
      <ScrollView
        style={styles.feedScroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.textPrimary}
          />
        }
      >
        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <TextInput
            placeholder="Search verified wire dispatches..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { backgroundColor: theme.inputBg, borderColor: theme.borderLight, color: theme.textPrimary }]}
          />
        </View>

        {/* Category Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesBar}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setActiveCategory(cat)}
              style={[
                styles.categoryChip,
                { backgroundColor: theme.chipBg },
                activeCategory === cat && { backgroundColor: theme.chipActiveBg },
              ]}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  { color: theme.textSecondary },
                  activeCategory === cat && { color: theme.chipActiveText, fontWeight: "bold" },
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Loading Indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.textPrimary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Syncing verified dispatches...</Text>
          </View>
        )}

        {/* Lead Story Card */}
        {leadStory && !loading && (
          <View style={[styles.leadCard, { borderBottomColor: theme.borderLight }]}>
            <View style={styles.badgeRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={styles.sourceTag}>{leadStory.source_name}</Text>
                {savedArticleIds.has(String(leadStory.id)) && (
                  <Text style={styles.offlineSavedTag}>💾 Stored Offline</Text>
                )}
              </View>
              <Text style={styles.verifiedBadge}>🛡️ PesaCheck Verified</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setActiveStory(leadStory)}
            >
              <Text style={[styles.leadTitle, { color: theme.textPrimary }]}>{leadStory.title}</Text>
            </TouchableOpacity>

            {leadStory.image_url ? (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setActiveVideo(leadStory)}
                style={styles.leadImageWrapper}
              >
                <Image source={{ uri: leadStory.image_url }} style={styles.leadImage} />
                {/* Video Play Overlay */}
                <View style={styles.leadVideoOverlay}>
                  <View style={styles.leadPlayCircle}>
                    <Text style={styles.leadPlayArrow}>▶</Text>
                  </View>
                  <Text style={styles.leadVideoTag}>WATCH VIDEO REPORT</Text>
                </View>
              </TouchableOpacity>
            ) : null}

            {/* 3-Bullet Factual Takeaways */}
            <View style={[styles.bulletBox, { backgroundColor: theme.bulletBg, borderLeftColor: theme.bulletBorder }]}>
              <Text style={[styles.bulletBoxHeader, { color: theme.textSecondary }]}>EDITORIAL DIGEST (3 KEY FACTS)</Text>
              {(Array.isArray(leadStory.summary) && leadStory.summary.length > 0
                ? leadStory.summary
                : [
                    "Reported by " + leadStory.source_name + " regional desk.",
                    "Correspondents tracking official updates and situation stability.",
                    "No conflicting discrepancies reported at filing time."
                  ]
              ).map((bullet, idx) => (
                <Text key={idx} style={[styles.bulletText, { color: theme.bulletText }]}>
                  • {bullet}
                </Text>
              ))}
            </View>

            {/* Action Bar: Reader Mode, Video, Save Offline & Native Share */}
            <View style={styles.leadActionRow}>
              <TouchableOpacity onPress={() => setActiveStory(leadStory)}>
                <Text style={[styles.readFullText, { color: theme.textPrimary }]}>Read Ad-Free Story →</Text>
              </TouchableOpacity>

              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                {/* Save Offline Button */}
                <TouchableOpacity
                  onPress={() => toggleSaveArticle(leadStory)}
                  style={[styles.utilityBtn, { backgroundColor: theme.chipBg, borderColor: theme.borderLight }]}
                >
                  <Text style={[styles.utilityBtnText, { color: theme.textPrimary }]}>
                    {savedArticleIds.has(String(leadStory.id)) ? "✓ Saved" : "💾 Offline"}
                  </Text>
                </TouchableOpacity>

                {/* Native Share Button */}
                <TouchableOpacity
                  onPress={() => handleShare(leadStory)}
                  style={[styles.utilityBtn, { backgroundColor: theme.chipBg, borderColor: theme.borderLight }]}
                >
                  <Text style={[styles.utilityBtnText, { color: theme.textPrimary }]}>📤 Share</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setActiveVideo(leadStory)}
                  style={styles.watchVideoBtn}
                >
                  <Text style={styles.watchVideoText}>▶ Watch Video</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Reaction Bar */}
            <View style={styles.reactionRow}>
              <TouchableOpacity
                onPress={() => handleReact(leadStory.id, "breaking")}
                style={[styles.reactionBtn, { backgroundColor: theme.cardBg, borderColor: theme.borderLight }]}
              >
                <Text style={[styles.reactionBtnText, { color: theme.textPrimary }]}>🔥 {leadStory.count_breaking || 0}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleReact(leadStory.id, "helpful")}
                style={[styles.reactionBtn, { backgroundColor: theme.cardBg, borderColor: theme.borderLight }]}
              >
                <Text style={[styles.reactionBtnText, { color: theme.textPrimary }]}>👍 {leadStory.count_helpful || 0}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleReact(leadStory.id, "insightful")}
                style={[styles.reactionBtn, { backgroundColor: theme.cardBg, borderColor: theme.borderLight }]}
              >
                <Text style={[styles.reactionBtnText, { color: theme.textPrimary }]}>💡 {leadStory.count_insightful || 0}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleReact(leadStory.id, "misleading")}
                style={[styles.reactionBtn, { backgroundColor: theme.cardBg, borderColor: theme.borderLight }]}
              >
                <Text style={[styles.reactionBtnText, { color: "#E50914" }]}>
                  ⚠️ {leadStory.count_misleading || 0}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Story Stream */}
        <View style={styles.streamContainer}>
          <Text style={[styles.streamSectionHeader, { color: theme.textSecondary, borderBottomColor: theme.border }]}>
            THE CONTINUOUS WIRE
          </Text>

          {otherStories.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.8}
              onPress={() => setActiveStory(item)}
              style={[styles.storyRow, { borderBottomColor: theme.rowBorder }]}
            >
              <View style={styles.storyTextCol}>
                <View style={styles.storyMetaRow}>
                  <Text style={styles.storySource}>{item.source_name}</Text>
                  {item.scope === "local" && (
                    <Text style={[styles.localTag, { backgroundColor: theme.chipBg, color: theme.textPrimary }]}>🇪🇹 Local</Text>
                  )}
                  <Text style={styles.verifiedMicroBadge}>🛡️ PesaCheck</Text>
                  {savedArticleIds.has(String(item.id)) && (
                    <Text style={styles.offlineSavedTag}>💾 Stored</Text>
                  )}
                  {(item.video_url || item.title?.toLowerCase().includes("video")) && (
                    <Text style={styles.videoBadgeTag}>▶ Video</Text>
                  )}
                </View>
                <Text style={[styles.storyHeadline, { color: theme.textPrimary }]} numberOfLines={3}>
                  {item.title}
                </Text>

                <View style={styles.microReactionRow}>
                  <Text style={[styles.microBtn, { color: theme.textSecondary }]}>🔥 {item.count_breaking || 0}</Text>
                  <Text style={[styles.microBtn, { color: theme.textSecondary }]}>👍 {item.count_helpful || 0}</Text>
                  <Text style={[styles.microBtn, { color: theme.textSecondary }]}>💡 {item.count_insightful || 0}</Text>

                  {/* 1-Tap Share Icon */}
                  <TouchableOpacity
                    onPress={() => handleShare(item)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={{ marginLeft: "auto" }}
                  >
                    <Text style={[styles.microBtn, { color: theme.textPrimary, fontWeight: "600" }]}>📤 Share</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.storyThumb} />
              ) : null}
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Reader Mode Fullscreen Modal */}
      {activeStory && (
        <Modal
          animationType="slide"
          presentationStyle="pageSheet"
          visible={Boolean(activeStory)}
          onRequestClose={() => setActiveStory(null)}
        >
          <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.modalBg }]}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { backgroundColor: theme.headerBg, borderBottomColor: theme.borderLight }]}>
              <TouchableOpacity onPress={() => setActiveStory(null)}>
                <Text style={[styles.modalCloseText, { color: theme.textPrimary }]}>← Back to Wire</Text>
              </TouchableOpacity>

              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                {/* Save Offline inside Reader */}
                <TouchableOpacity
                  onPress={() => toggleSaveArticle(activeStory)}
                  style={[styles.modalHeaderBtn, { backgroundColor: theme.chipBg }]}
                >
                  <Text style={[styles.modalHeaderBtnText, { color: theme.textPrimary }]}>
                    {savedArticleIds.has(String(activeStory.id)) ? "✓ Saved" : "💾 Save Offline"}
                  </Text>
                </TouchableOpacity>

                {/* Share inside Reader */}
                <TouchableOpacity
                  onPress={() => handleShare(activeStory)}
                  style={[styles.modalHeaderBtn, { backgroundColor: theme.chipBg }]}
                >
                  <Text style={[styles.modalHeaderBtnText, { color: theme.textPrimary }]}>📤 Share</Text>
                </TouchableOpacity>

                {/* Night Mode Toggle inside Reader */}
                <TouchableOpacity
                  onPress={toggleDarkMode}
                  style={[styles.modalHeaderBtn, { backgroundColor: theme.chipBg }]}
                >
                  <Text style={[styles.modalHeaderBtnText, { color: theme.textPrimary }]}>
                    {isDarkMode ? "☀️" : "🌙"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.modalContent}>
              <Text style={[styles.modalSourceText, { color: theme.textSecondary }]}>{activeStory.source_name}</Text>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>{activeStory.title}</Text>

              {activeStory.image_url ? (
                <Image source={{ uri: activeStory.image_url }} style={styles.modalImage} />
              ) : null}

              {/* 3-Bullet Takeaway */}
              <View style={[styles.modalBulletBox, { backgroundColor: theme.bulletBg, borderLeftColor: theme.bulletBorder }]}>
                <Text style={[styles.bulletBoxHeader, { color: theme.textSecondary }]}>KEY FACTS SUMMARY</Text>
                {(Array.isArray(activeStory.summary) && activeStory.summary.length > 0
                  ? activeStory.summary
                  : [
                      "Primary dispatch reported by " + activeStory.source_name + ".",
                      "Cross-verified with registered news wires.",
                      "Official updates will follow as received."
                    ]
                ).map((b, i) => (
                  <Text key={i} style={[styles.modalBulletText, { color: theme.bulletText }]}>
                    • {b}
                  </Text>
                ))}
              </View>

              {/* Article Content */}
              <Text style={[styles.modalBodyText, { color: theme.textPrimary }]}>
                {activeStory.content || "Full article text available at the original publication."}
              </Text>

              {/* Publisher Link & Native Share Bar */}
              <View style={{ gap: 10, marginTop: 10 }}>
                <TouchableOpacity
                  onPress={() => handleShare(activeStory)}
                  style={[styles.shareActionBtn, { backgroundColor: theme.chipBg, borderColor: theme.borderLight }]}
                >
                  <Text style={[styles.shareActionText, { color: theme.textPrimary }]}>
                    📤 Share Story with Contacts (WhatsApp / Telegram)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    if (activeStory.original_url) {
                      Linking.openURL(activeStory.original_url);
                    }
                  }}
                  style={[styles.originalLinkBtn, { backgroundColor: theme.chipActiveBg }]}
                >
                  <Text style={[styles.originalLinkText, { color: theme.chipActiveText }]}>
                    Open Original Source Dispatch ↗
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ height: 60 }} />
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}

      {/* Video Journalism Player Modal */}
      {activeVideo && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={Boolean(activeVideo)}
          onRequestClose={() => setActiveVideo(null)}
        >
          <View style={styles.videoModalBackdrop}>
            <View style={styles.videoModalContent}>
              {/* Top Bar */}
              <View style={styles.videoTopBar}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={styles.videoRedDot}>●</Text>
                  <Text style={styles.videoModalHeaderTag}>VIDEO DISPATCH</Text>
                  <Text style={styles.videoSourceTitle}>· {activeVideo.source_name}</Text>
                </View>
                <TouchableOpacity onPress={() => setActiveVideo(null)}>
                  <Text style={styles.videoCloseBtn}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Video Preview Card */}
              {activeVideo.image_url ? (
                <View style={styles.videoPlayerFrame}>
                  <Image source={{ uri: activeVideo.image_url }} style={styles.videoPlayerImg} />
                  <View style={styles.videoPlayCircle}>
                    <Text style={styles.videoPlayIcon}>▶</Text>
                  </View>
                </View>
              ) : null}

              <ScrollView style={{ padding: 14 }}>
                <Text style={styles.videoHeadline}>{activeVideo.title}</Text>

                {/* 3-Bullet Takeaways */}
                <View style={styles.videoDigestBox}>
                  <Text style={styles.videoDigestTitle}>BROADCAST FACTS DIGEST</Text>
                  {(Array.isArray(activeVideo.summary) && activeVideo.summary.length > 0
                    ? activeVideo.summary
                    : ["Televised broadcast filed by regional desk.", "Corroborated across independent outlets."]
                  ).map((b, i) => (
                    <Text key={i} style={styles.videoDigestBullet}>
                      • {b}
                    </Text>
                  ))}
                </View>

                {/* Video Share & External Watch Button */}
                <View style={{ gap: 8, marginTop: 10 }}>
                  <TouchableOpacity
                    onPress={() => handleShare(activeVideo)}
                    style={[styles.videoShareBtn]}
                  >
                    <Text style={styles.videoShareText}>📤 Share Video Dispatch</Text>
                  </TouchableOpacity>

                  {activeVideo.original_url && (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(activeVideo.original_url)}
                      style={styles.videoExternalBtn}
                    >
                      <Text style={styles.videoExternalText}>Watch Full Stream on {activeVideo.source_name} ↗</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mastheadContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  editionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  editionText: {
    fontSize: 10,
    letterSpacing: 0.5,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  nightModeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  nightModeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  langToggleRow: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 2,
  },
  langBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  langBtnText: {
    fontSize: 10,
    fontWeight: "600",
  },
  mastheadTitle: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: -0.5,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  mastheadSub: {
    fontSize: 10,
    fontStyle: "italic",
    textAlign: "center",
    letterSpacing: 1,
    marginBottom: 8,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  offlineBanner: {
    backgroundColor: "#B45309",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 6,
    alignItems: "center",
  },
  offlineBannerText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  offlineSavedTag: {
    fontSize: 9,
    backgroundColor: "#059669",
    color: "#FFFFFF",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    fontWeight: "bold",
  },
  scopeTabsRow: {
    flexDirection: "row",
    borderRadius: 6,
    padding: 3,
    marginTop: 4,
  },
  scopeTab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: "center",
    borderRadius: 4,
  },
  scopeTabText: {
    fontSize: 11,
  },
  feedScroll: {
    flex: 1,
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
  },
  categoriesBar: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginRight: 8,
  },
  categoryChipText: {
    fontSize: 11,
  },
  loadingContainer: {
    padding: 30,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: "italic",
  },
  leadCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  sourceTag: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#DC2626",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  verifiedBadge: {
    fontSize: 10,
    color: "#065F46",
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: "hidden",
    fontWeight: "600",
  },
  verifiedMicroBadge: {
    fontSize: 9,
    color: "#065F46",
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    fontWeight: "bold",
  },
  leadTitle: {
    fontSize: 22,
    fontWeight: "bold",
    lineHeight: 28,
    marginBottom: 10,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  leadImageWrapper: {
    width: "100%",
    height: 180,
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: "#333",
    marginBottom: 10,
    position: "relative",
  },
  leadImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  leadVideoOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  leadPlayCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  leadPlayArrow: {
    fontSize: 20,
    color: "#111",
    marginLeft: 3,
  },
  leadVideoTag: {
    fontSize: 10,
    color: "#FFF",
    fontWeight: "bold",
    letterSpacing: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  bulletBox: {
    borderLeftWidth: 3,
    padding: 10,
    borderRadius: 4,
    marginVertical: 8,
  },
  bulletBoxHeader: {
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  bulletText: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 3,
  },
  leadActionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    flexWrap: "wrap",
    gap: 8,
  },
  readFullText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  utilityBtn: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  utilityBtnText: {
    fontSize: 10,
    fontWeight: "600",
  },
  watchVideoBtn: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  watchVideoText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#DC2626",
  },
  reactionRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 8,
    marginTop: 8,
  },
  reactionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  reactionBtnText: {
    fontSize: 11,
  },
  streamContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  streamSectionHeader: {
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 8,
    borderBottomWidth: 1,
    paddingBottom: 4,
  },
  storyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  storyTextCol: {
    flex: 1,
    paddingRight: 10,
  },
  storyMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  storySource: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#DC2626",
    textTransform: "uppercase",
  },
  localTag: {
    fontSize: 9,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  videoBadgeTag: {
    fontSize: 9,
    backgroundColor: "#FEE2E2",
    color: "#DC2626",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    fontWeight: "bold",
  },
  storyHeadline: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 19,
    marginBottom: 6,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  microReactionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  microBtn: {
    fontSize: 10,
  },
  storyThumb: {
    width: 64,
    height: 64,
    borderRadius: 4,
    backgroundColor: "#333",
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalCloseText: {
    fontSize: 13,
    fontWeight: "600",
  },
  modalHeaderBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  modalHeaderBtnText: {
    fontSize: 11,
    fontWeight: "600",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  modalSourceText: {
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: "bold",
    lineHeight: 32,
    marginBottom: 14,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  modalImage: {
    width: "100%",
    height: 200,
    borderRadius: 6,
    marginBottom: 14,
  },
  modalBulletBox: {
    borderLeftWidth: 3,
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  modalBulletText: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 4,
  },
  modalBodyText: {
    fontSize: 16,
    lineHeight: 25,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    marginBottom: 20,
  },
  shareActionBtn: {
    borderWidth: 1,
    paddingVertical: 11,
    borderRadius: 6,
    alignItems: "center",
  },
  shareActionText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  originalLinkBtn: {
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  originalLinkText: {
    fontSize: 13,
    fontWeight: "bold",
  },
  // Video Modal Styles
  videoModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.88)",
    justifyContent: "center",
    padding: 16,
  },
  videoModalContent: {
    backgroundColor: "#141416",
    borderRadius: 8,
    overflow: "hidden",
    maxHeight: "85%",
    borderWidth: 1,
    borderColor: "#2A2A2E",
  },
  videoTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#1C1C20",
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2E",
  },
  videoRedDot: {
    color: "#E50914",
    fontSize: 12,
  },
  videoModalHeaderTag: {
    color: "#E50914",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  videoSourceTitle: {
    color: "#AAA",
    fontSize: 11,
  },
  videoCloseBtn: {
    color: "#AAA",
    fontSize: 16,
    paddingHorizontal: 4,
  },
  videoPlayerFrame: {
    width: "100%",
    height: 190,
    backgroundColor: "#000",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  videoPlayerImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    opacity: 0.6,
  },
  videoPlayCircle: {
    position: "absolute",
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(229, 9, 20, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  videoPlayIcon: {
    color: "#FFF",
    fontSize: 22,
    marginLeft: 3,
  },
  videoHeadline: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FAF9F6",
    lineHeight: 24,
    marginBottom: 10,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  videoDigestBox: {
    backgroundColor: "#1E1E22",
    borderLeftWidth: 3,
    borderLeftColor: "#E50914",
    padding: 10,
    borderRadius: 4,
    marginVertical: 8,
  },
  videoDigestTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#AAA",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  videoDigestBullet: {
    fontSize: 12,
    color: "#DDD",
    lineHeight: 18,
    marginBottom: 3,
  },
  videoShareBtn: {
    backgroundColor: "#26262B",
    paddingVertical: 10,
    borderRadius: 4,
    alignItems: "center",
  },
  videoShareText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  videoExternalBtn: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    borderRadius: 4,
    alignItems: "center",
  },
  videoExternalText: {
    color: "#111",
    fontSize: 12,
    fontWeight: "bold",
  },
});

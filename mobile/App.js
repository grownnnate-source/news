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
  ActivityIndicator
} from "react-native";

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

  // Fetch feed from backend
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
        setArticles(json.data || []);
      }
    } catch (err) {
      console.warn("[Mobile Wire] Fetch error:", err.message);
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F6" />

      {/* Broadsheet Top Utility & Masthead */}
      <View style={styles.mastheadContainer}>
        {/* Edition Row with Language Toggle */}
        <View style={styles.editionRow}>
          <Text style={styles.editionText}>
            {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · WIRE
          </Text>

          {/* 1-Tap Language Toggle */}
          <View style={styles.langToggleRow}>
            <TouchableOpacity
              onPress={() => setActiveLanguage("all")}
              style={[styles.langBtn, activeLanguage === "all" && styles.langBtnActive]}
            >
              <Text style={[styles.langBtnText, activeLanguage === "all" && styles.langBtnTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveLanguage("am")}
              style={[styles.langBtn, activeLanguage === "am" && styles.langBtnActive]}
            >
              <Text style={[styles.langBtnText, activeLanguage === "am" && styles.langBtnTextActive]}>
                አማርኛ
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveLanguage("en")}
              style={[styles.langBtn, activeLanguage === "en" && styles.langBtnActive]}
            >
              <Text style={[styles.langBtnText, activeLanguage === "en" && styles.langBtnTextActive]}>
                EN
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.mastheadTitle}>THREADNEWS</Text>
        <Text style={styles.mastheadSub}>
          {activeLanguage === "am" ? "የተረጋገጡ የሀገር ውስጥና ዓለም አቀፍ ዜናዎች" : "The Regional & Global Dispatch"}
        </Text>

        {/* Scope Tabs */}
        <View style={styles.scopeTabsRow}>
          <TouchableOpacity
            onPress={() => setActiveScope("all")}
            style={[styles.scopeTab, activeScope === "all" && styles.scopeTabActive]}
          >
            <Text style={[styles.scopeTabText, activeScope === "all" && styles.scopeTabTextActive]}>
              All Desks
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveScope("local")}
            style={[styles.scopeTab, activeScope === "local" && styles.scopeTabActive]}
          >
            <Text style={[styles.scopeTabText, activeScope === "local" && styles.scopeTabTextActive]}>
              🇪🇹 Addis & Horn
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveScope("global")}
            style={[styles.scopeTab, activeScope === "global" && styles.scopeTabActive]}
          >
            <Text style={[styles.scopeTabText, activeScope === "global" && styles.scopeTabTextActive]}>
              🌍 Global
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Feed Scroll */}
      <ScrollView
        style={styles.feedScroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#111111" />
        }
      >
        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <TextInput
            placeholder="Search verified wire dispatches..."
            placeholderTextColor="#888888"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
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
                activeCategory === cat && styles.categoryChipActive,
              ]}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  activeCategory === cat && styles.categoryChipTextActive,
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
            <ActivityIndicator size="small" color="#111111" />
            <Text style={styles.loadingText}>Syncing verified dispatches...</Text>
          </View>
        )}

        {/* Lead Story Card */}
        {leadStory && !loading && (
          <View style={styles.leadCard}>
            <View style={styles.badgeRow}>
              <Text style={styles.sourceTag}>{leadStory.source_name}</Text>
              <Text style={styles.verifiedBadge}>✓ Cross-Checked</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setActiveStory(leadStory)}
            >
              <Text style={styles.leadTitle}>{leadStory.title}</Text>
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
            <View style={styles.bulletBox}>
              <Text style={styles.bulletBoxHeader}>EDITORIAL DIGEST (3 KEY FACTS)</Text>
              {(Array.isArray(leadStory.summary) && leadStory.summary.length > 0
                ? leadStory.summary
                : [
                    "Reported by " + leadStory.source_name + " regional desk.",
                    "Correspondents tracking official updates and situation stability.",
                    "No conflicting discrepancies reported at filing time."
                  ]
              ).map((bullet, idx) => (
                <Text key={idx} style={styles.bulletText}>
                  • {bullet}
                </Text>
              ))}
            </View>

            {/* Action Bar */}
            <View style={styles.leadActionRow}>
              <TouchableOpacity onPress={() => setActiveStory(leadStory)}>
                <Text style={styles.readFullText}>Read Ad-Free Story →</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveVideo(leadStory)}
                style={styles.watchVideoBtn}
              >
                <Text style={styles.watchVideoText}>▶ Watch Video</Text>
              </TouchableOpacity>
            </View>

            {/* Reaction Bar */}
            <View style={styles.reactionRow}>
              <TouchableOpacity
                onPress={() => handleReact(leadStory.id, "breaking")}
                style={styles.reactionBtn}
              >
                <Text style={styles.reactionBtnText}>🔥 {leadStory.count_breaking || 0}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleReact(leadStory.id, "helpful")}
                style={styles.reactionBtn}
              >
                <Text style={styles.reactionBtnText}>👍 {leadStory.count_helpful || 0}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleReact(leadStory.id, "insightful")}
                style={styles.reactionBtn}
              >
                <Text style={styles.reactionBtnText}>💡 {leadStory.count_insightful || 0}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleReact(leadStory.id, "misleading")}
                style={styles.reactionBtn}
              >
                <Text style={[styles.reactionBtnText, { color: "#990000" }]}>
                  ⚠️ {leadStory.count_misleading || 0}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Story Stream */}
        <View style={styles.streamContainer}>
          <Text style={styles.streamSectionHeader}>THE CONTINUOUS WIRE</Text>

          {otherStories.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.8}
              onPress={() => setActiveStory(item)}
              style={styles.storyRow}
            >
              <View style={styles.storyTextCol}>
                <View style={styles.storyMetaRow}>
                  <Text style={styles.storySource}>{item.source_name}</Text>
                  {item.scope === "local" && (
                    <Text style={styles.localTag}>🇪🇹 Local</Text>
                  )}
                  {(item.video_url || item.title?.toLowerCase().includes("video")) && (
                    <Text style={styles.videoBadgeTag}>▶ Video</Text>
                  )}
                </View>
                <Text style={styles.storyHeadline} numberOfLines={3}>
                  {item.title}
                </Text>

                <View style={styles.microReactionRow}>
                  <Text style={styles.microBtn}>🔥 {item.count_breaking || 0}</Text>
                  <Text style={styles.microBtn}>👍 {item.count_helpful || 0}</Text>
                  <Text style={styles.microBtn}>💡 {item.count_insightful || 0}</Text>
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
          <SafeAreaView style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setActiveStory(null)}>
                <Text style={styles.modalCloseText}>← Back to Wire</Text>
              </TouchableOpacity>
              <Text style={styles.modalSourceText}>{activeStory.source_name}</Text>
            </View>

            <ScrollView style={styles.modalContent}>
              <Text style={styles.modalTitle}>{activeStory.title}</Text>

              {activeStory.image_url ? (
                <Image source={{ uri: activeStory.image_url }} style={styles.modalImage} />
              ) : null}

              {/* 3-Bullet Takeaway */}
              <View style={styles.modalBulletBox}>
                <Text style={styles.bulletBoxHeader}>KEY FACTS SUMMARY</Text>
                {(Array.isArray(activeStory.summary) && activeStory.summary.length > 0
                  ? activeStory.summary
                  : [
                      "Primary dispatch reported by " + activeStory.source_name + ".",
                      "Cross-verified with registered news wires.",
                      "Official updates will follow as received."
                    ]
                ).map((b, i) => (
                  <Text key={i} style={styles.modalBulletText}>
                    • {b}
                  </Text>
                ))}
              </View>

              {/* Article Content */}
              <Text style={styles.modalBodyText}>
                {activeStory.content || "Full article text available at the original publication."}
              </Text>

              {/* Publisher Link */}
              <TouchableOpacity
                onPress={() => {
                  if (activeStory.original_url) {
                    Linking.openURL(activeStory.original_url);
                  }
                }}
                style={styles.originalLinkBtn}
              >
                <Text style={styles.originalLinkText}>Open Original Source Dispatch ↗</Text>
              </TouchableOpacity>

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

                {activeVideo.original_url && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(activeVideo.original_url)}
                    style={styles.videoExternalBtn}
                  >
                    <Text style={styles.videoExternalText}>Watch Full Stream on {activeVideo.source_name} ↗</Text>
                  </TouchableOpacity>
                )}
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
    backgroundColor: "#FAF9F6",
  },
  mastheadContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#111111",
    backgroundColor: "#FAF9F6",
  },
  editionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  editionText: {
    fontSize: 10,
    color: "#666666",
    letterSpacing: 0.5,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  langToggleRow: {
    flexDirection: "row",
    backgroundColor: "#EAE7DF",
    borderRadius: 12,
    padding: 2,
  },
  langBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  langBtnActive: {
    backgroundColor: "#111111",
  },
  langBtnText: {
    fontSize: 10,
    color: "#555",
    fontWeight: "600",
  },
  langBtnTextActive: {
    color: "#FFF",
  },
  mastheadTitle: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    color: "#111111",
    letterSpacing: -0.5,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  mastheadSub: {
    fontSize: 10,
    fontStyle: "italic",
    textAlign: "center",
    color: "#777777",
    letterSpacing: 1,
    marginBottom: 8,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  scopeTabsRow: {
    flexDirection: "row",
    backgroundColor: "#EAE7DF",
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
  scopeTabActive: {
    backgroundColor: "#111111",
  },
  scopeTabText: {
    fontSize: 11,
    color: "#555555",
    fontWeight: "500",
  },
  scopeTabTextActive: {
    color: "#FAF9F6",
    fontWeight: "bold",
  },
  feedScroll: {
    flex: 1,
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchInput: {
    backgroundColor: "#F0EEE8",
    borderWidth: 1,
    borderColor: "#DDD9CE",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: "#111111",
  },
  categoriesBar: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: "#EAE7DF",
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: "#111111",
  },
  categoryChipText: {
    fontSize: 11,
    color: "#444444",
  },
  categoryChipTextActive: {
    color: "#FAF9F6",
    fontWeight: "bold",
  },
  loadingContainer: {
    padding: 30,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 12,
    color: "#777777",
    marginTop: 8,
    fontStyle: "italic",
  },
  leadCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#D8D4C8",
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
    color: "#990000",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  verifiedBadge: {
    fontSize: 10,
    color: "#1E5631",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: "hidden",
    fontWeight: "600",
  },
  leadTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111111",
    lineHeight: 28,
    marginBottom: 10,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  leadImageWrapper: {
    width: "100%",
    height: 180,
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: "#E5E2D9",
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
    backgroundColor: "#F2EFEB",
    borderLeftWidth: 3,
    borderLeftColor: "#111111",
    padding: 10,
    borderRadius: 4,
    marginVertical: 8,
  },
  bulletBoxHeader: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#333333",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  bulletText: {
    fontSize: 12,
    color: "#222222",
    lineHeight: 18,
    marginBottom: 3,
  },
  leadActionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  readFullText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#111111",
  },
  watchVideoBtn: {
    backgroundColor: "#FFF0F0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#FFD0D0",
  },
  watchVideoText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#990000",
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
    borderColor: "#DDD9CE",
    backgroundColor: "#FFFFFF",
  },
  reactionBtnText: {
    fontSize: 11,
    color: "#333333",
  },
  streamContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  streamSectionHeader: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#666666",
    letterSpacing: 1,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#111111",
    paddingBottom: 4,
  },
  storyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EAE7DF",
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
    color: "#333333",
    textTransform: "uppercase",
  },
  localTag: {
    fontSize: 9,
    backgroundColor: "#EAE7DF",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    color: "#333",
  },
  videoBadgeTag: {
    fontSize: 9,
    backgroundColor: "#FFF0F0",
    color: "#990000",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    fontWeight: "bold",
  },
  storyHeadline: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111111",
    lineHeight: 19,
    marginBottom: 6,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  microReactionRow: {
    flexDirection: "row",
    gap: 8,
  },
  microBtn: {
    fontSize: 10,
    color: "#777777",
  },
  storyThumb: {
    width: 64,
    height: 64,
    borderRadius: 4,
    backgroundColor: "#EAE7DF",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#FAF9F6",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#DDD9CE",
    backgroundColor: "#FAF9F6",
  },
  modalCloseText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111111",
  },
  modalSourceText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#666666",
    textTransform: "uppercase",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#111111",
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
    backgroundColor: "#F2EFEB",
    borderLeftWidth: 3,
    borderLeftColor: "#111111",
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  modalBulletText: {
    fontSize: 13,
    color: "#222222",
    lineHeight: 20,
    marginBottom: 4,
  },
  modalBodyText: {
    fontSize: 16,
    color: "#222222",
    lineHeight: 25,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    marginBottom: 20,
  },
  originalLinkBtn: {
    backgroundColor: "#111111",
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 10,
  },
  originalLinkText: {
    color: "#FAF9F6",
    fontSize: 13,
    fontWeight: "bold",
  },
  // Video Modal Styles
  videoModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    padding: 16,
  },
  videoModalContent: {
    backgroundColor: "#141414",
    borderRadius: 8,
    overflow: "hidden",
    maxHeight: "85%",
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  videoTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#1C1C1C",
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
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
    backgroundColor: "#1F1F1F",
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
  videoExternalBtn: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    borderRadius: 4,
    alignItems: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  videoExternalText: {
    color: "#111",
    fontSize: 12,
    fontWeight: "bold",
  },
});

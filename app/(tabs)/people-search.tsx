import { Ionicons } from "@expo/vector-icons";
import { Stack, router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";

import { AppHeader } from "@/components/ui/AppHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Screen } from "@/components/ui/Screen";
import { TextField } from "@/components/ui/TextField";
import { colors } from "@/constants/colors";
import { radius, spacing } from "@/constants/layout";
import { useAuth } from "@/context/AuthContext";
import { feedRemoteRepository } from "@/services/supabase/feedRemoteRepository";
import { FeedPost, ProjectSnapshot, SocialProfile } from "@/types/project";

const SEARCH_TABS = [
  { key: "mates", label: "메이트" },
  { key: "hashtags", label: "해시태그" },
  { key: "patterns", label: "도안" },
  { key: "community", label: "뜨모저모" },
] as const;

const COMMUNITY_TOPICS = new Set(["질문", "도안", "재료", "완성진행", "메이트"]);

type SearchTabKey = (typeof SEARCH_TABS)[number]["key"];
type HashtagResult = { tag: string; postCount: number };
type SearchPostResult = FeedPost & { snapshot?: ProjectSnapshot };

export default function PeopleSearchScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SearchTabKey>("mates");
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [profileResults, setProfileResults] = useState<SocialProfile[]>([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [followStateByProfileId, setFollowStateByProfileId] = useState<Record<string, boolean>>({});
  const [channelLoading, setChannelLoading] = useState(false);
  const [channelPosts, setChannelPosts] = useState<FeedPost[]>([]);
  const [snapshotById, setSnapshotById] = useState<Record<string, ProjectSnapshot>>({});
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const normalizedQuery = submittedQuery.trim().toLowerCase();

  useEffect(() => {
    if (!user) {
      setChannelPosts([]);
      setSnapshotById({});
      return;
    }

    let mounted = true;
    setChannelLoading(true);

    Promise.all([feedRemoteRepository.fetchChannel("feed"), feedRemoteRepository.fetchChannel("community")])
      .then(([feedPayload, communityPayload]) => {
        if (!mounted) return;
        const posts = [...feedPayload.posts, ...communityPayload.posts].sort(
          (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
        );
        const snapshots = [...feedPayload.snapshots, ...communityPayload.snapshots];
        setChannelPosts(posts);
        setSnapshotById(
          snapshots.reduce<Record<string, ProjectSnapshot>>((acc, snapshot) => {
            acc[snapshot.id] = snapshot;
            return acc;
          }, {}),
        );
      })
      .catch(() => {
        if (!mounted) return;
        setChannelPosts([]);
        setSnapshotById({});
      })
      .finally(() => {
        if (!mounted) return;
        setChannelLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [user]);

  useEffect(() => {
    if (!user || !submittedQuery.trim() || activeTab !== "mates") {
      setProfileResults([]);
      setFollowStateByProfileId({});
      return;
    }

    let mounted = true;
    const timeout = setTimeout(() => {
      setProfileLoading(true);
      feedRemoteRepository
        .searchProfiles(submittedQuery)
        .then(async (profiles) => {
          if (!mounted) return;
          const visibleProfiles = profiles.filter((profile) => profile.id !== user.id);
          setProfileResults(visibleProfiles);
          const metaEntries = await Promise.all(
            visibleProfiles.map(async (profile) => ({
              profileId: profile.id,
              meta: await feedRemoteRepository.fetchFollowMeta(profile.id, user.id),
            })),
          );
          if (!mounted) return;
          setFollowStateByProfileId(
            metaEntries.reduce<Record<string, boolean>>((acc, entry) => {
              acc[entry.profileId] = entry.meta.isFollowing;
              return acc;
            }, {}),
          );
        })
        .catch(() => {
          if (!mounted) return;
          setProfileResults([]);
          setFollowStateByProfileId({});
        })
        .finally(() => {
          if (!mounted) return;
          setProfileLoading(false);
        });
    }, 250);

    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, [activeTab, submittedQuery, user]);

  useEffect(() => {
    setSelectedTag(null);
  }, [submittedQuery, activeTab]);

  function handleSubmitSearch() {
    setSubmittedQuery(query.trim());
  }

  const hashtagResults = useMemo<HashtagResult[]>(() => {
    if (!normalizedQuery) {
      return [];
    }

    const counter = new Map<string, number>();

    channelPosts.forEach((post) => {
      post.hashtags
        .filter((tag) => !COMMUNITY_TOPICS.has(tag))
        .forEach((tag) => {
          if (!tag.toLowerCase().includes(normalizedQuery)) {
            return;
          }
          counter.set(tag, (counter.get(tag) ?? 0) + 1);
        });
    });

    return [...counter.entries()]
      .map(([tag, postCount]) => ({ tag, postCount }))
      .sort((left, right) => right.postCount - left.postCount || left.tag.localeCompare(right.tag));
  }, [channelPosts, normalizedQuery]);

  const selectedTagPosts = useMemo<SearchPostResult[]>(() => {
    if (!selectedTag) {
      return [];
    }

    return channelPosts
      .filter((post) => post.hashtags.includes(selectedTag))
      .map((post) => ({ ...post, snapshot: snapshotById[post.snapshotId] }))
      .slice(0, 12);
  }, [channelPosts, selectedTag, snapshotById]);

  const patternResults = useMemo<SearchPostResult[]>(() => {
    if (!normalizedQuery) {
      return [];
    }

    return channelPosts
      .filter((post) => post.channel === "feed")
      .map((post) => ({ ...post, snapshot: snapshotById[post.snapshotId] }))
      .filter((post) => {
        const haystack = [
          post.title,
          post.caption,
          post.snapshot?.title,
          ...post.hashtags.filter((tag) => !COMMUNITY_TOPICS.has(tag)),
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(normalizedQuery);
      })
      .slice(0, 20);
  }, [channelPosts, normalizedQuery, snapshotById]);

  const communityResults = useMemo<SearchPostResult[]>(() => {
    if (!normalizedQuery) {
      return [];
    }

    return channelPosts
      .filter((post) => post.channel === "community")
      .map((post) => ({ ...post, snapshot: snapshotById[post.snapshotId] }))
      .filter((post) => {
        const haystack = [post.title, post.caption, ...post.hashtags].join(" ").toLowerCase();
        return haystack.includes(normalizedQuery);
      })
      .slice(0, 20);
  }, [channelPosts, normalizedQuery, snapshotById]);

  async function handleToggleFollow(profileId: string) {
    if (!user) {
      return;
    }

    const current = Boolean(followStateByProfileId[profileId]);
    setFollowStateByProfileId((prev) => ({ ...prev, [profileId]: !current }));

    try {
      await feedRemoteRepository.toggleFollow(user.id, profileId, !current);
    } catch {
      setFollowStateByProfileId((prev) => ({ ...prev, [profileId]: current }));
    }
  }

  function renderMateTab() {
    if (!submittedQuery.trim()) {
      return <EmptyState title="메이트 찾기" description="닉네임으로 바로 찾아볼 수 있어요." />;
    }

    if (profileLoading) {
      return <EmptyState title="찾는 중" description="잠시만" />;
    }

    if (!profileResults.length) {
      return <EmptyState title="검색 결과 없음" description="다른 닉네임으로 찾아보세요." />;
    }

    return (
      <View style={styles.sectionList}>
        {profileResults.map((item) => (
          <View key={item.id} style={styles.row}>
            <Pressable
              onPress={() => router.push({ pathname: "/profile/[id]", params: { id: item.id, from: "/people-search" } })}
              style={styles.profileRow}
            >
              {item.avatarUrl ? (
                <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarText}>{item.username.slice(0, 1).toUpperCase()}</Text>
                </View>
              )}
              <View style={styles.copy}>
                <Text style={styles.username}>{item.username}</Text>
                {item.bio ? (
                  <Text numberOfLines={2} style={styles.bio}>
                    {item.bio}
                  </Text>
                ) : null}
              </View>
            </Pressable>
            <View style={styles.followButton}>
              <PrimaryButton
                title={followStateByProfileId[item.id] ? "팔로잉" : "팔로우"}
                variant={followStateByProfileId[item.id] ? "secondary" : "primary"}
                onPress={() => void handleToggleFollow(item.id)}
              />
            </View>
          </View>
        ))}
      </View>
    );
  }

  function renderHashtagTab() {
    if (!submittedQuery.trim()) {
      return <EmptyState title="해시태그 찾기" description="#도안명, #실, #기록 같은 태그를 찾아보세요." />;
    }

    if (channelLoading) {
      return <EmptyState title="불러오는 중" description="태그를 모으고 있어요." />;
    }

    if (!hashtagResults.length) {
      return <EmptyState title="태그 없음" description="다른 단어로 찾아보세요." />;
    }

    return (
      <View style={styles.sectionList}>
        {hashtagResults.map((item) => {
          const isSelected = selectedTag === item.tag;
          return (
            <View key={item.tag} style={styles.hashtagBlock}>
              <Pressable
                onPress={() => setSelectedTag((current) => (current === item.tag ? null : item.tag))}
                style={[styles.hashtagRow, isSelected && styles.hashtagRowActive]}
              >
                <View style={styles.hashtagCopy}>
                  <Text style={styles.hashtagTitle}>#{item.tag}</Text>
                  <Text style={styles.hashtagMeta}>{item.postCount}개 글</Text>
                </View>
                <Ionicons
                  color={colors.textMuted}
                  name={isSelected ? "chevron-up-outline" : "chevron-forward-outline"}
                  size={18}
                />
              </Pressable>
              {isSelected && selectedTagPosts.length ? (
                <View style={styles.linkedPostList}>
                  {selectedTagPosts.map((post) => (
                    <Pressable
                      key={post.id}
                      onPress={() =>
                        router.push({
                          pathname: "/posts/[id]",
                          params: { id: post.id, from: "/people-search" },
                        })
                      }
                      style={styles.postRow}
                    >
                      <View style={styles.postThumbWrap}>
                        {post.snapshot?.photoUri ? (
                          <Image source={{ uri: post.snapshot.photoUri }} style={styles.postThumb} />
                        ) : (
                          <View style={styles.postThumbFallback}>
                            <Ionicons color={colors.textMuted} name="pricetag-outline" size={16} />
                          </View>
                        )}
                      </View>
                      <View style={styles.postCopy}>
                        <Text numberOfLines={1} style={styles.postTitle}>
                          {post.caption || post.title || post.snapshot?.title || `#${selectedTag}`}
                        </Text>
                        <Text numberOfLines={1} style={styles.postMeta}>
                          {post.authorName}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    );
  }

  function renderPatternTab() {
    if (!submittedQuery.trim()) {
      return <EmptyState title="도안 찾기" description="도안명이나 관련 글로 찾아볼 수 있어요." />;
    }

    if (channelLoading) {
      return <EmptyState title="불러오는 중" description="도안 관련 글을 찾고 있어요." />;
    }

    if (!patternResults.length) {
      return <EmptyState title="도안 없음" description="다른 키워드로 다시 찾아보세요." />;
    }

    return (
      <View style={styles.sectionList}>
        {patternResults.map((post) => (
          <Pressable
            key={post.id}
            onPress={() =>
              router.push({
                pathname: "/posts/[id]",
                params: { id: post.id, from: "/people-search" },
              })
            }
            style={styles.postRow}
          >
            <View style={styles.postThumbWrap}>
              {post.snapshot?.photoUri ? (
                <Image source={{ uri: post.snapshot.photoUri }} style={styles.postThumb} />
              ) : (
                <View style={styles.postThumbFallback}>
                  <Ionicons color={colors.textMuted} name="images-outline" size={16} />
                </View>
              )}
            </View>
            <View style={styles.postCopy}>
              <Text numberOfLines={1} style={styles.postTitle}>
                {post.snapshot?.title || post.title || "도안 글"}
              </Text>
              <Text numberOfLines={2} style={styles.postMeta}>
                {post.caption || post.hashtags.filter((tag) => !COMMUNITY_TOPICS.has(tag)).map((tag) => `#${tag}`).join(" ")}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    );
  }

  function renderCommunityTab() {
    if (!submittedQuery.trim()) {
      return <EmptyState title="뜨모저모 찾기" description="질문글, 재료글, 메이트 글을 찾아보세요." />;
    }

    if (channelLoading) {
      return <EmptyState title="불러오는 중" description="뜨모저모 글을 찾고 있어요." />;
    }

    if (!communityResults.length) {
      return <EmptyState title="글 없음" description="다른 키워드로 다시 찾아보세요." />;
    }

    return (
      <View style={styles.sectionList}>
        {communityResults.map((post) => (
          <Pressable
            key={post.id}
            onPress={() =>
              router.push({
                pathname: "/posts/[id]",
                params: { id: post.id, from: "/people-search" },
              })
            }
            style={styles.postRow}
          >
            <View style={styles.communityBadge}>
              <Text style={styles.communityBadgeText}>{post.hashtags.find((tag) => COMMUNITY_TOPICS.has(tag)) || "이야기"}</Text>
            </View>
            <View style={styles.postCopy}>
              <Text numberOfLines={1} style={styles.postTitle}>
                {post.caption || post.title || "뜨모저모 글"}
              </Text>
              <Text numberOfLines={2} style={styles.postMeta}>
                {post.authorName}
                {post.hashtags.length ? ` · ${post.hashtags.slice(0, 2).map((tag) => `#${tag}`).join(" ")}` : ""}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    );
  }

  return (
    <Screen contentStyle={styles.screen}>
      <Stack.Screen options={{ title: "검색" }} />
      <FlatList
        contentContainerStyle={styles.content}
        data={[activeTab]}
        keyExtractor={(item) => item}
        ListHeaderComponent={
          <View style={styles.headerArea}>
            <AppHeader title="검색" />
            <View style={styles.searchRow}>
              <View style={styles.searchFieldWrap}>
                <TextField
                  autoCapitalize="none"
                  autoCorrect={false}
                  label=""
                  placeholder=""
                  returnKeyType="search"
                  value={query}
                  onChangeText={setQuery}
                  onSubmitEditing={handleSubmitSearch}
                />
              </View>
              <Pressable accessibilityRole="button" onPress={handleSubmitSearch} style={styles.searchButton}>
                <Ionicons color={colors.white} name="search" size={18} />
              </Pressable>
            </View>
            <View style={styles.tabRow}>
              {SEARCH_TABS.map((tab) => {
                const selected = tab.key === activeTab;
                return (
                  <Pressable
                    key={tab.key}
                    onPress={() => setActiveTab(tab.key)}
                    style={[styles.tabChip, selected && styles.tabChipActive]}
                  >
                    <Text style={[styles.tabChipText, selected && styles.tabChipTextActive]}>{tab.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        }
        renderItem={() => {
          if (activeTab === "mates") {
            return renderMateTab();
          }
          if (activeTab === "hashtags") {
            return renderHashtagTab();
          }
          if (activeTab === "patterns") {
            return renderPatternTab();
          }
          return renderCommunityTab();
        }}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: 120,
  },
  headerArea: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  searchFieldWrap: {
    flex: 1,
  },
  searchButton: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  tabRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  tabChip: {
    minHeight: 38,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  tabChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  tabChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMuted,
  },
  tabChipTextActive: {
    color: colors.primary,
  },
  sectionList: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  profileRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surfaceMuted,
  },
  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.primary,
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  username: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  bio: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  followButton: {
    minWidth: 100,
  },
  hashtagBlock: {
    gap: spacing.sm,
  },
  hashtagRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  hashtagRowActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  hashtagCopy: {
    gap: 4,
  },
  hashtagTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  hashtagMeta: {
    fontSize: 12,
    color: colors.textMuted,
  },
  linkedPostList: {
    gap: spacing.sm,
    paddingLeft: spacing.sm,
  },
  postRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  postThumbWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.surfaceMuted,
  },
  postThumb: {
    width: "100%",
    height: "100%",
  },
  postThumbFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
  },
  postCopy: {
    flex: 1,
    gap: 4,
  },
  postTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  postMeta: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  communityBadge: {
    minWidth: 64,
    minHeight: 34,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
  },
  communityBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
});

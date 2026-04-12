import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { AppHeader } from "@/components/ui/AppHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Screen } from "@/components/ui/Screen";
import { SocialGateCard } from "@/components/SocialGateCard";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/layout";
import { useAuth } from "@/context/AuthContext";
import { feedRemoteRepository } from "@/services/supabase/feedRemoteRepository";
import { FeedPost, ProjectSnapshot } from "@/types/project";

type GridItem = {
  post: FeedPost;
  snapshot: ProjectSnapshot;
};

export default function ProfileShellScreen() {
  const { width } = useWindowDimensions();
  const { profile, user, loading } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [snapshots, setSnapshots] = useState<ProjectSnapshot[]>([]);
  const [fetching, setFetching] = useState(false);
  const [followMeta, setFollowMeta] = useState({
    followerCount: 0,
    followingCount: 0,
  });

  useEffect(() => {
    if (!user) {
      return;
    }

    let mounted = true;
    setFetching(true);

    feedRemoteRepository
      .fetchProfile(user.id)
      .then((data) => {
        if (!mounted) return;
        setPosts(data.posts);
        setSnapshots(data.snapshots);
      })
      .catch(() => {
        if (!mounted) return;
        setPosts([]);
        setSnapshots([]);
      })
      .finally(() => {
        if (!mounted) return;
        setFetching(false);
      });

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user) {
      return;
    }

    let mounted = true;

    feedRemoteRepository
      .fetchFollowMeta(user.id, user.id)
      .then((data) => {
        if (!mounted) return;
        setFollowMeta({
          followerCount: data.followerCount,
          followingCount: data.followingCount,
        });
      })
      .catch(() => {
        if (!mounted) return;
        setFollowMeta({
          followerCount: 0,
          followingCount: 0,
        });
      });

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const gridItems = useMemo(
    () =>
      posts
        .filter((post) => post.channel === "feed")
        .map((post) => ({
          post,
          snapshot: snapshots.find((entry) => entry.id === post.snapshotId),
        }))
        .filter((entry): entry is GridItem => Boolean(entry.snapshot)),
    [posts, snapshots],
  );

  const tileSize = Math.floor((width - spacing.xl * 2 - spacing.xs * 2) / 3);

  return (
    <Screen contentStyle={styles.screen}>
      {!user ? (
        <View style={styles.gatedContent}>
          <AppHeader title="프로필" />
          <SocialGateCard badge="프로필 잠금" title="프로필 잠금" bullets={["내 글", "그리드", "수정", "원격"]} />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.content}
          data={gridItems}
          keyExtractor={(item) => item.post.id}
          numColumns={3}
          columnWrapperStyle={styles.gridRow}
          ListHeaderComponent={
            <View style={styles.headerArea}>
              <AppHeader
                title={profile?.username || "프로필"}
                actionIcon="settings-outline"
                onPressAction={() => router.push("/settings")}
              />

              <View style={styles.heroTopRow}>
                {profile?.avatarUrl ? (
                  <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarShell}>
                    <Text style={styles.avatarLetter}>
                      {(profile?.username || user.email?.slice(0, 1) || "M").slice(0, 1).toUpperCase()}
                    </Text>
                  </View>
                )}

                <View style={styles.statsRow}>
                  <CompactStat label="게시물" value={String(gridItems.length)} />
                  <CompactStat label="팔로워" value={String(followMeta.followerCount)} />
                  <CompactStat label="팔로잉" value={String(followMeta.followingCount)} />
                </View>
              </View>

              <View style={styles.profileCopy}>
                <Text numberOfLines={1} style={styles.name}>
                  {profile?.username || user.email?.split("@")[0] || "메이트"}
                </Text>
                <Text numberOfLines={3} style={styles.bio}>
                  {loading ? "불러오는 중" : profile?.bio || "소개를 추가해 보세요."}
                </Text>
              </View>

              <View style={styles.primaryActionRow}>
                <PrimaryButton title="프로필 수정" variant="secondary" onPress={() => router.push("/profile/edit")} />
                <PrimaryButton title="내 뜨개방" variant="secondary" onPress={() => router.push("/workspace")} />
              </View>

              <View style={styles.gridHeader}>
                <Ionicons color={colors.text} name="grid-outline" size={16} />
              </View>
            </View>
          }
          ListEmptyComponent={
            <EmptyState title={fetching ? "불러오는 중" : "피드가 아직 없어요"} description={fetching ? "잠시만" : "내 피드가 여기에 모여요"} />
          }
          renderItem={({ item, index }) => (
            <Pressable
              onPress={() => router.push({ pathname: "/posts/[id]", params: { id: item.post.id, from: "/profile/index" } })}
              style={[
                styles.tile,
                {
                  width: tileSize,
                  height: tileSize,
                  marginRight: (index + 1) % 3 === 0 ? 0 : spacing.xs,
                },
              ]}
            >
              {item.snapshot.photoUri ? (
                <Image source={{ uri: item.snapshot.photoUri }} style={styles.tileImage} />
              ) : (
                <View style={styles.tileFallback}>
                  <Text numberOfLines={2} style={styles.tileTitle}>
                    {item.post.title || item.snapshot.title}
                  </Text>
                  {item.snapshot.note ? (
                    <Text numberOfLines={2} style={styles.tileMeta}>
                      {item.snapshot.note}
                    </Text>
                  ) : (
                    <Text style={styles.tileMeta}>{item.snapshot.row}단</Text>
                  )}
                </View>
              )}
            </Pressable>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
}

function CompactStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  gatedContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    gap: spacing.lg,
    paddingBottom: 120,
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
  heroTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  avatarShell: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
  },
  avatarImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.surfaceMuted,
  },
  avatarLetter: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.primary,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.xs,
    flex: 1,
  },
  statCard: {
    flex: 1,
    minHeight: 64,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: colors.text,
  },
  profileCopy: {
    gap: 4,
  },
  name: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
    color: colors.text,
  },
  bio: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.text,
  },
  primaryActionRow: {
    flexDirection: "row",
  },
  gridHeader: {
    minHeight: 44,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  gridRow: {
    marginBottom: spacing.xs,
  },
  tile: {
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tileImage: {
    width: "100%",
    height: "100%",
  },
  tileFallback: {
    flex: 1,
    justifyContent: "space-between",
    padding: spacing.sm,
    backgroundColor: colors.surfaceMuted,
  },
  tileTitle: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "700",
    color: colors.text,
  },
  tileMeta: {
    fontSize: 11,
    lineHeight: 15,
    color: colors.textMuted,
  },
});

import { Href, Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { AppHeader } from "@/components/ui/AppHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Screen } from "@/components/ui/Screen";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/layout";
import { useAuth } from "@/context/AuthContext";
import { FeedPost, ProjectSnapshot, SocialProfile } from "@/types/project";
import { feedRemoteRepository } from "@/services/supabase/feedRemoteRepository";

export default function PublicProfileScreen() {
  const { width } = useWindowDimensions();
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [snapshots, setSnapshots] = useState<ProjectSnapshot[]>([]);
  const [followMeta, setFollowMeta] = useState({
    followerCount: 0,
    followingCount: 0,
    isFollowing: false,
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) {
      return;
    }

    let mounted = true;

    feedRemoteRepository
      .fetchProfile(String(id))
      .then((data) => {
        if (!mounted) return;
        setProfile(data.profile);
        setPosts(data.posts);
        setSnapshots(data.snapshots);
      })
      .catch(() => {
        if (!mounted) return;
        setProfile(null);
        setPosts([]);
        setSnapshots([]);
      });

    if (user) {
      feedRemoteRepository
        .fetchFollowMeta(String(id), user.id)
        .then((data) => {
          if (!mounted) return;
          setFollowMeta(data);
        })
        .catch(() => {
          if (!mounted) return;
          setFollowMeta({
            followerCount: 0,
            followingCount: 0,
            isFollowing: false,
          });
        });
    }

    return () => {
      mounted = false;
    };
  }, [id, user?.id]);

  const gridItems = useMemo(
    () =>
      posts
        .map((post) => ({
          post,
          snapshot: snapshots.find((entry) => entry.id === post.snapshotId),
        }))
        .filter((entry): entry is { post: FeedPost; snapshot: ProjectSnapshot } => Boolean(entry.snapshot)),
    [posts, snapshots],
  );

  const tileSize = Math.floor((width - spacing.xl * 2 - spacing.xs * 2) / 3);

  async function handleToggleFollow() {
    if (!user || !profile || user.id === profile.id || busy) {
      return;
    }

    const shouldFollow = !followMeta.isFollowing;

    setBusy(true);
    setFollowMeta((current) => ({
      ...current,
      isFollowing: shouldFollow,
      followerCount: Math.max(current.followerCount + (shouldFollow ? 1 : -1), 0),
    }));

    try {
      await feedRemoteRepository.toggleFollow(user.id, profile.id, shouldFollow);
    } catch {
      setFollowMeta((current) => ({
        ...current,
        isFollowing: !shouldFollow,
        followerCount: Math.max(current.followerCount + (shouldFollow ? -1 : 1), 0),
      }));
      Alert.alert("팔로우 실패", "잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  if (!profile) {
    return (
      <Screen scrollable>
        <Stack.Screen options={{ title: "프로필" }} />
        <EmptyState title="프로필 없음" description="메이트에서 다시 선택" />
      </Screen>
    );
  }

  return (
    <Screen contentStyle={styles.screen}>
      <Stack.Screen options={{ title: "프로필" }} />
      <FlatList
        contentContainerStyle={styles.content}
        data={gridItems}
        keyExtractor={(item) => item.post.id}
        numColumns={3}
        columnWrapperStyle={styles.gridRow}
        ListHeaderComponent={
          <View style={styles.headerArea}>
            <AppHeader
              showBack
              title={profile.username}
              onPressBack={() => {
                if (router.canGoBack()) {
                  router.back();
                  return;
                }
                if (from) {
                  router.replace(from as Href);
                  return;
                }
                router.back();
              }}
            />

            <View style={styles.heroTopRow}>
              {profile.avatarUrl ? (
                <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarText}>{profile.username.slice(0, 1)}</Text>
                </View>
              )}

              <View style={styles.metricsRow}>
                <Metric label="게시물" value={gridItems.length} />
                <Metric label="팔로워" value={followMeta.followerCount} />
                <Metric label="팔로잉" value={followMeta.followingCount} />
              </View>
            </View>

            <View style={styles.copyBlock}>
              <Text style={styles.name}>{profile.username}</Text>
              {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
            </View>

            {user && user.id !== profile.id ? (
              <View style={styles.followRow}>
                <PrimaryButton
                  title={followMeta.isFollowing ? "팔로잉" : "팔로우"}
                  variant={followMeta.isFollowing ? "secondary" : "primary"}
                  disabled={busy}
                  onPress={() => void handleToggleFollow()}
                />
              </View>
            ) : null}

            <View style={styles.gridHeader} />
          </View>
        }
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>공개 글 없음</Text>
          </Card>
        }
        renderItem={({ item, index }) => (
          <Pressable
            onPress={() =>
              router.push({ pathname: "/posts/[id]", params: { id: item.post.id, from: `/profile/${profile.id}` } })
            }
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
              </View>
            )}
          </Pressable>
        )}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
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
  heroTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  avatarFallback: {
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
  avatarText: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.primary,
  },
  metricsRow: {
    flexDirection: "row",
    gap: spacing.xs,
    flex: 1,
  },
  metricCard: {
    flex: 1,
    minHeight: 64,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
  metricLabel: {
    fontSize: 11,
    color: colors.text,
  },
  copyBlock: {
    gap: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
  },
  bio: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.text,
  },
  followRow: {
    flexDirection: "row",
  },
  gridHeader: {
    minHeight: 1,
    borderTopWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.xs,
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
    padding: spacing.sm,
    justifyContent: "flex-end",
    backgroundColor: colors.surfaceMuted,
  },
  tileTitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    color: colors.text,
  },
  emptyCard: {
    marginTop: spacing.md,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
  },
});

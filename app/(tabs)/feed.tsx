import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";

import { AppHeader } from "@/components/ui/AppHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Screen } from "@/components/ui/Screen";
import { SocialPostCard } from "@/components/SocialPostCard";
import { SocialGateCard } from "@/components/SocialGateCard";
import { TextField } from "@/components/ui/TextField";
import { useAuth } from "@/context/AuthContext";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/layout";
import { FeedComment, FeedPost, ProjectSnapshot, SocialProfile } from "@/types/project";
import { feedRemoteRepository } from "@/services/supabase/feedRemoteRepository";

export default function FeedShellScreen() {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [snapshots, setSnapshots] = useState<ProjectSnapshot[]>([]);
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [profiles, setProfiles] = useState<SocialProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [likedPostIds, setLikedPostIds] = useState<string[]>([]);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [openComposerPostId, setOpenComposerPostId] = useState<string | null>(null);
  const [replyTargetByPostId, setReplyTargetByPostId] = useState<Record<string, FeedComment | null>>({});
  const [followStateByProfileId, setFollowStateByProfileId] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user) {
      return;
    }

    let mounted = true;

    setLoading(true);
    feedRemoteRepository
      .fetchChannel("feed")
      .then((data) => {
        if (!mounted) return;
        setPosts(data.posts);
        setSnapshots(data.snapshots);
        setComments(data.comments);
        setProfiles(data.profiles);
      })
      .catch(() => {
        if (!mounted) return;
        setPosts([]);
        setSnapshots([]);
        setComments([]);
        setProfiles([]);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user || !profiles.length) {
      setFollowStateByProfileId({});
      return;
    }

    let mounted = true;
    const targetIds = [...new Set(profiles.map((entry) => entry.id).filter((id) => id && id !== user.id))];

    Promise.all(
      targetIds.map(async (profileId) => ({
        profileId,
        meta: await feedRemoteRepository.fetchFollowMeta(profileId, user.id),
      })),
    )
      .then((entries) => {
        if (!mounted) return;
        setFollowStateByProfileId(
          entries.reduce<Record<string, boolean>>((acc, entry) => {
            acc[entry.profileId] = entry.meta.isFollowing;
            return acc;
          }, {}),
        );
      })
      .catch(() => {
        if (!mounted) return;
        setFollowStateByProfileId({});
      });

    return () => {
      mounted = false;
    };
  }, [profiles, user?.id]);

  async function handleToggleLike(postId: string) {
    if (!user) return;

    const liked = likedPostIds.includes(postId);
    setLikedPostIds((current) => (liked ? current.filter((id) => id !== postId) : [...current, postId]));
    setPosts((current) =>
      current.map((post) =>
        post.id === postId ? { ...post, likeCount: Math.max(post.likeCount + (liked ? -1 : 1), 0) } : post,
      ),
    );

    try {
      await feedRemoteRepository.toggleLike(postId, user.id, !liked);
    } catch {
      setLikedPostIds((current) => (liked ? [...current, postId] : current.filter((id) => id !== postId)));
      setPosts((current) =>
        current.map((post) =>
          post.id === postId ? { ...post, likeCount: Math.max(post.likeCount + (liked ? 1 : -1), 0) } : post,
        ),
      );
      Alert.alert("하트 실패", "잠시 후 다시 시도해 주세요.");
    }
  }

  async function handleSubmitComment(postId: string) {
    if (!user) return;

    const draft = (commentDrafts[postId] || "").trim();
    if (!draft) {
      return;
    }

    const replyTarget = replyTargetByPostId[postId] ?? null;

    const optimisticComment: FeedComment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      postId,
      parentCommentId: replyTarget?.id,
      authorUserId: user.id,
      authorName: profile?.username || profileName(user.email ?? "", profiles, user.id),
      body: draft,
      createdAt: new Date().toISOString(),
    };

    setComments((current) => [...current, optimisticComment]);
    setCommentDrafts((current) => ({ ...current, [postId]: "" }));
    setOpenComposerPostId(null);
    setReplyTargetByPostId((current) => ({ ...current, [postId]: null }));

    try {
      await feedRemoteRepository.publishComment(optimisticComment);
    } catch {
      setComments((current) => current.filter((comment) => comment.id !== optimisticComment.id));
      setCommentDrafts((current) => ({ ...current, [postId]: draft }));
      setOpenComposerPostId(postId);
      setReplyTargetByPostId((current) => ({ ...current, [postId]: replyTarget }));
      Alert.alert("댓글 실패", "잠시 후 다시 시도해 주세요.");
    }
  }

  async function handleToggleFollow(profileId: string) {
    if (!user || !profileId || profileId === user.id) {
      return;
    }

    const isFollowing = Boolean(followStateByProfileId[profileId]);
    setFollowStateByProfileId((current) => ({
      ...current,
      [profileId]: !isFollowing,
    }));

    try {
      await feedRemoteRepository.toggleFollow(user.id, profileId, !isFollowing);
    } catch {
      setFollowStateByProfileId((current) => ({
        ...current,
        [profileId]: isFollowing,
      }));
      Alert.alert("팔로우 실패", "잠시 후 다시 시도해 주세요.");
    }
  }

  const postItems = useMemo(
    () =>
      posts
        .map((post) => ({
          post,
          snapshot: snapshots.find((entry) => entry.id === post.snapshotId),
          author: profiles.find((entry) => entry.id === post.authorUserId),
          comments: comments.filter((entry) => entry.postId === post.id),
        }))
        .filter((entry) => entry.snapshot),
    [comments, posts, profiles, snapshots],
  );

  return (
    <Screen contentStyle={styles.screen}>
      {!user ? (
        <View style={styles.content}>
          <AppHeader title="피드" />
          <SocialGateCard badge="로그인 후 이용" title="피드 잠금" bullets={["원격", "읽기", "댓글", "삭제"]} />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.content}
          data={postItems}
          keyExtractor={(item) => item.post.id}
          ListHeaderComponent={
            <AppHeader title="피드" />
          }
          ListEmptyComponent={
            <EmptyState
              title={loading ? "불러오는 중" : "피드 없음"}
              description={loading ? "잠시만" : "원격 글이 아직 없어요"}
            />
          }
          renderItem={({ item }) =>
            item.snapshot ? (
              <SocialPostCard
                post={item.post}
                snapshot={item.snapshot}
                author={item.author}
                comments={item.comments}
                isLiked={likedPostIds.includes(item.post.id)}
                commentDraft={commentDrafts[item.post.id] || ""}
                activeReplyCommentId={replyTargetByPostId[item.post.id]?.id ?? null}
                onOpenPost={() => router.push({ pathname: "/posts/[id]", params: { id: item.post.id, from: "/feed" } })}
                onOpenProfile={
                  item.author ? () => router.push({ pathname: "/profile/[id]", params: { id: item.author?.id, from: "/feed" } }) : undefined
                }
                onToggleLike={() => void handleToggleLike(item.post.id)}
                onToggleFollowAuthor={
                  item.author?.id && item.author.id !== user.id ? () => void handleToggleFollow(item.author!.id) : undefined
                }
                isFollowingAuthor={item.author?.id ? Boolean(followStateByProfileId[item.author.id]) : false}
                onPressComment={() =>
                  setOpenComposerPostId((current) => (current === item.post.id ? null : item.post.id))
                }
                onPressReplyComment={(comment) => {
                  setOpenComposerPostId(item.post.id);
                  setReplyTargetByPostId((current) => ({
                    ...current,
                    [item.post.id]: comment,
                  }));
                }}
                commentComposer={
                  openComposerPostId === item.post.id ? (
                    <View style={styles.commentComposer}>
                      <View style={styles.commentComposerRow}>
                        <View style={styles.commentFieldWrap}>
                          <TextField
                            label=""
                            placeholder={replyTargetByPostId[item.post.id] ? "답글 쓰는 중" : "댓글"}
                            value={commentDrafts[item.post.id] || ""}
                            onChangeText={(text) =>
                              setCommentDrafts((current) => ({
                                ...current,
                                [item.post.id]: text,
                              }))
                            }
                          />
                        </View>
                        <Pressable
                          hitSlop={10}
                          onPress={() => void handleSubmitComment(item.post.id)}
                          style={styles.sendButton}
                        >
                          <Ionicons color={colors.white} name="arrow-up" size={18} />
                        </Pressable>
                      </View>
                    </View>
                  ) : undefined
                }
              />
            ) : null
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    gap: spacing.lg,
    paddingBottom: 120,
  },
  separator: {
    height: spacing.md,
  },
  commentComposer: {
    gap: spacing.xs,
  },
  commentComposerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  commentFieldWrap: {
    flex: 1,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
});

function profileName(email: string, profiles: SocialProfile[], userId: string) {
  return profiles.find((entry) => entry.id === userId)?.username || email.split("@")[0] || "메이트";
}

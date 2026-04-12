import { Ionicons } from "@expo/vector-icons";
import { Href, Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppHeader } from "@/components/ui/AppHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Screen } from "@/components/ui/Screen";
import { TextField } from "@/components/ui/TextField";
import { colors } from "@/constants/colors";
import { radius, spacing } from "@/constants/layout";
import { useAuth } from "@/context/AuthContext";
import { FeedComment, FeedPost, ProjectSnapshot, SocialProfile } from "@/types/project";
import { feedRemoteRepository } from "@/services/supabase/feedRemoteRepository";

const COMMUNITY_TOPIC_LABELS: Record<string, string> = {
  질문: "질문",
  도안: "도안",
  재료: "재료",
  완성진행: "완성/진행",
  메이트: "메이트",
};

export default function PostDetailScreen() {
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const { user, profile } = useAuth();
  const [post, setPost] = useState<FeedPost | null>(null);
  const [snapshot, setSnapshot] = useState<ProjectSnapshot | null>(null);
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [profiles, setProfiles] = useState<SocialProfile[]>([]);
  const [draft, setDraft] = useState("");
  const [replyTarget, setReplyTarget] = useState<FeedComment | null>(null);
  const [expandedThreadIds, setExpandedThreadIds] = useState<string[]>([]);

  useEffect(() => {
    if (!id) {
      return;
    }

    let mounted = true;
    feedRemoteRepository
      .fetchPost(String(id))
      .then((data) => {
        if (!mounted) return;
        setPost(data.posts[0] ?? null);
        setSnapshot(data.snapshots[0] ?? null);
        setComments(data.comments);
        setProfiles(data.profiles);
      })
      .catch(() => {
        if (!mounted) return;
        setPost(null);
        setSnapshot(null);
        setComments([]);
        setProfiles([]);
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  const author = useMemo(
    () => profiles.find((entry) => entry.id === post?.authorUserId),
    [post?.authorUserId, profiles],
  );
  const commentThreads = useMemo(() => buildCommentThreads(comments), [comments]);

  async function handleSubmitComment() {
    if (!user || !post) {
      return;
    }

    const body = draft.trim();
    if (!body) {
      return;
    }

    const optimisticComment: FeedComment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      postId: post.id,
      parentCommentId: replyTarget?.id,
      authorUserId: user.id,
      authorName: profile?.username || user.email?.split("@")[0] || "메이트",
      body,
      createdAt: new Date().toISOString(),
    };

    setComments((current) => [...current, optimisticComment]);
    setDraft("");
    setReplyTarget(null);

    try {
      await feedRemoteRepository.publishComment(optimisticComment);
    } catch {
      setComments((current) => current.filter((entry) => entry.id !== optimisticComment.id));
      setDraft(body);
      setReplyTarget(replyTarget);
      Alert.alert("댓글 실패", "잠시 후 다시 시도해 주세요.");
    }
  }

  if (!post || !snapshot) {
    return (
      <Screen scrollable>
        <Stack.Screen options={{ title: "상세" }} />
        <EmptyState title="게시글 없음" description="피드에서 다시 선택" />
      </Screen>
    );
  }

  const isCommunity = post.channel === "community";
  const communityTopic = isCommunity ? getCommunityTopic(post.hashtags, post.type) : null;
  const visibleCommunityTags = isCommunity
    ? post.hashtags.filter((tag) => tag !== communityTopic?.raw)
    : post.hashtags;

  return (
    <Screen contentStyle={styles.screen}>
      <Stack.Screen options={{ title: "상세" }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppHeader
          showBack
          title={isCommunity ? "뜨모저모" : "피드"}
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

        <Card style={styles.card}>
          <View style={styles.postHeader}>
            <Text style={styles.author}>{author?.username || post.authorName}</Text>
            <Text style={styles.postDate}>{new Date(post.createdAt).toLocaleDateString("ko-KR")}</Text>
          </View>
          {isCommunity ? (
            <>
              {communityTopic ? (
                <View style={styles.topicBadge}>
                  <Text style={styles.topicBadgeText}>{communityTopic.label}</Text>
                </View>
              ) : null}
              {post.caption ? (
                <Text style={styles.communityCaption}>{post.caption}</Text>
              ) : (
                <Text style={styles.communityTitle}>{post.title}</Text>
              )}
              {!!visibleCommunityTags.length && (
                <View style={styles.tagRow}>
                  {visibleCommunityTags.map((tag) => (
                    <InfoChip key={tag} label={`#${tag}`} />
                  ))}
                </View>
              )}
            </>
          ) : (
            <>
              {snapshot.photoUri ? <Image source={{ uri: snapshot.photoUri }} style={styles.photo} /> : null}
              {post.caption ? <Text style={styles.caption}>{post.caption}</Text> : null}
              {!!post.hashtags.length && (
                <View style={styles.tagRow}>
                  {post.hashtags.map((tag) => (
                    <InfoChip key={tag} label={`#${tag}`} />
                  ))}
                </View>
              )}
            </>
          )}
        </Card>

        <Card style={styles.card}>
          {commentThreads.length === 0 ? (
            <Text style={styles.emptyText}>첫 댓글을 남겨보세요.</Text>
          ) : (
            commentThreads.map((thread) => (
              <View key={thread.comment.id} style={styles.threadBlock}>
                <View style={styles.commentBlock}>
                  <Text style={styles.commentAuthor}>{thread.comment.authorName}</Text>
                  <Text style={styles.commentBody}>{thread.comment.body}</Text>
                  <Pressable hitSlop={10} onPress={() => setReplyTarget(thread.comment)}>
                    <Text
                      style={[
                        styles.replyActionText,
                        replyTarget?.id === thread.comment.id && styles.replyActionTextActive,
                      ]}
                    >
                      답글
                    </Text>
                  </Pressable>
                </View>

                {thread.replies.length ? (
                  <View style={styles.replyList}>
                    <Pressable
                      onPress={() =>
                        setExpandedThreadIds((current) =>
                          current.includes(thread.comment.id)
                            ? current.filter((id) => id !== thread.comment.id)
                            : [...current, thread.comment.id],
                        )
                      }
                    >
                      <Text style={styles.replyExpandText}>
                        {expandedThreadIds.includes(thread.comment.id)
                          ? "답글 숨기기"
                          : `답글 ${thread.replies.length}개`}
                      </Text>
                    </Pressable>
                    {expandedThreadIds.includes(thread.comment.id)
                      ? thread.replies.map((reply) => (
                          <View key={reply.id} style={styles.replyBlock}>
                            <Text style={styles.commentAuthor}>{reply.authorName}</Text>
                            <Text style={styles.commentBody}>{reply.body}</Text>
                          </View>
                        ))
                      : null}
                  </View>
                ) : null}
              </View>
            ))
          )}

          {user ? (
            <View style={styles.composer}>
              <View style={styles.composerRow}>
                <View style={styles.composerField}>
                  <TextField
                    label=""
                    placeholder={replyTarget ? "답글 쓰는 중" : "댓글"}
                    value={draft}
                    onChangeText={setDraft}
                  />
                </View>
                <Pressable hitSlop={10} onPress={() => void handleSubmitComment()} style={styles.sendButton}>
                  <Ionicons color={colors.white} name="arrow-up" size={18} />
                </Pressable>
              </View>
            </View>
          ) : null}
        </Card>
      </ScrollView>
    </Screen>
  );
}

function getCommunityTopic(hashtags: string[], type?: FeedPost["type"]) {
  const topic = hashtags.find((tag) => COMMUNITY_TOPIC_LABELS[tag]);
  if (!topic) {
    return {
      raw: type === "question" ? "질문" : "이야기",
      label: type === "question" ? "질문" : "이야기",
    };
  }

  return {
    raw: topic,
    label: COMMUNITY_TOPIC_LABELS[topic],
  };
}

function buildCommentThreads(comments: FeedComment[]) {
  const childrenByParent = new Map<string, FeedComment[]>();
  const roots: FeedComment[] = [];

  comments.forEach((comment) => {
    if (comment.parentCommentId) {
      const bucket = childrenByParent.get(comment.parentCommentId) ?? [];
      bucket.push(comment);
      childrenByParent.set(comment.parentCommentId, bucket);
      return;
    }

    roots.push(comment);
  });

  return roots.map((comment) => ({
    comment,
    replies: childrenByParent.get(comment.id) ?? [],
  }));
}

function InfoChip({ label }: { label: string }) {
  return (
    <View style={styles.infoChip}>
      <Text style={styles.infoChipText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: 120,
    gap: spacing.md,
  },
  card: {
    gap: spacing.md,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  author: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  postDate: {
    fontSize: 12,
    color: colors.textMuted,
  },
  communityTitle: {
    fontSize: 18,
    lineHeight: 25,
    fontWeight: "700",
    color: colors.text,
  },
  topicBadge: {
    alignSelf: "flex-start",
    minHeight: 28,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
  },
  topicBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  communityCaption: {
    fontSize: 16,
    lineHeight: 25,
    color: colors.text,
  },
  caption: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.text,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  photo: {
    width: "100%",
    aspectRatio: 4 / 5,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
  },
  infoChip: {
    minHeight: 28,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
  },
  infoChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  commentBlock: {
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  commentBody: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMuted,
  },
  threadBlock: {
    gap: spacing.xs,
  },
  replyList: {
    marginLeft: spacing.md,
    gap: spacing.xs,
    paddingLeft: spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: colors.border,
  },
  replyBlock: {
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: 16,
    backgroundColor: colors.surfaceMuted,
  },
  replyActionText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
  },
  replyActionTextActive: {
    color: colors.primary,
  },
  replyExpandText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  composer: {
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
  composerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  composerField: {
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

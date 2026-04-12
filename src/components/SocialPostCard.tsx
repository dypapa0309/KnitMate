import { ReactNode, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { colors } from "@/constants/colors";
import { radius, spacing } from "@/constants/layout";
import { FeedComment, FeedPost, ProjectSnapshot, SocialProfile } from "@/types/project";

const COMMUNITY_TOPIC_LABELS: Record<string, string> = {
  질문: "질문",
  도안: "도안",
  재료: "재료",
  완성진행: "완성/진행",
  메이트: "메이트",
};

export function SocialPostCard({
  post,
  snapshot,
  author,
  comments,
  onOpenPost,
  onOpenProfile,
  isLiked = false,
  commentDraft,
  onToggleLike,
  onPressComment,
  onPressReplyComment,
  activeReplyCommentId,
  commentComposer,
  isFollowingAuthor = false,
  onToggleFollowAuthor,
}: {
  post: FeedPost;
  snapshot: ProjectSnapshot;
  author?: SocialProfile;
  comments: FeedComment[];
  onOpenPost: () => void;
  onOpenProfile?: () => void;
  isLiked?: boolean;
  commentDraft?: string;
  onToggleLike?: () => void;
  onPressComment?: () => void;
  onPressReplyComment?: (comment: FeedComment) => void;
  activeReplyCommentId?: string | null;
  commentComposer?: ReactNode;
  isFollowingAuthor?: boolean;
  onToggleFollowAuthor?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const threads = useMemo(() => buildCommentThreads(comments), [comments]);
  const previewThread = threads[0];
  const avatarLabel = (author?.username || post.authorName || "K").slice(0, 1).toUpperCase();
  const canOpenProfile = Boolean(onOpenProfile);
  const canFollowAuthor = Boolean(onToggleFollowAuthor);
  const isCommunity = post.channel === "community";
  const bodyPreview = post.caption || snapshot.note || "";
  const communityTopic = isCommunity ? getCommunityTopic(post.hashtags, post.type) : null;
  const visibleCommunityTags = isCommunity
    ? post.hashtags.filter((tag) => tag !== communityTopic?.raw).slice(0, 2)
    : [];

  return (
    <Card style={[styles.card, isCommunity && styles.communityCard]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={onOpenProfile} style={styles.avatarWrap} disabled={!canOpenProfile}>
            {author?.avatarUrl ? (
              <Image source={{ uri: author.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>{avatarLabel}</Text>
              </View>
            )}
            {canOpenProfile ? (
              <Pressable hitSlop={10} onPress={() => setMenuOpen((current) => !current)} style={styles.avatarMenuButton}>
                <Ionicons color={colors.white} name="add" size={12} />
              </Pressable>
            ) : null}
          </Pressable>

          <Pressable onPress={onOpenProfile} style={styles.copy} disabled={!canOpenProfile}>
            <Text numberOfLines={1} style={styles.author}>
              {author?.username || post.authorName}
            </Text>
            <Text numberOfLines={1} style={styles.meta}>
              {new Date(post.createdAt).toLocaleDateString("ko-KR")}
            </Text>
          </Pressable>
        </View>

        {menuOpen ? (
          <View style={styles.contextMenu}>
            {canFollowAuthor ? (
              <Pressable
                onPress={() => {
                  setMenuOpen(false);
                  onToggleFollowAuthor?.();
                }}
                style={styles.contextRow}
              >
                <Ionicons
                  color={colors.text}
                  name={isFollowingAuthor ? "person-remove-outline" : "person-add-outline"}
                  size={16}
                />
                <Text style={styles.contextText}>{isFollowingAuthor ? "언팔로우" : "팔로우"}</Text>
              </Pressable>
            ) : null}
            {onOpenProfile ? (
              <Pressable
                onPress={() => {
                  setMenuOpen(false);
                  onOpenProfile();
                }}
                style={styles.contextRow}
              >
                <Ionicons color={colors.text} name="person-circle-outline" size={16} />
                <Text style={styles.contextText}>프로필</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>

      {isCommunity ? (
        <Pressable onPress={onOpenPost} style={styles.communityBody}>
          {communityTopic ? (
            <View style={styles.topicBadge}>
              <Text style={styles.topicBadgeText}>{communityTopic.label}</Text>
            </View>
          ) : null}
          {bodyPreview ? (
            <Text numberOfLines={5} style={styles.communityCaption}>
              {bodyPreview}
            </Text>
          ) : (
            <Text numberOfLines={3} style={styles.communityTitle}>
              {post.title}
            </Text>
          )}
          {visibleCommunityTags.length ? (
            <View style={styles.tagRow}>
              {visibleCommunityTags.map((tag) => (
                <Text key={tag} style={styles.inlineTag}>
                  #{tag}
                </Text>
              ))}
            </View>
          ) : null}
        </Pressable>
      ) : (
        <Pressable onPress={onOpenPost} style={styles.feedBody}>
          {snapshot.photoUri ? (
            <Image source={{ uri: snapshot.photoUri }} style={styles.photo} />
          ) : (
            <View style={styles.photoFallback}>
              <Ionicons color={colors.textMuted} name="image-outline" size={28} />
            </View>
          )}
          {bodyPreview ? (
            <Text numberOfLines={2} style={styles.feedCaption}>
              {bodyPreview}
            </Text>
          ) : null}
        </Pressable>
      )}

      <View style={styles.footer}>
        <Pressable hitSlop={10} onPress={onToggleLike} style={styles.stat}>
          <Ionicons
            color={isLiked ? colors.primary : colors.textMuted}
            name={isLiked ? "heart" : "heart-outline"}
            size={18}
          />
          <Text style={[styles.statText, isLiked && styles.statTextActive]}>{post.likeCount}</Text>
        </Pressable>
        <Pressable hitSlop={10} onPress={onPressComment} style={styles.stat}>
          <Ionicons
            color={commentDraft ? colors.primary : colors.textMuted}
            name="chatbubble-ellipses-outline"
            size={18}
          />
          <Text style={[styles.statText, Boolean(commentDraft) && styles.statTextActive]}>{comments.length}</Text>
        </Pressable>
      </View>

      {previewThread ? (
        <View style={styles.previewBlock}>
          <View style={styles.previewComment}>
            <Text numberOfLines={1} style={styles.commentAuthor}>
              {previewThread.comment.authorName}
            </Text>
            <Text numberOfLines={2} style={styles.commentBody}>
              {previewThread.comment.body}
            </Text>
          </View>

          <View style={styles.previewReplyRow}>
            <Pressable hitSlop={10} onPress={() => onPressReplyComment?.(previewThread.comment)}>
              <Text
                style={[
                  styles.replyActionText,
                  activeReplyCommentId === previewThread.comment.id && styles.replyActionTextActive,
                ]}
              >
                답글
              </Text>
            </Pressable>
            {previewThread.replies.length ? (
              <Pressable onPress={onOpenPost}>
                <Text style={styles.replyCountText}>답글 {previewThread.replies.length}개</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}

      {commentComposer}
    </Card>
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
  const rootComments: FeedComment[] = [];

  comments.forEach((comment) => {
    if (comment.parentCommentId) {
      const bucket = childrenByParent.get(comment.parentCommentId) ?? [];
      bucket.push(comment);
      childrenByParent.set(comment.parentCommentId, bucket);
      return;
    }

    rootComments.push(comment);
  });

  return rootComments.map((comment) => ({
    comment,
    replies: childrenByParent.get(comment.id) ?? [],
  }));
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    gap: spacing.md,
    overflow: "visible",
  },
  communityCard: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
    position: "relative",
    zIndex: 3,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  copy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    position: "relative",
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceMuted,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
  },
  avatarText: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.primary,
  },
  avatarMenuButton: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  author: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  meta: {
    fontSize: 12,
    color: colors.textMuted,
  },
  contextMenu: {
    position: "absolute",
    top: 34,
    left: 28,
    minWidth: 124,
    padding: 8,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.98)",
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  contextRow: {
    minHeight: 36,
    borderRadius: 12,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
  },
  contextText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  feedBody: {
    gap: spacing.md,
  },
  photo: {
    width: "100%",
    aspectRatio: 4 / 5,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
  },
  photoFallback: {
    width: "100%",
    aspectRatio: 4 / 5,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  feedCaption: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
  },
  communityBody: {
    gap: spacing.xs,
  },
  topicBadge: {
    alignSelf: "flex-start",
    minHeight: 28,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
  },
  topicBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  communityTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    color: colors.text,
  },
  communityCaption: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  inlineTag: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
  },
  statTextActive: {
    color: colors.primary,
  },
  previewBlock: {
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: colors.border,
    gap: 8,
  },
  previewComment: {
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  commentBody: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  previewReplyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  replyActionText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
  },
  replyActionTextActive: {
    color: colors.primary,
  },
  replyCountText: {
    fontSize: 12,
    color: colors.textMuted,
  },
});

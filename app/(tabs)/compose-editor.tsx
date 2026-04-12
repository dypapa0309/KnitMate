import { Ionicons } from "@expo/vector-icons";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SaveFormat, manipulateAsync } from "expo-image-manipulator";

import { AppHeader } from "@/components/ui/AppHeader";
import { Card } from "@/components/ui/Card";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Screen } from "@/components/ui/Screen";
import { TextField } from "@/components/ui/TextField";
import { colors } from "@/constants/colors";
import { radius, spacing } from "@/constants/layout";
import { useAuth } from "@/context/AuthContext";
import { feedRemoteRepository } from "@/services/supabase/feedRemoteRepository";
import { useProjectStore } from "@/stores/useProjectStore";
import { FeedPost, FeedPostChannel, ProjectSnapshot } from "@/types/project";
import { createId } from "@/utils/id";

type FeedStep = "photo" | "write";

const COMMUNITY_TOPICS = [
  { label: "질문", value: "질문" },
  { label: "도안", value: "도안" },
  { label: "재료", value: "재료" },
  { label: "완성/진행", value: "완성진행" },
  { label: "메이트", value: "메이트" },
] as const;

function buildHashtagList(raw: string) {
  const unique = new Set<string>();

  raw
    .split(/[,\s]+/)
    .map((value) => value.trim().replace(/^#+/, "").replace(/\s+/g, ""))
    .filter(Boolean)
    .forEach((value) => unique.add(value));

  return [...unique];
}

function buildPostTitle(channel: FeedPostChannel, caption: string, selectedProjectTitle?: string) {
  const firstLine = caption
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  if (firstLine) {
    return firstLine.slice(0, 40);
  }

  if (channel === "feed" && selectedProjectTitle) {
    return selectedProjectTitle;
  }

  return channel === "community" ? "뜨모저모" : "작업 기록";
}

export default function ComposeEditorScreen() {
  const { channel } = useLocalSearchParams<{ channel?: "feed" | "community" }>();
  const { user, profile } = useAuth();
  const projects = useProjectStore((state) => state.projects);
  const activeProjects = useMemo(
    () =>
      [...projects]
        .filter((project) => !project.archived)
        .sort((a, b) => new Date(b.lastWorkedAt).getTime() - new Date(a.lastWorkedAt).getTime()),
    [projects],
  );

  const initialProject = activeProjects[0] ?? null;
  const currentChannel: FeedPostChannel = channel === "community" ? "community" : "feed";
  const [selectedProjectId, setSelectedProjectId] = useState(initialProject?.id ?? "");
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState(channel === "community" ? "" : initialProject?.tag ?? "");
  const [selectedCommunityTopic, setSelectedCommunityTopic] =
    useState<(typeof COMMUNITY_TOPICS)[number]["value"]>("질문");
  const [step, setStep] = useState<FeedStep>("photo");
  const [submitting, setSubmitting] = useState(false);
  const [processingPhoto, setProcessingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const selectedProject = activeProjects.find((project) => project.id === selectedProjectId) ?? initialProject;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  async function handlePickPhoto() {
    try {
      setPhotoError(null);
      setProcessingPhoto(true);

      const ImagePicker = require("expo-image-picker") as typeof import("expo-image-picker");
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("사진 권한 필요", "사진을 올리려면 보관함 접근이 필요해요.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.9,
      });

      if (result.canceled || !result.assets[0]?.uri || !mountedRef.current) {
        return;
      }

      setPhotoUri(result.assets[0].uri);
      setStep("write");
    } catch (error) {
      const message = error instanceof Error ? error.message : "사진 선택 중 문제가 생겼어요.";
      if (mountedRef.current) {
        setPhotoError(message);
      }
      Alert.alert("사진 선택 실패", "앱을 다시 열지 않아도 괜찮아요. 한 번 더 시도해 주세요.");
    } finally {
      if (mountedRef.current) {
        setProcessingPhoto(false);
      }
    }
  }

  async function handleRotatePhoto() {
    if (!photoUri) {
      return;
    }

    try {
      setProcessingPhoto(true);
      const result = await manipulateAsync(
        photoUri,
        [{ rotate: 90 }],
        { compress: 0.9, format: SaveFormat.JPEG },
      );
      if (!mountedRef.current) {
        return;
      }
      setPhotoUri(result.uri);
    } catch (error) {
      Alert.alert("회전 실패", error instanceof Error ? error.message : "다시 시도해 주세요.");
    } finally {
      if (mountedRef.current) {
        setProcessingPhoto(false);
      }
    }
  }

  async function handleSubmit() {
    if (!user) {
      Alert.alert("로그인 필요", "로그인 상태를 먼저 확인해 주세요.");
      return;
    }

    const trimmedCaption = caption.trim();
    if (!trimmedCaption) {
      Alert.alert("내용 필요", currentChannel === "community" ? "짧은 글을 먼저 써 주세요." : "사진과 함께 올릴 내용을 적어 주세요.");
      return;
    }

    if (currentChannel === "feed" && !selectedProject) {
      Alert.alert("작업 선택", "연결할 작업을 하나 골라 주세요.");
      return;
    }

    if (currentChannel === "feed" && !photoUri) {
      Alert.alert("사진 먼저", "피드 글은 사진을 먼저 고른 뒤에 올려 주세요.");
      return;
    }

    const timestamp = new Date().toISOString();
    const snapshotId = createId("snapshot");
    const postId = createId("post");
    const snapshotHashtags = buildHashtagList(
      currentChannel === "community"
        ? `${selectedCommunityTopic} ${hashtags}`
        : hashtags || selectedProject?.tag || "",
    );
    const derivedTitle = buildPostTitle(currentChannel, trimmedCaption, selectedProject?.title);

    const snapshot: ProjectSnapshot = {
      id: snapshotId,
      projectId: selectedProject?.id ?? `community-${postId}`,
      title: derivedTitle,
      row: selectedProject?.currentRow ?? 0,
      note: trimmedCaption,
      yarnInfo: selectedProject?.yarnInfo ?? "",
      needleInfo: selectedProject?.needleInfo ?? "",
      methodSummary:
        currentChannel === "community"
          ? "뜨모저모 글"
          : selectedProject?.notes?.trim() || selectedProject?.tag || "작업 기록",
      photoUri: currentChannel === "feed" ? photoUri : undefined,
      hashtags: snapshotHashtags,
      createdAt: timestamp,
    };

    const post: FeedPost = {
      id: postId,
      projectId: snapshot.projectId,
      snapshotId,
      channel: currentChannel,
      authorUserId: user.id,
      authorName: profile?.username || user.email?.split("@")[0] || "KnitMate 메이트",
      type: currentChannel === "community" ? "question" : "share",
      title: derivedTitle,
      caption: trimmedCaption,
      likeCount: 0,
      hashtags: snapshotHashtags,
      createdAt: timestamp,
    };

    setSubmitting(true);
    try {
      await feedRemoteRepository.publishSnapshot(snapshot, post);
      router.replace({
        pathname: "/posts/[id]",
        params: { id: postId, from: currentChannel === "feed" ? "/feed" : "/community" },
      });
    } catch (error) {
      Alert.alert("게시 실패", error instanceof Error ? error.message : "잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  function renderFeedPhotoStep() {
    return (
      <Card style={styles.card}>
        <Pressable onPress={() => void handlePickPhoto()} style={styles.photoTapCard}>
          {processingPhoto ? (
            <View style={styles.heroPlaceholder}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.heroPhoto} />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Ionicons color={colors.textMuted} name="image-outline" size={32} />
            </View>
          )}
        </Pressable>
        {photoError ? <Text style={styles.photoError}>{photoError}</Text> : null}
      </Card>
    );
  }

  function renderFeedWriteStep() {
    return (
      <>
        <Card style={styles.card}>
          <View style={styles.feedComposerHeader}>
            <Pressable onPress={() => void handlePickPhoto()} style={styles.thumbWrap}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.thumbImage} />
              ) : (
                <View style={styles.thumbPlaceholder}>
                  <Ionicons color={colors.textMuted} name="image-outline" size={20} />
                </View>
              )}
            </Pressable>
            <View style={styles.feedComposerHeaderCopy}>
              <Text style={styles.feedComposerEyebrow}>피드</Text>
              <Text style={styles.feedComposerHint}>사진은 눌러서 다시 고를 수 있어요.</Text>
            </View>
          </View>
          <View style={styles.photoActionRow}>
            <PrimaryButton title="다시 고르기" variant="secondary" onPress={() => void handlePickPhoto()} />
            <PrimaryButton title="회전" variant="secondary" onPress={() => void handleRotatePhoto()} disabled={!photoUri || processingPhoto} />
          </View>
          <TextField
            label=""
            multiline
            placeholder="무엇을 뜨고 있는지 들려주세요"
            value={caption}
            onChangeText={setCaption}
          />
          <TextField
            label=""
            placeholder="#도안명 #실 #기록"
            value={hashtags}
            onChangeText={setHashtags}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </Card>

        {selectedProject ? (
          <Card style={styles.card}>
            <View style={styles.projectHeader}>
              <Text style={styles.projectHeaderTitle}>작업 연결</Text>
              <Text style={styles.projectHeaderHint}>가볍게 선택</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.projectRow}>
              {activeProjects.map((project) => {
                const selected = project.id === selectedProjectId;
                return (
                  <View key={project.id} style={styles.projectChipWrap}>
                    <PrimaryButton
                      title={project.title}
                      variant={selected ? "primary" : "secondary"}
                      onPress={() => {
                        setSelectedProjectId(project.id);
                        setHashtags((current) => current || project.tag || "");
                      }}
                    />
                  </View>
                );
              })}
            </ScrollView>
          </Card>
        ) : null}

        <PrimaryButton
          title={submitting ? "게시 중" : "게시"}
          onPress={() => void handleSubmit()}
          disabled={submitting || !photoUri}
        />
      </>
    );
  }

  function renderCommunityComposer() {
    return (
      <>
        <Card style={styles.card}>
          <View style={styles.topicSection}>
            <Text style={styles.topicTitle}>주제</Text>
            <View style={styles.topicRow}>
              {COMMUNITY_TOPICS.map((topic) => {
                const selected = topic.value === selectedCommunityTopic;
                return (
                  <Pressable
                    key={topic.value}
                    onPress={() => setSelectedCommunityTopic(topic.value)}
                    style={[styles.topicChip, selected && styles.topicChipActive]}
                  >
                    <Text style={[styles.topicChipText, selected && styles.topicChipTextActive]}>
                      {topic.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <TextField
            label=""
            multiline
            placeholder="동네 얘기처럼 가볍게 남겨보세요"
            value={caption}
            onChangeText={setCaption}
          />
          <TextField
            label=""
            placeholder="#도안 #질문 #후기"
            value={hashtags}
            onChangeText={setHashtags}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </Card>

        <PrimaryButton title={submitting ? "게시 중" : "게시"} onPress={() => void handleSubmit()} disabled={submitting} />
      </>
    );
  }

  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: currentChannel === "feed" ? "피드" : "뜨모저모" }} />
      <View style={styles.content}>
        <AppHeader
          showBack
          title={currentChannel === "feed" ? (step === "photo" ? "사진 선택" : "피드") : "뜨모저모"}
          onPressBack={() => {
            if (currentChannel === "feed" && step === "write") {
              setStep("photo");
              return;
            }
            router.back();
          }}
        />

        {currentChannel === "feed"
          ? step === "photo"
            ? renderFeedPhotoStep()
            : renderFeedWriteStep()
          : renderCommunityComposer()}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: 120,
    gap: spacing.md,
  },
  card: {
    gap: spacing.md,
  },
  photoTapCard: {
    overflow: "hidden",
    borderRadius: 28,
    backgroundColor: colors.surfaceMuted,
  },
  heroPhoto: {
    width: "100%",
    aspectRatio: 4 / 5,
    backgroundColor: colors.surfaceMuted,
  },
  heroPlaceholder: {
    width: "100%",
    aspectRatio: 4 / 5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
  },
  photoError: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.danger,
  },
  feedComposerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  thumbWrap: {
    width: 72,
    height: 96,
    overflow: "hidden",
    borderRadius: 20,
    backgroundColor: colors.surfaceMuted,
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  thumbPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  feedComposerHeaderCopy: {
    flex: 1,
    gap: 4,
  },
  feedComposerEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
  },
  feedComposerHint: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  projectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  photoActionRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  projectHeaderTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  projectHeaderHint: {
    fontSize: 12,
    color: colors.textMuted,
  },
  projectRow: {
    gap: spacing.sm,
  },
  projectChipWrap: {
    minWidth: 120,
  },
  topicSection: {
    gap: spacing.sm,
  },
  topicTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMuted,
  },
  topicRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  topicChip: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topicChipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  topicChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  topicChipTextActive: {
    color: colors.primary,
  },
});

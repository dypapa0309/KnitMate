import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useState } from "react";

import { AppHeader } from "@/components/ui/AppHeader";
import { Card } from "@/components/ui/Card";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Screen } from "@/components/ui/Screen";
import { TextField } from "@/components/ui/TextField";
import { colors } from "@/constants/colors";
import { radius, spacing } from "@/constants/layout";
import { useAuth } from "@/context/AuthContext";

export default function ComposeLauncherScreen() {
  const { channel } = useLocalSearchParams<{ channel?: "feed" | "community" }>();
  const { user, profile } = useAuth();
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");

  if (channel === "feed" || channel === "community") {
    return (
      <Screen contentStyle={styles.screen}>
        <View style={styles.content}>
          <AppHeader showBack title={channel === "feed" ? "피드 글쓰기" : "뜨모저모 글쓰기"} />

          <Card style={styles.launcherCard}>
            <View style={styles.launcherBadge}>
              <Ionicons color={colors.primary} name={channel === "feed" ? "newspaper-outline" : "chatbubbles-outline"} size={16} />
              <Text style={styles.launcherBadgeText}>{channel === "feed" ? "피드" : "뜨모저모"}</Text>
            </View>

            <TextField label="제목" placeholder="짧게" value={title} onChangeText={setTitle} />
            <TextField label="내용" multiline placeholder="사진과 함께 올릴 글" value={caption} onChangeText={setCaption} />

            <View style={styles.helperCard}>
              <Text style={styles.helperTitle}>{profile?.username || user?.email?.split("@")[0] || "메이트"}</Text>
              <Text style={styles.helperBody}>작성 연결은 다음 단계에서 바로 붙일게요. 지금은 로그인 흐름과 진입 경로를 먼저 안정화해 둔 상태예요.</Text>
            </View>

            <PrimaryButton
              title="다음 단계에서 게시"
              onPress={() => Alert.alert("작성 준비 중", "다음 단계에서 원격 게시까지 바로 연결할게요.")}
            />
          </Card>
        </View>
      </Screen>
    );
  }

  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.content}>
        <AppHeader title="추가" />

        <Card style={styles.launcherCard}>
          <View style={styles.launcherBadge}>
            <Ionicons color={colors.primary} name="apps-outline" size={16} />
            <Text style={styles.launcherBadgeText}>빠른 시작</Text>
          </View>

          <ActionBlock
            icon="albums-outline"
            title="작업물 추가"
            actionLabel="새 뜨개"
            onPress={() => router.push("/projects/new")}
          />

          <ActionBlock
            icon="newspaper-outline"
            title="피드 글쓰기"
            actionLabel={user ? "쓰기" : "로그인"}
            onPress={() => router.push(user ? { pathname: "/compose-editor", params: { channel: "feed" } } : "/auth")}
          />

          <ActionBlock
            icon="chatbubbles-outline"
            title="뜨모저모 글쓰기"
            actionLabel={user ? "쓰기" : "로그인"}
            onPress={() => router.push(user ? { pathname: "/compose-editor", params: { channel: "community" } } : "/auth")}
          />
        </Card>
      </View>
    </Screen>
  );
}

function ActionBlock({
  icon,
  title,
  actionLabel,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  actionLabel: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.actionBlock}>
      <View style={styles.actionCopy}>
        <View style={styles.actionIcon}>
          <Ionicons color={colors.primary} name={icon} size={18} />
        </View>
        <View style={styles.actionTextWrap}>
          <Text style={styles.actionTitle}>{title}</Text>
        </View>
      </View>
      <PrimaryButton title={actionLabel} onPress={onPress} />
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
    gap: spacing.lg,
    paddingBottom: 120,
  },
  launcherCard: {
    gap: spacing.lg,
    borderRadius: 32,
    backgroundColor: "rgba(255, 252, 250, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(228, 216, 203, 0.82)",
  },
  launcherBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  launcherBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  actionBlock: {
    gap: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionCopy: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
  },
  actionTextWrap: {
    flex: 1,
    justifyContent: "center",
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  helperCard: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: 20,
    backgroundColor: colors.surfaceMuted,
  },
  helperTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  helperBody: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
  },
});

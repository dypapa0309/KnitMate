import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { AppHeader } from "@/components/ui/AppHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Screen } from "@/components/ui/Screen";
import { StatusPill } from "@/components/StatusPill";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/layout";
import { useProjectStore } from "@/stores/useProjectStore";
import { formatDateTime, formatRelative } from "@/utils/format";

export default function ResumeTabScreen() {
  const projects = useProjectStore((state) => state.projects);
  const saveStatus = useProjectStore((state) => state.saveStatus);

  const recentProject = useMemo(
    () =>
      [...projects].sort(
        (a, b) => new Date(b.lastWorkedAt).getTime() - new Date(a.lastWorkedAt).getTime(),
      )[0],
    [projects],
  );

  const statusLabel =
    saveStatus === "saving"
      ? "저장 중"
      : saveStatus === "error"
        ? "저장 오류"
        : "자동 저장 완료";
  const statusTone: "neutral" | "success" | "error" =
    saveStatus === "error" ? "error" : saveStatus === "saved" ? "success" : "neutral";

  if (!recentProject) {
    return (
      <Screen scrollable>
        <AppHeader
          title="이어뜨기"
          subtitle="가장 최근 작업을 빠르게 다시 잡을 수 있는 자리예요."
          onPressAction={() => router.push("/settings")}
        />
        <EmptyState
          title="아직 이어서 뜰 작업이 없어요"
          description="첫 프로젝트를 만들면 가장 최근 작업을 여기에서 바로 다시 열 수 있어요."
        />
        <PrimaryButton title="새 뜨개 시작하기" iconName="add" onPress={() => router.push("/projects/new")} />
      </Screen>
    );
  }

  return (
    <Screen scrollable>
      <AppHeader
        title="이어뜨기"
        subtitle="마지막으로 만졌던 작업을 다시 손에 얹을 수 있도록 가장 가까운 정보만 모아 두었어요."
        onPressAction={() => router.push("/settings")}
      />

      <Card style={styles.focusCard}>
        <View style={styles.cardHeader}>
          <View style={styles.titleRow}>
            <Ionicons color={recentProject.accentColor || colors.primary} name="sparkles" size={18} />
            <Text style={styles.title}>{recentProject.title}</Text>
          </View>
          <StatusPill label={statusLabel} tone={statusTone} />
        </View>

        <View style={styles.metricRow}>
          <View style={styles.metricItem}>
            <Ionicons color={colors.textMuted} name="layers-outline" size={18} />
            <View>
              <Text style={styles.metricLabel}>지금 단수</Text>
              <Text style={styles.metricValue}>{recentProject.currentRow}단</Text>
            </View>
          </View>
          <View style={styles.metricItem}>
            <Ionicons color={colors.textMuted} name="time-outline" size={18} />
            <View>
              <Text style={styles.metricLabel}>마지막 손길</Text>
              <Text style={styles.metricValueSmall}>{formatRelative(recentProject.lastWorkedAt)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.noteBox}>
          <Ionicons color={colors.textMuted} name="create-outline" size={18} />
          <Text style={styles.note}>
            {recentProject.notes || "아직 남겨 둔 메모는 없어요. 오늘 느낌이나 다음 시작 지점을 짧게 남겨 두면 좋아요."}
          </Text>
        </View>

        <Text style={styles.timestamp}>최근 기록: {formatDateTime(recentProject.lastWorkedAt)}</Text>
      </Card>

      <View style={styles.buttonGroup}>
        <PrimaryButton
          title="단수 기록하러 가기"
          iconName="chevron-forward"
          onPress={() => router.push(`/projects/${recentProject.id}/work`)}
        />
        <PrimaryButton
          title="이 작업 자세히 보기"
          iconName="albums-outline"
          onPress={() => router.push(`/projects/${recentProject.id}`)}
          variant="secondary"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  focusCard: {
    borderRadius: 26,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
  },
  metricRow: {
    gap: spacing.sm,
  },
  metricItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  metricLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  metricValue: {
    marginTop: 2,
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
  },
  metricValueSmall: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  noteBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 18,
    backgroundColor: colors.surfaceMuted,
  },
  note: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
  },
  timestamp: {
    fontSize: 13,
    color: colors.textMuted,
  },
  buttonGroup: {
    gap: spacing.sm,
  },
});

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
          onPressAction={() => router.push("/settings")}
        />
        <EmptyState
          title="작업 없음"
          description="새 뜨개 시작"
        />
        <PrimaryButton title="새 뜨개" iconName="add" onPress={() => router.push("/projects/new")} />
      </Screen>
    );
  }

  return (
    <Screen scrollable>
      <AppHeader
        title="이어뜨기"
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
            {recentProject.notes || "메모 없음"}
          </Text>
        </View>

        <Text style={styles.timestamp}>{formatDateTime(recentProject.lastWorkedAt)}</Text>
      </Card>

      <View style={styles.buttonGroup}>
        <PrimaryButton
          title="기록"
          iconName="chevron-forward"
          onPress={() => router.push(`/projects/${recentProject.id}/work`)}
        />
        <PrimaryButton
          title="상세"
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

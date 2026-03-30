import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { AppHeader } from "@/components/ui/AppHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Screen } from "@/components/ui/Screen";
import { colors } from "@/constants/colors";
import { radius, spacing } from "@/constants/layout";
import { useProjectStore } from "@/stores/useProjectStore";
import { ProjectLog } from "@/types/project";
import { formatDateTime } from "@/utils/format";

const actionIcons: Record<ProjectLog["actionType"], keyof typeof Ionicons.glyphMap> = {
  create: "sparkles-outline",
  update: "construct-outline",
  row_increment: "add-outline",
  row_decrement: "remove-outline",
  note_update: "create-outline",
  restore: "refresh-outline",
};

const actionLabels: Record<ProjectLog["actionType"], string> = {
  create: "새 작업을 올렸어요",
  update: "작업 정보를 다듬었어요",
  row_increment: "한 단 앞으로 갔어요",
  row_decrement: "한 단 뒤로 물렀어요",
  note_update: "메모를 남겼어요",
  restore: "이전 흐름으로 돌아갔어요",
};

export default function TimelineTabScreen() {
  const logs = useProjectStore((state) => state.logs);
  const getProjectById = useProjectStore((state) => state.getProjectById);

  const recentLogs = useMemo(
    () =>
      [...logs]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 24),
    [logs],
  );

  return (
    <Screen contentStyle={styles.screen}>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={recentLogs}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <AppHeader
              title="기록"
              subtitle="최근 손길이 남긴 흐름을 한눈에 모아 볼 수 있어요."
              onPressAction={() => router.push("/settings")}
            />
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="아직 쌓인 기록이 없어요"
            description="단수를 한 번 올리거나 메모를 남기면 여기에서 흐름이 하나씩 보이기 시작해요."
          />
        }
        renderItem={({ item }) => {
          const project = getProjectById(item.projectId);
          return (
            <Pressable onPress={() => router.push(`/projects/${item.projectId}/history`)}>
              <Card style={styles.logCard}>
                <View style={styles.logHeader}>
                  <View style={styles.logTitleRow}>
                    <View style={styles.iconWrap}>
                      <Ionicons color={colors.primary} name={actionIcons[item.actionType]} size={16} />
                    </View>
                    <View style={styles.logTitleCopy}>
                      <Text style={styles.logTitle}>{actionLabels[item.actionType]}</Text>
                      <Text style={styles.logProject}>{project?.title || "알 수 없는 작업"}</Text>
                    </View>
                  </View>
                  <Ionicons color={colors.textMuted} name="chevron-forward" size={18} />
                </View>
                <Text numberOfLines={2} style={styles.logNote}>
                  {item.note || "짧은 메모 없이 저장된 기록이에요."}
                </Text>
                <Text style={styles.logTime}>{formatDateTime(item.createdAt)}</Text>
              </Card>
            </Pressable>
          );
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
  listContent: {
    padding: spacing.xl,
    paddingBottom: 120,
    gap: spacing.md,
  },
  headerBlock: {
    marginBottom: spacing.md,
  },
  logCard: {
    borderRadius: 22,
    gap: spacing.md,
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  logTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
  },
  logTitleCopy: {
    flex: 1,
    gap: 2,
  },
  logTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  logProject: {
    fontSize: 13,
    color: colors.textMuted,
  },
  logNote: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
  },
  logTime: {
    fontSize: 12,
    color: colors.textMuted,
  },
});

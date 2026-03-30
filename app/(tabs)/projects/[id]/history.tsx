import { Alert, FlatList, StyleSheet, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";

import { EmptyState } from "@/components/ui/EmptyState";
import { Screen } from "@/components/ui/Screen";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { HistoryLogItem } from "@/components/HistoryLogItem";
import { spacing } from "@/constants/layout";
import { useProjectStore } from "@/stores/useProjectStore";

export default function HistoryScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const projectId = String(params.id ?? "");
  const project = useProjectStore((state) => state.getProjectById(projectId));
  const logs = useProjectStore((state) => state.getLogsByProjectId(projectId));
  const restoreFromLog = useProjectStore((state) => state.restoreFromLog);

  if (!project) {
    return (
      <Screen scrollable>
        <Stack.Screen options={{ title: "히스토리" }} />
        <EmptyState title="프로젝트를 찾지 못했어요" description="목록에서 다시 선택해 주세요." />
      </Screen>
    );
  }

  return (
    <Screen contentStyle={styles.screen}>
      <Stack.Screen options={{ title: "히스토리" }} />
      <FlatList
        contentContainerStyle={styles.content}
        data={logs}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <SectionHeader
            title={`${project.title} 히스토리`}
            subtitle="복구를 실행하면 현재 상태를 덮기 전에 복구 기록도 새 히스토리로 남깁니다."
          />
        }
        ListEmptyComponent={
          <EmptyState title="아직 히스토리가 없어요" description="첫 저장이 발생하면 여기에 순서대로 쌓입니다." />
        }
        renderItem={({ item }) => (
          <HistoryLogItem
            log={item}
            onRestore={() =>
              Alert.alert(
                "이 시점으로 복구할까요?",
                "현재 상태를 덮어쓰지만, 덮어쓰기 전에 현재 상태도 새 히스토리로 남겨둘게요.",
                [
                  { text: "취소", style: "cancel" },
                  { text: "복구", style: "destructive", onPress: () => restoreFromLog(project.id, item.id) },
                ],
              )
            }
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  separator: {
    height: spacing.sm,
  },
});

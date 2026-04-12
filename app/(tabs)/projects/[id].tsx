import { Stack, router, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Screen } from "@/components/ui/Screen";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/layout";
import { useProjectStore } from "@/stores/useProjectStore";
import { formatDateTime } from "@/utils/format";

export default function ProjectDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const projectId = String(params.id ?? "");
  const project = useProjectStore((state) => state.getProjectById(projectId));

  if (!project) {
    return (
      <Screen scrollable>
        <Stack.Screen options={{ title: "프로젝트" }} />
        <EmptyState title="프로젝트를 찾지 못했어요" description="목록에서 다시 선택해 주세요." />
      </Screen>
    );
  }

  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: project.title }} />
      <SectionHeader
        showBack
        title={project.title}
        subtitle={project.tag}
      />

      <Card>
        <Text style={styles.sectionTitle}>상태</Text>
        <Text style={styles.info}>단수 · {project.currentRow}단</Text>
        <Text style={styles.info}>실 · {project.yarnInfo || "-"}</Text>
        <Text style={styles.info}>바늘 · {project.needleInfo || "-"}</Text>
        <Text style={styles.info}>수정 · {formatDateTime(project.updatedAt)}</Text>
        <Text style={styles.info}>작업 · {formatDateTime(project.lastWorkedAt)}</Text>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>메모</Text>
        <Text style={styles.note}>
          {project.notes || "-"}
        </Text>
      </Card>

      <View style={styles.buttonGroup}>
        <PrimaryButton title="기록" onPress={() => router.push(`/projects/${project.id}/work`)} />
        <PrimaryButton
          title="타임라인"
          onPress={() => router.push(`/projects/${project.id}/timeline`)}
          variant="secondary"
        />
        <PrimaryButton
          title="히스토리"
          onPress={() => router.push(`/projects/${project.id}/history`)}
          variant="secondary"
        />
        <PrimaryButton
          title="수정"
          onPress={() => router.push(`/projects/${project.id}/edit`)}
          variant="secondary"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  info: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },
  note: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },
  buttonGroup: {
    gap: spacing.sm,
  },
});

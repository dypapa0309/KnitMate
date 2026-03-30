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
        title={project.title}
        subtitle={project.tag || "천천히 이어 가는 작업"}
      />

      <Card>
        <Text style={styles.sectionTitle}>지금 이 작업의 상태</Text>
        <Text style={styles.info}>현재 단수: {project.currentRow}단</Text>
        <Text style={styles.info}>실 정보: {project.yarnInfo || "아직 적어 둔 실 정보가 없어요."}</Text>
        <Text style={styles.info}>바늘 정보: {project.needleInfo || "아직 적어 둔 바늘 정보가 없어요."}</Text>
        <Text style={styles.info}>마지막으로 정리한 시간: {formatDateTime(project.updatedAt)}</Text>
        <Text style={styles.info}>마지막으로 손을 댄 시간: {formatDateTime(project.lastWorkedAt)}</Text>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>남겨 둔 메모</Text>
        <Text style={styles.note}>
          {project.notes || "아직 메모는 비어 있어요. 반복 패턴이나 헷갈리는 지점을 짧게 적어 두면 다음에 다시 잡기 편해져요."}
        </Text>
      </Card>

      <View style={styles.buttonGroup}>
        <PrimaryButton title="바로 단수 기록하러 가기" onPress={() => router.push(`/projects/${project.id}/work`)} />
        <PrimaryButton
          title="기록 흐름 보기"
          onPress={() => router.push(`/projects/${project.id}/history`)}
          variant="secondary"
        />
        <PrimaryButton
          title="작업 정보 다듬기"
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

import { useEffect, useState } from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Screen } from "@/components/ui/Screen";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { TextField } from "@/components/ui/TextField";
import { WorkCounter } from "@/components/WorkCounter";
import { StatusPill } from "@/components/StatusPill";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/layout";
import { useProjectStore } from "@/stores/useProjectStore";
import { formatDateTime } from "@/utils/format";

export default function WorkScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const projectId = String(params.id ?? "");
  const project = useProjectStore((state) => state.getProjectById(projectId));
  const incrementRow = useProjectStore((state) => state.incrementRow);
  const decrementRow = useProjectStore((state) => state.decrementRow);
  const saveQuickNote = useProjectStore((state) => state.saveQuickNote);
  const saveStatus = useProjectStore((state) => state.saveStatus);
  const saveError = useProjectStore((state) => state.saveError);
  const lastSavedAt = useProjectStore((state) => state.lastSavedAt);

  const [noteDraft, setNoteDraft] = useState(project?.notes ?? "");

  useEffect(() => {
    setNoteDraft(project?.notes ?? "");
  }, [project?.notes]);

  useEffect(() => {
    if (!project) {
      return;
    }

    const timeout = setTimeout(() => {
      saveQuickNote(project.id, noteDraft);
    }, 450);

    return () => clearTimeout(timeout);
  }, [noteDraft, project, saveQuickNote]);

  if (!project) {
    return (
      <Screen scrollable>
        <Stack.Screen options={{ title: "작업 화면" }} />
        <EmptyState title="프로젝트를 찾지 못했어요" description="목록에서 다시 선택해 주세요." />
      </Screen>
    );
  }

  const statusLabel =
    saveStatus === "saving"
      ? "조용히 저장하고 있어요"
      : saveStatus === "error"
        ? "저장이 잠시 멈췄어요"
        : "안심하고 계속 떠도 돼요";

  const statusTone: "neutral" | "success" | "error" =
    saveStatus === "error" ? "error" : saveStatus === "saved" ? "success" : "neutral";

  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: "작업 화면" }} />
      <SectionHeader
        title={project.title}
        subtitle="한 단이 끝날 때마다 가볍게 눌러 두세요. 흐름은 그대로 두고 기록만 곁에 붙여 둘게요."
      />

      {saveError ? <ErrorBanner message={saveError} /> : null}

      <View style={styles.statusRow}>
        <StatusPill label={statusLabel} tone={statusTone} />
        <Text style={styles.savedAt}>마지막으로 붙잡아 둔 시간: {formatDateTime(lastSavedAt ?? undefined)}</Text>
      </View>

      <WorkCounter
        row={project.currentRow}
        onIncrement={() => incrementRow(project.id)}
        onDecrement={() => decrementRow(project.id)}
      />

      <Card>
        <Text style={styles.sectionTitle}>작업 흐름 메모</Text>
        <Text style={styles.helperText}>
          지금 화면에서는 단수만 놓치지 않으면 충분해요. 패턴 전환, 헷갈린 지점, 오늘 여기까지 한 느낌만 짧게 남겨도 다음 시작이 훨씬 편해집니다.
        </Text>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>오늘의 메모</Text>
        <TextField
          label="짧게 남겨 두기"
          multiline
          placeholder="예: 32단에서 꽈배기 시작, 다음엔 소매로 넘어가기"
          value={noteDraft}
          onChangeText={setNoteDraft}
          hint="손을 멈추는 순간 자동으로 저장됩니다."
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statusRow: {
    gap: spacing.xs,
  },
  savedAt: {
    fontSize: 13,
    color: colors.textMuted,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  helperText: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.textMuted,
  },
});

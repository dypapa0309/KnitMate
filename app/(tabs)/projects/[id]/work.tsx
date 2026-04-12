import { useEffect, useMemo, useState } from "react";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";

import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Screen } from "@/components/ui/Screen";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { TextField } from "@/components/ui/TextField";
import { WorkCounter } from "@/components/WorkCounter";
import { StatusPill } from "@/components/StatusPill";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/layout";
import { getHapticsEnabled } from "@/services/storage/preferences";
import { useProjectStore } from "@/stores/useProjectStore";
import { ProjectDraft } from "@/types/project";
import { formatDateTime } from "@/utils/format";

const repeatLengthOptions = ["4", "6", "8", "10", "12"];

export default function WorkScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const projectId = String(params.id ?? "");
  const project = useProjectStore((state) => state.getProjectById(projectId));
  const incrementRow = useProjectStore((state) => state.incrementRow);
  const decrementRow = useProjectStore((state) => state.decrementRow);
  const saveQuickNote = useProjectStore((state) => state.saveQuickNote);
  const createSnapshot = useProjectStore((state) => state.createSnapshot);
  const updateProject = useProjectStore((state) => state.updateProject);
  const snapshots = useProjectStore((state) => state.getSnapshotsByProjectId(projectId));
  const saveStatus = useProjectStore((state) => state.saveStatus);
  const saveError = useProjectStore((state) => state.saveError);
  const lastSavedAt = useProjectStore((state) => state.lastSavedAt);

  const [noteDraft, setNoteDraft] = useState(project?.notes ?? "");
  const [repeatDraft, setRepeatDraft] = useState(project?.repeatLength ? String(project.repeatLength) : "");
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  useEffect(() => {
    setNoteDraft(project?.notes ?? "");
    setRepeatDraft(project?.repeatLength ? String(project.repeatLength) : "");
  }, [project?.notes, project?.repeatLength]);

  useEffect(() => {
    void getHapticsEnabled().then(setHapticsEnabled);
  }, []);

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

  const currentProject = project;
  const recentSnapshots = useMemo(() => snapshots.slice(0, 2), [snapshots]);

  const statusLabel =
    saveStatus === "saving"
      ? "조용히 저장하고 있어요"
      : saveStatus === "error"
        ? "저장이 잠시 멈췄어요"
        : "안심하고 계속 떠도 돼요";

  const statusTone: "neutral" | "success" | "error" =
    saveStatus === "error" ? "error" : saveStatus === "saved" ? "success" : "neutral";

  function createDraft(nextRepeatLength: string): ProjectDraft {
    return {
      title: currentProject.title,
      notes: currentProject.notes,
      yarnInfo: currentProject.yarnInfo,
      needleInfo: currentProject.needleInfo,
      repeatLength: nextRepeatLength,
      initialRow: String(currentProject.currentRow),
      accentColor: currentProject.accentColor || "",
      tag: currentProject.tag || "",
    };
  }

  async function runHaptic() {
    if (!hapticsEnabled) {
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  async function handleIncrement() {
    await incrementRow(currentProject.id);
    void runHaptic();
  }

  async function handleDecrement() {
    await decrementRow(currentProject.id);
    void runHaptic();
  }

  async function handleRepeatLengthChange(nextRepeatLength: string) {
    setRepeatDraft(nextRepeatLength);
    await updateProject(currentProject.id, createDraft(nextRepeatLength));
  }

  async function handleSaveSnapshot() {
    const snapshot = await createSnapshot(currentProject.id, { note: noteDraft });
    if (!snapshot) {
      return;
    }

    Alert.alert("중간 기록 저장", `${snapshot.row}단 상태를 프로젝트 타임라인에 남겨 뒀어요.`);
  }

  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: "작업 화면" }} />
      <SectionHeader
        showBack
        title={project.title}
        subtitle={`${currentProject.currentRow}단`}
      />

      {saveError ? <ErrorBanner message={saveError} /> : null}

      <View style={styles.statusRow}>
        <StatusPill label={statusLabel} tone={statusTone} />
        <Text style={styles.savedAt}>마지막으로 붙잡아 둔 시간: {formatDateTime(lastSavedAt ?? undefined)}</Text>
      </View>

      <WorkCounter
        row={currentProject.currentRow}
        repeatLength={currentProject.repeatLength}
        onIncrement={() => void handleIncrement()}
        onDecrement={() => void handleDecrement()}
      />

      <Card>
        <View style={styles.timelineHeader}>
          <Text style={styles.sectionTitle}>타임라인</Text>
          <Pressable onPress={() => router.push(`/projects/${currentProject.id}/timeline`)}>
            <Text style={styles.moreLink}>더보기</Text>
          </Pressable>
        </View>
        <View style={styles.snapshotActions}>
          <Text style={styles.snapshotMeta}>{currentProject.currentRow}단 저장</Text>
          <View style={styles.snapshotButtons}>
            <PrimaryButton title="저장" onPress={handleSaveSnapshot} variant="secondary" />
          </View>
        </View>
        {recentSnapshots.length ? (
          <View style={styles.timelinePreviewList}>
            {recentSnapshots.map((snapshot) => (
              <View key={snapshot.id} style={styles.timelinePreviewItem}>
                <View style={styles.timelineDot} />
                <View style={styles.timelinePreviewCopy}>
                  <Text style={styles.timelinePreviewTitle}>{snapshot.row}단</Text>
                  <Text numberOfLines={2} style={styles.timelinePreviewMeta}>
                    {snapshot.note || "메모 없음"}
                  </Text>
                  <Text style={styles.savedAt}>{formatDateTime(snapshot.createdAt)}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.timelineEmpty}>저장한 기록이 여기에 쌓여요.</Text>
        )}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>반복</Text>
        <View style={styles.repeatChipRow}>
          {repeatLengthOptions.map((option) => {
            const selected = repeatDraft === option;
            return (
              <Pressable
                accessibilityRole="button"
                key={option}
                onPress={() => void handleRepeatLengthChange(selected ? "" : option)}
                style={[styles.repeatChip, selected && styles.repeatChipActive]}
              >
                <Text style={[styles.repeatChipText, selected && styles.repeatChipTextActive]}>{option}단</Text>
              </Pressable>
            );
          })}
        </View>
        <TextField
          label=""
          keyboardType="number-pad"
          placeholder="직접 입력"
          value={repeatDraft}
          onBlur={() => void handleRepeatLengthChange(repeatDraft)}
          onChangeText={setRepeatDraft}
          hint="언제든 바꿀 수 있어요."
        />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>메모</Text>
        <TextField
          label=""
          multiline
          placeholder="메모"
          value={noteDraft}
          onChangeText={setNoteDraft}
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
  repeatChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  repeatChip: {
    minHeight: 38,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  repeatChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  repeatChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
  },
  repeatChipTextActive: {
    color: colors.primary,
  },
  snapshotActions: {
    gap: spacing.sm,
  },
  snapshotMeta: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
  },
  snapshotButtons: {
    alignSelf: "flex-start",
  },
  timelineHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  moreLink: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
  },
  timelinePreviewList: {
    gap: spacing.md,
  },
  timelinePreviewItem: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
    backgroundColor: colors.primary,
  },
  timelinePreviewCopy: {
    flex: 1,
    gap: 4,
  },
  timelinePreviewTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  timelinePreviewMeta: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  timelineEmpty: {
    fontSize: 14,
    color: colors.textMuted,
  },
});

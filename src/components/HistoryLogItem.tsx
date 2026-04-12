import { StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { colors } from "@/constants/colors";
import { ProjectLog } from "@/types/project";
import { formatDateTime } from "@/utils/format";

type HistoryLogItemProps = {
  log: ProjectLog;
  onRestore: () => void;
};

const actionLabels: Record<ProjectLog["actionType"], string> = {
  create: "작업을 시작했어요",
  update: "작업 정보를 다듬었어요",
  row_increment: "한 단 앞으로 갔어요",
  row_decrement: "한 단 되돌렸어요",
  note_update: "메모를 남겼어요",
  snapshot: "중간 기록을 남겼어요",
  restore: "이전 흐름으로 돌아갔어요",
};

export function HistoryLogItem({ log, onRestore }: HistoryLogItemProps) {
  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.title}>{actionLabels[log.actionType]}</Text>
        <Text style={styles.time}>{formatDateTime(log.createdAt)}</Text>
      </View>
      <Text style={styles.note}>{log.note || "짧은 메모는 남기지 않았어요."}</Text>
      <Text style={styles.detail}>이전 상태: {log.beforeValue || "-"}</Text>
      <Text style={styles.detail}>기록된 상태: {log.afterValue || "-"}</Text>
      <PrimaryButton title="이 시점으로 돌아가기" onPress={onRestore} variant="secondary" />
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  time: {
    fontSize: 13,
    color: colors.textMuted,
  },
  note: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  detail: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
});

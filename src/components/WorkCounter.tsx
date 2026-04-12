import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/layout";

type WorkCounterProps = {
  row: number;
  repeatLength?: number;
  onIncrement: () => void;
  onDecrement: () => void;
};

export function WorkCounter({ row, repeatLength, onIncrement, onDecrement }: WorkCounterProps) {
  const repeatStep = repeatLength && repeatLength > 0 ? row % repeatLength : null;
  const repeatCycleCount = repeatLength && repeatLength > 0 ? Math.floor(row / repeatLength) : 0;

  return (
    <Card style={styles.card}>
      <Text style={styles.label}>지금 손끝에 걸린 단수</Text>
      <Pressable
        accessibilityRole="button"
        onPress={onIncrement}
        style={({ pressed }) => [styles.rowButton, pressed && styles.rowButtonPressed]}
      >
        <Text style={styles.row}>{row}</Text>
      </Pressable>
      {repeatLength ? (
        <View style={styles.repeatCard}>
          <Text style={styles.repeatTitle}>{repeatLength}단 반복</Text>
          <Text style={styles.repeatMeta}>
            현재 반복 {repeatStep ?? 0} · 완료 {repeatCycleCount}회
          </Text>
        </View>
      ) : null}
      <Text style={styles.helper}>숫자를 누르면 한 단 올라가요.</Text>
      <Pressable accessibilityRole="button" onPress={onDecrement} style={styles.undoCard}>
        <View style={styles.undoIconWrap}>
          <Ionicons color={colors.textMuted} name="arrow-undo-outline" size={18} />
        </View>
        <Text style={styles.undoTitle}>한 단 되돌리기</Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textMuted,
  },
  row: {
    fontSize: 96,
    fontWeight: "800",
    color: colors.text,
  },
  rowButton: {
    minWidth: 180,
    minHeight: 128,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 32,
  },
  rowButtonPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  helper: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  repeatCard: {
    width: "100%",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 18,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    gap: 4,
  },
  repeatTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  repeatMeta: {
    fontSize: 12,
    color: colors.textMuted,
  },
  undoCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  undoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
  },
  undoTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
});

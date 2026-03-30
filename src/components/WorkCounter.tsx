import { StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Card } from "@/components/ui/Card";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/layout";

type WorkCounterProps = {
  row: number;
  onIncrement: () => void;
  onDecrement: () => void;
};

export function WorkCounter({ row, onIncrement, onDecrement }: WorkCounterProps) {
  return (
    <Card style={styles.card}>
      <Text style={styles.label}>지금 손끝에 걸린 단수</Text>
      <Text style={styles.row}>{row}</Text>
      <Text style={styles.helper}>한 단이 끝날 때마다 가볍게 눌러 주세요.</Text>
      <View style={styles.buttonRow}>
        <View style={styles.button}>
          <PrimaryButton title="한 단 뒤로" onPress={onDecrement} variant="secondary" />
        </View>
        <View style={styles.button}>
          <PrimaryButton title="한 단 앞으로" onPress={onIncrement} />
        </View>
      </View>
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
  helper: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  buttonRow: {
    width: "100%",
    flexDirection: "row",
    gap: spacing.sm,
  },
  button: {
    flex: 1,
  },
});

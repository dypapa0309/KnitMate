import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants/colors";
import { radius, spacing } from "@/constants/layout";

type StatusPillProps = {
  label: string;
  tone?: "neutral" | "success" | "error";
};

export function StatusPill({ label, tone = "neutral" }: StatusPillProps) {
  return (
    <View style={[styles.container, tone === "success" && styles.success, tone === "error" && styles.error]}>
      <Text style={[styles.label, tone === "success" && styles.successText, tone === "error" && styles.errorText]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
  },
  success: {
    backgroundColor: "#E0F0E6",
  },
  error: {
    backgroundColor: "#F6E2E2",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
  },
  successText: {
    color: colors.success,
  },
  errorText: {
    color: colors.danger,
  },
});

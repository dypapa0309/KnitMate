import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";

import { colors } from "@/constants/colors";
import { radius, spacing } from "@/constants/layout";

type TextFieldProps = TextInputProps & {
  label: string;
  hint?: string;
};

export function TextField({ label, hint, multiline, style, ...props }: TextFieldProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        multiline={multiline}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, multiline && styles.multiline, style]}
        {...props}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: 16,
  },
  multiline: {
    minHeight: 112,
    paddingVertical: spacing.md,
    textAlignVertical: "top",
  },
  hint: {
    fontSize: 13,
    color: colors.textMuted,
  },
});

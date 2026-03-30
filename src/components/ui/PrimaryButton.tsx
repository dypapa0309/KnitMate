import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text } from "react-native";

import { colors } from "@/constants/colors";
import { radius, spacing } from "@/constants/layout";

type PrimaryButtonProps = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  iconName?: keyof typeof Ionicons.glyphMap;
};

export function PrimaryButton({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  iconName,
}: PrimaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {iconName ? (
        <Ionicons
          color={variant !== "secondary" ? colors.white : colors.text}
          name={iconName}
          size={18}
          style={styles.icon}
        />
      ) : null}
      <Text style={[styles.title, variant !== "secondary" && styles.lightTitle]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  danger: {
    backgroundColor: colors.danger,
  },
  pressed: {
    opacity: 0.88,
  },
  disabled: {
    opacity: 0.45,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  icon: {
    marginRight: 8,
  },
  lightTitle: {
    color: colors.white,
  },
});

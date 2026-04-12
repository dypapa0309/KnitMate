import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants/colors";
import { radius, spacing } from "@/constants/layout";

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onPressBack?: () => void;
};

export function SectionHeader({ title, subtitle, showBack = false, onPressBack }: SectionHeaderProps) {
  return (
    <View style={styles.wrapper}>
      {showBack ? (
        <Pressable
          accessibilityRole="button"
          onPress={onPressBack ?? (() => router.back())}
          style={styles.backButton}
        >
          <Ionicons color={colors.text} name="chevron-back" size={18} />
        </Pressable>
      ) : null}

      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  container: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
  },
});

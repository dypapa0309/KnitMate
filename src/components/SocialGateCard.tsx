import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { Card } from "@/components/ui/Card";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { colors } from "@/constants/colors";
import { radius, spacing } from "@/constants/layout";

type SocialGateCardProps = {
  badge: string;
  title: string;
  bullets: string[];
  actionLabel?: string;
  href?: string;
};

export function SocialGateCard({
  badge,
  title,
  bullets,
  actionLabel = "로그인",
  href = "/auth",
}: SocialGateCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.badge}>
          <Ionicons color={colors.primary} name="lock-closed-outline" size={16} />
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
        <View style={styles.lockIcon}>
          <Ionicons color={colors.primary} name="shield-checkmark-outline" size={18} />
        </View>
      </View>

      <Text style={styles.title}>{title}</Text>

      <View style={styles.list}>
        {bullets.map((item) => (
          <View key={item} style={styles.chip}>
            <Ionicons color={colors.textMuted} name="ellipse-outline" size={14} />
            <Text style={styles.rowText}>{item}</Text>
          </View>
        ))}
      </View>

      <PrimaryButton title={actionLabel} iconName="log-in-outline" onPress={() => router.push(href)} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    borderRadius: 30,
    backgroundColor: "rgba(255, 252, 250, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(228, 216, 203, 0.82)",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  lockIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
    color: colors.text,
  },
  list: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 32,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
  },
});

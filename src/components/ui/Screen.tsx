import { PropsWithChildren } from "react";
import { SafeAreaView, ScrollView, StyleSheet, ViewStyle } from "react-native";

import { colors } from "@/constants/colors";
import { spacing } from "@/constants/layout";

type ScreenProps = PropsWithChildren<{
  scrollable?: boolean;
  contentStyle?: ViewStyle;
}>;

export function Screen({ children, scrollable = false, contentStyle }: ScreenProps) {
  if (scrollable) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={[styles.scrollContent, contentStyle]}>{children}</ScrollView>
      </SafeAreaView>
    );
  }

  return <SafeAreaView style={[styles.safeArea, contentStyle]}>{children}</SafeAreaView>;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: 120,
    gap: spacing.md,
  },
});

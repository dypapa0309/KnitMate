import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { AppHeader } from "@/components/ui/AppHeader";
import { Card } from "@/components/ui/Card";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Screen } from "@/components/ui/Screen";
import { colors } from "@/constants/colors";
import { radius, spacing } from "@/constants/layout";
import { useProjectStore } from "@/stores/useProjectStore";
import { Project } from "@/types/project";
import { formatRelative } from "@/utils/format";

function getNoteSummary(note: string) {
  const trimmed = note.trim();
  if (!trimmed) {
    return "-";
  }

  return trimmed.length > 14 ? `${trimmed.slice(0, 14)}…` : trimmed;
}

export default function WorkspaceScreen() {
  const projects = useProjectStore((state) => state.projects);
  const saveError = useProjectStore((state) => state.saveError);

  const sortedProjects = useMemo(
    () =>
      [...projects].sort(
        (a, b) => new Date(b.lastWorkedAt).getTime() - new Date(a.lastWorkedAt).getTime(),
      ),
    [projects],
  );

  const recentProject = sortedProjects[0];
  const otherProjects = sortedProjects.filter((project) => project.id !== recentProject?.id).slice(0, 2);

  return (
    <Screen contentStyle={styles.screen}>
      <FlatList
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <AppHeader showBack title="내 뜨개방" onPressAction={() => router.push("/settings")} />
            {saveError ? <ErrorBanner message={saveError} /> : null}

            <Card style={styles.heroCard}>
              <View style={styles.heroTop}>
                <View style={styles.heroBadge}>
                  <Ionicons color={colors.primary} name="sparkles" size={16} />
                  <Text style={styles.heroBadgeText}>최근 손길</Text>
                </View>
              </View>

              {recentProject ? (
                <>
                  <Pressable onPress={() => router.push(`/projects/${recentProject.id}/work`)}>
                    <View style={styles.heroTitleRow}>
                      <View style={styles.heroTitleCopy}>
                        <Text style={styles.heroTitle}>{recentProject.title}</Text>
                        <Text style={styles.heroSubtitle}>
                          {recentProject.tag || formatRelative(recentProject.lastWorkedAt)}
                        </Text>
                      </View>
                      <Ionicons color={colors.textMuted} name="chevron-forward" size={18} />
                    </View>
                  </Pressable>

                  <View style={styles.metricPanel}>
                    <Metric icon="layers-outline" label="지금 단수" value={`${recentProject.currentRow}단`} />
                    <Metric
                      icon="create-outline"
                      label="메모"
                      value={getNoteSummary(recentProject.notes)}
                      compact
                    />
                  </View>
                </>
              ) : (
                <View style={styles.emptyHero}>
                  <Text style={styles.emptyHeroTitle}>첫 작업을 추가해 보세요.</Text>
                  <Text style={styles.emptyHeroText}>이름 · 시작 단수</Text>
                </View>
              )}
            </Card>

            <View style={styles.sectionHeader}>
              <Ionicons color={colors.primary} name="albums-outline" size={18} />
              <Text style={styles.sectionTitle}>계속 뜨는 중</Text>
            </View>
          </View>
        }
        contentContainerStyle={styles.listContent}
        data={otherProjects}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Card style={styles.placeholderCard}>
            <View style={styles.placeholderIcon}>
              <Ionicons color={colors.textMuted} name="albums-outline" size={18} />
            </View>
            <Text style={styles.placeholderTitle}>여기에 이어질 작업</Text>
          </Card>
        }
        renderItem={({ item, index }) => (
          <View style={[styles.cardSpacing, index === 0 && styles.firstCardSpacing]}>
            <MiniProjectCard
              project={item}
              onPress={() => router.push(`/projects/${item.id}`)}
              onResume={() => router.push(`/projects/${item.id}/work`)}
            />
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

function Metric({
  icon,
  label,
  value,
  compact = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <View style={styles.metricCard}>
      <Ionicons color={colors.textMuted} name={icon} size={18} />
      <Text style={styles.metricLabel}>{label}</Text>
      <Text numberOfLines={2} style={[styles.metricValue, compact && styles.metricValueCompact]}>
        {value}
      </Text>
    </View>
  );
}

function MiniProjectCard({
  project,
  onPress,
  onResume,
}: {
  project: Project;
  onPress: () => void;
  onResume: () => void;
}) {
  return (
    <Card style={styles.projectPreviewCard}>
      <View style={styles.projectPreviewTop}>
        <View style={styles.projectPreviewBadge}>
          <Ionicons color={project.accentColor || colors.primary} name="albums-outline" size={16} />
          <Text style={styles.projectPreviewBadgeText}>이어 가는 중</Text>
        </View>
      </View>

      <Pressable onPress={onPress}>
        <View style={styles.heroTitleRow}>
          <View style={styles.heroTitleCopy}>
            <Text style={styles.projectPreviewTitle}>{project.title}</Text>
            <Text style={styles.heroSubtitle}>{project.tag || formatRelative(project.lastWorkedAt)}</Text>
          </View>
          <Ionicons color={colors.textMuted} name="chevron-forward" size={18} />
        </View>
      </Pressable>

      <View style={styles.metricPanel}>
        <Metric icon="layers-outline" label="지금 단수" value={`${project.currentRow}단`} />
        <Metric
          icon="create-outline"
          label="메모"
          value={getNoteSummary(project.notes)}
          compact
        />
      </View>

      <PrimaryButton title="이어뜨기" iconName="chevron-forward" onPress={onResume} />
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    gap: spacing.lg,
  },
  listContent: {
    paddingBottom: 120,
  },
  heroCard: {
    gap: spacing.md,
    borderRadius: 30,
    padding: spacing.xl,
    backgroundColor: "#FFF8F2",
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  heroBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  heroTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  heroTitleCopy: {
    flex: 1,
    gap: 4,
  },
  heroTitle: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "800",
    color: colors.text,
  },
  heroSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
  },
  metricPanel: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  metricCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  metricValueCompact: {
    fontSize: 16,
    lineHeight: 20,
  },
  emptyHero: {
    gap: 6,
  },
  emptyHeroTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
  },
  emptyHeroText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  placeholderCard: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.sm,
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  placeholderIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
  },
  placeholderTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMuted,
  },
  cardSpacing: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
  },
  firstCardSpacing: {
    marginTop: 0,
  },
  projectPreviewCard: {
    gap: spacing.md,
  },
  projectPreviewTop: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  projectPreviewBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  projectPreviewBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
  },
  projectPreviewTitle: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "800",
    color: colors.text,
  },
});

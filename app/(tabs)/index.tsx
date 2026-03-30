import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { AppHeader } from "@/components/ui/AppHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Screen } from "@/components/ui/Screen";
import { colors } from "@/constants/colors";
import { radius, spacing } from "@/constants/layout";
import { useProjectStore } from "@/stores/useProjectStore";
import { Project } from "@/types/project";
import { formatRelative } from "@/utils/format";

export default function ProjectsTabScreen() {
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
            <AppHeader
              title="뜨개방"
              onPressAction={() => router.push("/settings")}
            />
            {saveError ? <ErrorBanner message={saveError} /> : null}

            <View style={styles.topActionRow}>
              <View style={styles.topActionButton}>
                <PrimaryButton title="새 뜨개 하기" iconName="add" onPress={() => router.push("/projects/new")} />
              </View>
            </View>

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
                          {recentProject.tag || `${formatRelative(recentProject.lastWorkedAt)} 손에 잡았어요`}
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
                      value={recentProject.notes ? "메모 남아 있음" : "아직 비어 있음"}
                    />
                  </View>

                  <Text numberOfLines={2} style={styles.heroNote}>
                    {recentProject.notes || "가볍게 이어뜨기로 들어가 단수부터 다시 잡아도 충분해요."}
                  </Text>
                </>
              ) : (
                <View style={styles.emptyHero}>
                  <Text style={styles.emptyHeroTitle}>새 작업 하나만 올려 두면, 가장 먼저 여기서 이어 잡을 수 있어요.</Text>
                  <Text style={styles.emptyHeroText}>
                    이름과 시작 단수만 적어도 충분합니다. 나머지는 뜨는 흐름 안에서 천천히 채워도 괜찮아요.
                  </Text>
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
          <EmptyState
            title="아직 올려 둔 작업이 없어요"
            description="새 작업 하나만 만들어 두면 이 화면이 최근 손길, 이어뜨기, 기록 흐름까지 자연스럽게 연결해 줄 거예요."
          />
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
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.metricCard}>
      <Ionicons color={colors.textMuted} name={icon} size={18} />
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
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
            <Text style={styles.heroSubtitle}>{project.tag || `${formatRelative(project.lastWorkedAt)} 만졌어요`}</Text>
          </View>
          <Ionicons color={colors.textMuted} name="chevron-forward" size={18} />
        </View>
      </Pressable>

      <View style={styles.metricPanel}>
        <Metric icon="layers-outline" label="지금 단수" value={`${project.currentRow}단`} />
        <Metric
          icon="time-outline"
          label="마지막 손길"
          value={formatRelative(project.lastWorkedAt)}
        />
      </View>

      <Text numberOfLines={2} style={styles.heroNote}>
        {project.notes || "짧은 메모는 아직 비어 있어요."}
      </Text>

      <PrimaryButton title="바로 이어뜨기" iconName="chevron-forward" onPress={onResume} />
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
  topActionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  topActionButton: {
    minWidth: 156,
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
    fontSize: 13,
    color: colors.textMuted,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  heroNote: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textMuted,
  },
  emptyHero: {
    gap: spacing.sm,
  },
  emptyHeroTitle: {
    fontSize: 24,
    lineHeight: 31,
    fontWeight: "700",
    color: colors.text,
  },
  emptyHeroText: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.textMuted,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  projectPreviewCard: {
    gap: spacing.md,
    borderRadius: 30,
  },
  projectPreviewTop: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  projectPreviewBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  projectPreviewBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMuted,
  },
  projectPreviewTitle: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "800",
    color: colors.text,
  },
  cardSpacing: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  firstCardSpacing: {
    paddingTop: 0,
  },
});

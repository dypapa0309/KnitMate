import { Stack, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Screen } from "@/components/ui/Screen";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { colors } from "@/constants/colors";
import { radius, spacing } from "@/constants/layout";
import { useProjectStore } from "@/stores/useProjectStore";
import { formatDateTime } from "@/utils/format";
import { formatHashtagLabel } from "@/utils/hashtags";

export default function ProjectTimelineScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const projectId = String(params.id ?? "");
  const project = useProjectStore((state) => state.getProjectById(projectId));
  const snapshots = useProjectStore((state) => state.getSnapshotsByProjectId(projectId));

  if (!project) {
    return (
      <Screen scrollable>
        <Stack.Screen options={{ title: "프로젝트 타임라인" }} />
        <EmptyState title="프로젝트를 찾지 못했어요" description="작업실에서 다시 열어 주세요." />
      </Screen>
    );
  }

  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: "프로젝트 타임라인" }} />
      <SectionHeader
        showBack
        title={`${project.title}`}
        subtitle="타임라인"
      />

      {snapshots.length === 0 ? (
        <EmptyState
          title="기록 없음"
          description="작업 화면에서 저장"
        />
      ) : (
        <View style={styles.list}>
          {snapshots.map((snapshot, index) => (
            <Card key={snapshot.id} style={styles.card}>
              <View style={styles.headerRow}>
                <View style={styles.markerColumn}>
                  <View style={styles.marker} />
                  {index !== snapshots.length - 1 ? <View style={styles.line} /> : null}
                </View>
                <View style={styles.headerCopy}>
                  <Text style={styles.title}>{snapshot.title}</Text>
                  <Text style={styles.meta}>
                    {formatDateTime(snapshot.createdAt)} · {snapshot.row}단
                  </Text>
                </View>
              </View>

              {snapshot.note ? <Text style={styles.note}>{snapshot.note}</Text> : null}

              <View style={styles.detailRow}>
                {snapshot.methodSummary ? <Text style={styles.detailText}>흐름 · {snapshot.methodSummary}</Text> : null}
                {snapshot.needleInfo ? <Text style={styles.detailText}>바늘 · {snapshot.needleInfo}</Text> : null}
                {snapshot.yarnInfo ? <Text style={styles.detailText}>실 · {snapshot.yarnInfo}</Text> : null}
              </View>

              {snapshot.hashtags.length ? (
                <View style={styles.tagRow}>
                  {snapshot.hashtags.map((tag) => (
                    <View key={tag} style={styles.tagChip}>
                      <Text style={styles.tagChipText}>{formatHashtagLabel(tag)}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
    paddingBottom: 40,
  },
  card: {
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  markerColumn: {
    alignItems: "center",
    width: 16,
  },
  marker: {
    width: 12,
    height: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    marginTop: 4,
  },
  line: {
    flex: 1,
    width: 2,
    marginTop: 6,
    backgroundColor: colors.border,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.text,
  },
  meta: {
    fontSize: 13,
    color: colors.textMuted,
  },
  note: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.text,
  },
  detailRow: {
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  tagChip: {
    minHeight: 28,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
});

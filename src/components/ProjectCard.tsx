import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { colors } from "@/constants/colors";
import { radius, spacing } from "@/constants/layout";
import { Project } from "@/types/project";
import { formatRelative } from "@/utils/format";

type ProjectCardProps = {
  project: Project;
  onPress: () => void;
  highlighted?: boolean;
};

export function ProjectCard({ project, onPress, highlighted = false }: ProjectCardProps) {
  return (
    <Pressable onPress={onPress}>
      <Card style={[highlighted && styles.highlighted]}>
        <View style={styles.header}>
          <View
            style={[
              styles.colorDot,
              { backgroundColor: project.accentColor || colors.primarySoft },
            ]}
          />
          <View style={styles.headerText}>
            <Text style={styles.title}>{project.title}</Text>
            <Text style={styles.subtitle}>{project.tag || "차분히 이어 가는 중"}</Text>
          </View>
        </View>

        <View style={styles.metrics}>
          <View>
            <Text style={styles.metricLabel}>지금 단수</Text>
            <Text style={styles.metricValue}>{project.currentRow}단</Text>
          </View>
          <View>
            <Text style={styles.metricLabel}>마지막 손길</Text>
            <Text style={styles.metricValueSmall}>{formatRelative(project.lastWorkedAt)}</Text>
          </View>
        </View>

        <Text numberOfLines={2} style={styles.memo}>
          {project.notes || "아직 남겨 둔 메모는 없어요."}
        </Text>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  highlighted: {
    backgroundColor: "#FFF8F4",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: radius.pill,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
  },
  metrics: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  metricLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  metricValue: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  metricValueSmall: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  memo: {
    marginTop: spacing.sm,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
  },
});

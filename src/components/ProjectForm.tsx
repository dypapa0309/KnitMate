import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { projectAccentColors } from "@/constants/colors";
import { radius, spacing } from "@/constants/layout";
import { ProjectDraft } from "@/types/project";
import { Card } from "@/components/ui/Card";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { TextField } from "@/components/ui/TextField";
import { colors } from "@/constants/colors";

type ProjectFormProps = {
  initialValue: ProjectDraft;
  submitLabel: string;
  onSubmit: (value: ProjectDraft) => Promise<void>;
};

export function ProjectForm({ initialValue, submitLabel, onSubmit }: ProjectFormProps) {
  const [draft, setDraft] = useState<ProjectDraft>(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(() => draft.title.trim().length > 0 && !isSubmitting, [draft.title, isSubmitting]);

  async function handleSubmit() {
    if (!draft.title.trim()) {
      setError("이 작업을 다시 찾을 수 있도록 이름을 하나 남겨 주세요.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(draft);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Card>
        <TextField
          label="프로젝트 이름"
          placeholder="예: 봄 가디건, 아기 모자, 엄마 목도리"
          value={draft.title}
          onChangeText={(title) => setDraft((current) => ({ ...current, title }))}
        />
        <TextField
          label="작업 메모"
          placeholder="반복 패턴, 실 장력, 다음에 기억해야 할 지점을 적어 두세요."
          multiline
          value={draft.notes}
          onChangeText={(notes) => setDraft((current) => ({ ...current, notes }))}
        />
        <TextField
          label="시작 단수"
          keyboardType="number-pad"
          placeholder="0"
          value={draft.initialRow}
          onChangeText={(initialRow) => setDraft((current) => ({ ...current, initialRow }))}
          hint="이미 몇 단 진행했다면 그 숫자부터 시작해도 괜찮아요."
        />
        <TextField
          label="실 정보"
          placeholder="예: 메리노 울 4ply, 크림 베이지"
          value={draft.yarnInfo}
          onChangeText={(yarnInfo) => setDraft((current) => ({ ...current, yarnInfo }))}
        />
        <TextField
          label="바늘 정보"
          placeholder="예: 3.5mm 원형 바늘, 80cm"
          value={draft.needleInfo}
          onChangeText={(needleInfo) => setDraft((current) => ({ ...current, needleInfo }))}
        />
        <TextField
          label="태그"
          placeholder="예: 선물용 / 겨울 / 천천히 진행"
          value={draft.tag}
          onChangeText={(tag) => setDraft((current) => ({ ...current, tag }))}
        />

        <View style={styles.colorSection}>
          <Text style={styles.label}>작업 분위기 색</Text>
          <View style={styles.colorRow}>
            {projectAccentColors.map((color) => {
              const selected = draft.accentColor === color;
              return (
                <Pressable
                  accessibilityRole="button"
                  key={color}
                  onPress={() => setDraft((current) => ({ ...current, accentColor: color }))}
                  style={[styles.colorDot, { backgroundColor: color }, selected && styles.colorSelected]}
                />
              );
            })}
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </Card>

      <PrimaryButton disabled={!canSubmit} title={submitLabel} onPress={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  colorSection: {
    gap: spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  colorDot: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorSelected: {
    borderColor: colors.text,
  },
  error: {
    fontSize: 14,
    color: colors.danger,
  },
});

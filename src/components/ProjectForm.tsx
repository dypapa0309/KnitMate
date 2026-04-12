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

const needleSizeOptions = [
  "US 2",
  "US 3",
  "US 4",
  "US 5",
  "US 6",
  "US 7",
  "US 8",
  "US 9",
  "US 10",
];

const yarnWeightOptions = ["Lace", "Sock", "Fingering", "Sport", "DK", "Worsted", "Bulky"];
const repeatLengthOptions = ["4", "6", "8", "10", "12"];

function splitPresetValue(value: string, presets: string[]) {
  const trimmed = value.trim();
  const matchedPreset = presets.find((preset) => trimmed === preset || trimmed.startsWith(`${preset} · `));

  if (!matchedPreset) {
    return {
      preset: "",
      detail: trimmed,
    };
  }

  return {
    preset: matchedPreset,
    detail: trimmed.replace(new RegExp(`^${matchedPreset}(?:\\s·\\s)?`), "").trim(),
  };
}

function combinePresetValue(preset: string, detail: string) {
  const trimmedDetail = detail.trim();
  if (!preset) {
    return trimmedDetail;
  }

  return trimmedDetail ? `${preset} · ${trimmedDetail}` : preset;
}

export function ProjectForm({ initialValue, submitLabel, onSubmit }: ProjectFormProps) {
  const initialNeedle = splitPresetValue(initialValue.needleInfo, needleSizeOptions);
  const initialYarn = splitPresetValue(initialValue.yarnInfo, yarnWeightOptions);

  const [draft, setDraft] = useState<ProjectDraft>(initialValue);
  const [selectedNeedleSize, setSelectedNeedleSize] = useState(initialNeedle.preset);
  const [needleDetail, setNeedleDetail] = useState(initialNeedle.detail);
  const [selectedYarnWeight, setSelectedYarnWeight] = useState(initialYarn.preset);
  const [yarnDetail, setYarnDetail] = useState(initialYarn.detail);
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
      await onSubmit({
        ...draft,
        yarnInfo: combinePresetValue(selectedYarnWeight, yarnDetail),
        needleInfo: combinePresetValue(selectedNeedleSize, needleDetail),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Card>
        <TextField
          label="프로젝트 이름"
          placeholder="이름"
          value={draft.title}
          onChangeText={(title) => setDraft((current) => ({ ...current, title }))}
        />
        <TextField
          label="작업 메모"
          placeholder="메모"
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
        <View style={styles.choiceSection}>
          <Text style={styles.label}>실 굵기</Text>
          <View style={styles.chipRow}>
            {yarnWeightOptions.map((option) => {
              const selected = selectedYarnWeight === option;
              return (
                <Pressable
                  accessibilityRole="button"
                  key={option}
                  onPress={() => setSelectedYarnWeight((current) => (current === option ? "" : option))}
                  style={[styles.choiceChip, selected && styles.choiceChipActive]}
                >
                  <Text style={[styles.choiceChipText, selected && styles.choiceChipTextActive]}>{option}</Text>
                </Pressable>
              );
            })}
          </View>
          <TextField
            label=""
            placeholder="실 메모"
            value={yarnDetail}
            onChangeText={setYarnDetail}
          />
        </View>
        <View style={styles.choiceSection}>
          <Text style={styles.label}>바늘 정보</Text>
          <View style={styles.chipRow}>
            {needleSizeOptions.map((option) => {
              const selected = selectedNeedleSize === option;
              return (
                <Pressable
                  accessibilityRole="button"
                  key={option}
                  onPress={() => setSelectedNeedleSize((current) => (current === option ? "" : option))}
                  style={[styles.choiceChip, selected && styles.choiceChipActive]}
                >
                  <Text style={[styles.choiceChipText, selected && styles.choiceChipTextActive]}>{option}</Text>
                </Pressable>
              );
            })}
          </View>
          <TextField
            label=""
            placeholder="추가 정보"
            value={needleDetail}
            onChangeText={setNeedleDetail}
            hint="기본은 US 사이즈 기준으로 기록해 둘게요."
          />
        </View>
        <View style={styles.choiceSection}>
          <Text style={styles.label}>반복 단수</Text>
          <View style={styles.chipRow}>
            {repeatLengthOptions.map((option) => {
              const selected = draft.repeatLength === option;
              return (
                <Pressable
                  accessibilityRole="button"
                  key={option}
                  onPress={() => setDraft((current) => ({ ...current, repeatLength: current.repeatLength === option ? "" : option }))}
                  style={[styles.choiceChip, selected && styles.choiceChipActive]}
                >
                  <Text style={[styles.choiceChipText, selected && styles.choiceChipTextActive]}>{option}단</Text>
                </Pressable>
              );
            })}
          </View>
          <TextField
            label=""
            keyboardType="number-pad"
            placeholder="직접 입력"
            value={draft.repeatLength}
            onChangeText={(repeatLength) => setDraft((current) => ({ ...current, repeatLength }))}
            hint="생성 후에도 작업 화면에서 바꿀 수 있어요."
          />
        </View>
        <TextField
          label="태그"
          placeholder="태그"
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
  choiceSection: {
    gap: spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  choiceChip: {
    paddingHorizontal: spacing.md,
    minHeight: 38,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  choiceChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  choiceChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
  },
  choiceChipTextActive: {
    color: colors.primary,
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

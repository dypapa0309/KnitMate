import { Ionicons } from "@expo/vector-icons";
import { Linking, StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";

import { Card } from "@/components/ui/Card";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Screen } from "@/components/ui/Screen";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/layout";
import { useProjectStore } from "@/stores/useProjectStore";

const siteUrl = "https://knitemate.netlify.app/";
const supportUrl = "https://knitemate.netlify.app/support/";
const privacyUrl = "https://knitemate.netlify.app/privacy/";

export default function SettingsScreen() {
  const projects = useProjectStore((state) => state.projects);
  const logs = useProjectStore((state) => state.logs);

  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: "설정" }} />
      <SectionHeader
        title="설정"
        subtitle="자주 누를 필요는 없지만, 앱 바깥 안내와 조용한 보조 기능은 여기 숨겨 두었습니다."
      />

      <Card>
        <Text style={styles.sectionTitle}>기록 방식</Text>
        <View style={styles.infoRow}>
          <Ionicons color={colors.primary} name="cloud-offline-outline" size={18} />
          <Text style={styles.body}>모든 프로젝트와 히스토리는 현재 기기 안에만 저장됩니다.</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons color={colors.primary} name="save-outline" size={18} />
          <Text style={styles.body}>단수와 메모는 변경 순간 자동 저장됩니다.</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons color={colors.primary} name="layers-outline" size={18} />
          <Text style={styles.body}>지금까지 저장된 작업 {projects.length}개, 기록 {logs.length}개</Text>
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>숨겨 둔 자리</Text>
        <View style={styles.infoRow}>
          <Ionicons color={colors.primary} name="sparkles-outline" size={18} />
          <Text style={styles.body}>현재 컨셉은 빠른 단수 기록, 짧은 메모, 복구 가능한 흐름에 집중합니다.</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons color={colors.primary} name="camera-outline" size={18} />
          <Text style={styles.body}>사진 기록, 백업, 동기화는 다음 확장 후보로 남겨 두었습니다.</Text>
        </View>
      </Card>

      <View style={styles.buttonGroup}>
        <PrimaryButton title="소개 페이지" iconName="globe-outline" onPress={() => Linking.openURL(siteUrl)} />
        <PrimaryButton
          title="지원 페이지"
          iconName="help-buoy-outline"
          onPress={() => Linking.openURL(supportUrl)}
          variant="secondary"
        />
        <PrimaryButton
          title="개인정보처리방침"
          iconName="document-text-outline"
          onPress={() => Linking.openURL(privacyUrl)}
          variant="secondary"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  body: {
    flex: 1,
    fontSize: 15,
    lineHeight: 23,
    color: colors.text,
  },
  buttonGroup: {
    gap: spacing.sm,
  },
});

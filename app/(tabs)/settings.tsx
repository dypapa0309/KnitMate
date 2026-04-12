import { Ionicons } from "@expo/vector-icons";
import { Linking, StyleSheet, Switch, Text, View } from "react-native";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";

import { Card } from "@/components/ui/Card";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Screen } from "@/components/ui/Screen";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/layout";
import { useAuth } from "@/context/AuthContext";
import { getHapticsEnabled, setHapticsEnabled } from "@/services/storage/preferences";
import { useProjectStore } from "@/stores/useProjectStore";

const siteUrl = "https://knitemate.netlify.app/";
const supportUrl = "https://knitemate.netlify.app/support/";
const privacyUrl = "https://knitemate.netlify.app/privacy/";

export default function SettingsScreen() {
  const projects = useProjectStore((state) => state.projects);
  const logs = useProjectStore((state) => state.logs);
  const { user, signOut, busy } = useAuth();
  const [hapticsEnabled, setHapticsEnabledState] = useState(true);

  useEffect(() => {
    void getHapticsEnabled().then(setHapticsEnabledState);
  }, []);

  async function handleToggleHaptics(value: boolean) {
    setHapticsEnabledState(value);
    await setHapticsEnabled(value);
  }

  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: "설정" }} />
      <SectionHeader
        showBack
        title="설정"
        subtitle="계정과 안내를 가볍게 정리해 두었어요."
      />

      <Card>
        <Text style={styles.sectionTitle}>계정</Text>
        <View style={styles.infoRow}>
          <Ionicons color={colors.primary} name="person-circle-outline" size={18} />
          <Text style={styles.body}>{user?.email || "로그인 필요"}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons color={colors.primary} name="mail-outline" size={18} />
          <Text style={styles.body}>로그인과 인증, 프로필 사진은 여기 기준으로 유지돼요.</Text>
        </View>
        {user ? (
          <PrimaryButton
            title={busy ? "정리 중" : "로그아웃"}
            iconName="log-out-outline"
            onPress={() => void signOut()}
            variant="secondary"
            disabled={busy}
          />
        ) : null}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>알림과 도움</Text>
        <View style={styles.toggleRow}>
          <View style={styles.toggleBody}>
            <Ionicons color={colors.primary} name="phone-portrait-outline" size={18} />
            <View style={styles.toggleCopy}>
              <Text style={styles.body}>햅틱</Text>
              <Text style={styles.toggleHint}>단수 탭과 주요 반응에서 가볍게 울려요.</Text>
            </View>
          </View>
          <Switch
            onValueChange={(value) => void handleToggleHaptics(value)}
            thumbColor={colors.white}
            trackColor={{ false: colors.border, true: colors.primary }}
            value={hapticsEnabled}
          />
        </View>
        <View style={styles.infoRow}>
          <Ionicons color={colors.primary} name="notifications-outline" size={18} />
          <Text style={styles.body}>새 소식과 반응 알림은 곧 더 다듬어질 예정이에요.</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons color={colors.primary} name="help-buoy-outline" size={18} />
          <Text style={styles.body}>문의나 도움이 필요하면 지원 페이지에서 바로 이어갈 수 있어요.</Text>
        </View>
        <PrimaryButton
          title="도움말 / 문의"
          iconName="help-circle-outline"
          onPress={() => Linking.openURL(supportUrl)}
          variant="secondary"
        />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>앱 정보</Text>
        <View style={styles.infoRow}>
          <Ionicons color={colors.primary} name="albums-outline" size={18} />
          <Text style={styles.body}>내 작업 {projects.length}개 · 기록 {logs.length}개</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons color={colors.primary} name="cloud-offline-outline" size={18} />
          <Text style={styles.body}>뜨개방 기록은 현재 이 기기에 저장돼요.</Text>
        </View>
        <View style={styles.footerLinks}>
          <Text onPress={() => Linking.openURL(siteUrl)} style={styles.footerLink}>소개</Text>
          <Text onPress={() => Linking.openURL(privacyUrl)} style={styles.footerLink}>개인정보처리방침</Text>
        </View>
      </Card>
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
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  toggleBody: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  toggleCopy: {
    flex: 1,
    gap: 2,
  },
  toggleHint: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  footerLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  footerLink: {
    fontSize: 12,
    color: colors.textMuted,
    textDecorationLine: "underline",
  },
});

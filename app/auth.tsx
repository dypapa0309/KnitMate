import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Screen } from "@/components/ui/Screen";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { TextField } from "@/components/ui/TextField";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/layout";
import { useAuth } from "@/context/AuthContext";

export default function AuthEntryScreen() {
  const { busy, resendConfirmationEmail, signIn, signInWithApple, signInWithGoogle, signUp } = useAuth();
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  function getErrorMessage(error: unknown) {
    if (!(error instanceof Error)) {
      return "다시 시도해 주세요.";
    }

    const message = error.message.toLowerCase();

    if (message.includes("invalid login credentials")) {
      return "이메일 또는 비밀번호를 다시 확인해 주세요.";
    }

    if (message.includes("network request failed")) {
      return "네트워크 연결이 불안정해요. 잠시 후 다시 시도해 주세요.";
    }

    if (message.includes("email not confirmed")) {
      return "이메일 인증 후 다시 로그인해 주세요.";
    }

    if (message.includes("user already registered")) {
      return "이미 가입된 이메일이에요. 로그인으로 들어가 보세요.";
    }

    return error.message;
  }

  async function handleSubmit() {
    try {
      if (mode === "signIn") {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password, username.trim());
      }
      router.back();
    } catch (error) {
      const message = getErrorMessage(error);
      if (message === "이메일 인증 후 다시 로그인해 주세요.") {
        Alert.alert("이메일 인증 필요", "인증 메일을 다시 보내거나 이메일을 다시 확인해 볼까요?", [
          {
            text: "인증 메일 다시 보내기",
            onPress: () => {
              void resendConfirmationEmail(email).then(
                () => Alert.alert("재전송 완료", "메일함에서 인증 메일을 다시 확인해 주세요."),
                (resendError) => Alert.alert("재전송 실패", getErrorMessage(resendError)),
              );
            },
          },
          { text: "닫기", style: "cancel" },
        ]);
        return;
      }
      Alert.alert(mode === "signIn" ? "로그인 실패" : "가입 실패", message);
    }
  }

  async function handleOauthSignIn(provider: "google" | "apple") {
    try {
      if (provider === "google") {
        await signInWithGoogle();
      } else {
        await signInWithApple();
      }
      router.back();
    } catch (error) {
      Alert.alert("간편로그인 실패", getErrorMessage(error));
    }
  }

  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: "로그인" }} />
      <SectionHeader showBack title="로그인" subtitle="계속하기" />

      <Card style={styles.card}>
        <View style={styles.heroMark}>
          <Ionicons color={colors.primary} name="sparkles-outline" size={18} />
        </View>
        <Text style={styles.title}>KnitMate</Text>
        <Text style={styles.body}>작업과 피드를 이어서 보려면 로그인해 주세요.</Text>

        <View style={styles.oauthStack}>
          <SocialButton
            icon="logo-google"
            label="Google로 계속하기"
            onPress={() => void handleOauthSignIn("google")}
            disabled={busy}
          />
          <SocialButton
            icon="logo-apple"
            label="Apple로 계속하기"
            onPress={() => void handleOauthSignIn("apple")}
            disabled={busy}
          />
        </View>

        <View style={styles.separatorRow}>
          <View style={styles.separatorLine} />
          <Text style={styles.separatorText}>또는 이메일</Text>
          <View style={styles.separatorLine} />
        </View>

        <View style={styles.modeTabs}>
          <Pressable
            onPress={() => setMode("signIn")}
            style={[styles.modeTab, mode === "signIn" && styles.modeTabActive]}
          >
            <Text style={[styles.modeTabText, mode === "signIn" && styles.modeTabTextActive]}>로그인</Text>
          </Pressable>
          <Pressable
            onPress={() => setMode("signUp")}
            style={[styles.modeTab, mode === "signUp" && styles.modeTabActive]}
          >
            <Text style={[styles.modeTabText, mode === "signUp" && styles.modeTabTextActive]}>가입</Text>
          </Pressable>
        </View>

        <View style={styles.actionGroup}>
          {mode === "signUp" ? (
            <TextField
              autoCapitalize="none"
              autoCorrect={false}
              label=""
              placeholder="닉네임"
              value={username}
              onChangeText={setUsername}
            />
          ) : null}
          <TextField
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            keyboardType="email-address"
            label=""
            placeholder="이메일"
            spellCheck={false}
            textContentType="emailAddress"
            value={email}
            onChangeText={setEmail}
          />
          <TextField
            autoCapitalize="none"
            autoComplete="password"
            autoCorrect={false}
            label=""
            placeholder="비밀번호"
            secureTextEntry
            spellCheck={false}
            textContentType="password"
            value={password}
              onChangeText={setPassword}
            />
          <PrimaryButton title={busy ? "처리 중" : mode === "signIn" ? "이메일로 로그인" : "이메일로 가입"} onPress={handleSubmit} disabled={busy} />
        </View>
      </Card>
    </Screen>
  );
}

function SocialButton({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.socialButton, pressed && !disabled && styles.socialPressed, disabled && styles.socialDisabled]}>
      <Ionicons color={colors.text} name={icon} size={18} />
      <Text style={styles.socialText}>{label}</Text>
    </Pressable>
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
  heroMark: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    color: colors.text,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
  },
  oauthStack: {
    gap: spacing.sm,
  },
  socialButton: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  socialPressed: {
    opacity: 0.88,
  },
  socialDisabled: {
    opacity: 0.45,
  },
  socialText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  separatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  separatorText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  modeTabs: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  modeTab: {
    flex: 1,
    minHeight: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
  },
  modeTabActive: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeTabText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textMuted,
  },
  modeTabTextActive: {
    color: colors.text,
  },
  actionGroup: {
    gap: spacing.sm,
  },
});

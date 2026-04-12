import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { TextField } from "@/components/ui/TextField";
import { colors } from "@/constants/colors";
import { radius, spacing } from "@/constants/layout";
import { useAuth } from "@/context/AuthContext";

export default function EditProfileScreen() {
  const { busy, profile, updateProfile } = useAuth();
  const [username, setUsername] = useState(profile?.username ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [avatarUri, setAvatarUri] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    setUsername(profile?.username ?? "");
    setBio(profile?.bio ?? "");
    setAvatarUri(undefined);
  }, [profile?.bio, profile?.username]);

  async function handlePickAvatar() {
    try {
      const ImagePicker = require("expo-image-picker") as typeof import("expo-image-picker");
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("사진 권한 필요", "프로필 사진을 바꾸려면 보관함 접근이 필요해요.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (result.canceled || !result.assets[0]?.uri) {
        return;
      }

      setAvatarUri(result.assets[0].uri);
    } catch (error) {
      Alert.alert("사진 선택 실패", error instanceof Error ? error.message : "다시 시도해 주세요.");
    }
  }

  async function handleSave() {
    try {
      await updateProfile({ username, bio, avatarUri });
      router.back();
    } catch (error) {
      Alert.alert("수정 실패", error instanceof Error ? error.message : "다시 시도해 주세요.");
    }
  }

  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: "프로필 수정" }} />
      <SectionHeader showBack title="프로필 수정" subtitle="닉네임과 소개" />

      <Card>
        <View style={styles.avatarSection}>
          <Pressable onPress={() => void handlePickAvatar()} style={styles.avatarTapArea}>
            <View style={styles.avatarShell}>
              {avatarUri || profile?.avatarUrl ? (
                <Image source={{ uri: avatarUri || profile?.avatarUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Ionicons color={colors.primary} name="person-circle-outline" size={42} />
                </View>
              )}
            </View>
            <View style={styles.avatarEditBadge}>
              <Ionicons color={colors.white} name="pencil" size={13} />
            </View>
          </Pressable>

          <View style={styles.avatarHintRow}>
          </View>
        </View>
        <TextField
          autoCapitalize="none"
          autoCorrect={false}
          label=""
          placeholder="닉네임"
          spellCheck={false}
          value={username}
          onChangeText={setUsername}
        />
        <TextField label="" multiline placeholder="소개" value={bio} onChangeText={setBio} />
        <Pressable disabled={busy} onPress={handleSave} style={[styles.saveButton, busy && styles.saveButtonDisabled]}>
          <Text style={styles.saveButtonText}>{busy ? "저장 중" : "저장"}</Text>
        </Pressable>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatarSection: {
    alignItems: "center",
    gap: spacing.sm,
  },
  avatarTapArea: {
    position: "relative",
    width: 104,
    height: 104,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarShell: {
    width: 92,
    height: 92,
    borderRadius: 46,
    overflow: "hidden",
    backgroundColor: colors.surfaceMuted,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEditBadge: {
    position: "absolute",
    right: 6,
    bottom: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  avatarHintRow: {
    minHeight: 1,
  },
  saveButton: {
    minHeight: 52,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  saveButtonDisabled: {
    opacity: 0.45,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.white,
  },
});

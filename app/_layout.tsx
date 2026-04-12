import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";

import { colors } from "@/constants/colors";
import { AuthProvider } from "@/context/AuthContext";
import { useHydrateStore } from "@/hooks/useHydrateStore";

export default function RootLayout() {
  const isHydrated = useHydrateStore();

  if (!isHydrated) {
    // 첫 렌더에서 저장소를 읽는 동안 단순한 로딩 화면만 보여 줍니다.
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ presentation: "modal" }} />
      </Stack>
    </AuthProvider>
  );
}

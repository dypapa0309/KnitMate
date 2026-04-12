import { Ionicons } from "@expo/vector-icons";
import { Tabs, router, usePathname } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { colors } from "@/constants/colors";
import { radius, spacing } from "@/constants/layout";
import { useAuth } from "@/context/AuthContext";

export default function TabsLayout() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);
  const [showCoach, setShowCoach] = useState(false);

  useEffect(() => {
    setIsLauncherOpen(false);
  }, [pathname]);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem("knitmate/onboarding/v1").then((value) => {
      if (!mounted) {
        return;
      }
      setShowCoach(value !== "done");
    });
    return () => {
      mounted = false;
    };
  }, []);

  const launcherOptions = useMemo(
    () => [
      {
        key: "project",
        icon: "albums-outline" as const,
        title: "작업물",
        onPress: () => router.push("/projects/new"),
      },
      {
        key: "feed",
        icon: "newspaper-outline" as const,
        title: "피드",
        onPress: () => router.push(user ? { pathname: "/compose-editor", params: { channel: "feed" } } : "/auth"),
      },
      {
        key: "community",
        icon: "chatbubbles-outline" as const,
        title: "뜨모저모",
        onPress: () => router.push(user ? { pathname: "/compose-editor", params: { channel: "community" } } : "/auth"),
      },
    ],
    [user],
  );

  return (
    <View style={styles.root}>
      <Tabs
        initialRouteName="feed"
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarShowLabel: false,
          tabBarStyle: {
            position: "absolute",
            left: 18,
            right: 18,
            bottom: 18,
            height: 76,
            paddingTop: 10,
            paddingBottom: 12,
            paddingHorizontal: 8,
            borderTopWidth: 0,
            borderRadius: 30,
            backgroundColor: "rgba(255, 253, 252, 0.92)",
            shadowColor: "#7A675A",
            shadowOpacity: 0.14,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 10 },
            elevation: 12,
          },
          tabBarItemStyle: {
            borderRadius: radius.lg,
          },
        }}
      >
        <Tabs.Screen name="index" options={{ href: null }} />
        <Tabs.Screen
          name="feed"
          options={{
            title: "피드",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons color={color} name={focused ? "newspaper" : "newspaper-outline"} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="community"
          options={{
            title: "뜨모저모",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons color={color} name={focused ? "chatbubbles" : "chatbubbles-outline"} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="compose"
          listeners={{
            tabPress: (event) => {
              event.preventDefault();
              setIsLauncherOpen((current) => !current);
            },
          }}
          options={{
            title: "",
            tabBarIcon: () => (
              <View style={[styles.composeButton, isLauncherOpen && styles.composeButtonFocused]}>
                <Ionicons color={colors.white} name={isLauncherOpen ? "close" : "add"} size={24} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="people-search"
          options={{
            title: "검색",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons color={color} name={focused ? "search" : "search-outline"} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile/index"
          options={{
            title: "프로필",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons color={color} name={focused ? "person-circle" : "person-circle-outline"} size={size} />
            ),
          }}
        />
        <Tabs.Screen name="resume" options={{ href: null }} />
        <Tabs.Screen name="timeline" options={{ href: null }} />
        <Tabs.Screen name="settings" options={{ href: null }} />
        <Tabs.Screen name="projects/new" options={{ href: null }} />
        <Tabs.Screen name="projects/[id]" options={{ href: null }} />
        <Tabs.Screen name="projects/[id]/edit" options={{ href: null }} />
        <Tabs.Screen name="projects/[id]/work" options={{ href: null }} />
        <Tabs.Screen name="projects/[id]/history" options={{ href: null }} />
        <Tabs.Screen name="projects/[id]/timeline" options={{ href: null }} />
        <Tabs.Screen name="workspace" options={{ href: null }} />
        <Tabs.Screen name="posts/[id]" options={{ href: null }} />
        <Tabs.Screen name="profile/edit" options={{ href: null }} />
        <Tabs.Screen name="profile/[id]" options={{ href: null }} />
        <Tabs.Screen name="compose-editor" options={{ href: null }} />
      </Tabs>

      {isLauncherOpen ? (
        <View pointerEvents="box-none" style={styles.overlayRoot}>
          <Pressable style={styles.overlayBackdrop} onPress={() => setIsLauncherOpen(false)} />
          <View style={styles.launcherWrap}>
            {launcherOptions.map((option, index) => (
              <Pressable
                key={option.key}
                onPress={() => {
                  setIsLauncherOpen(false);
                  option.onPress();
                }}
                style={[
                  styles.launcherItem,
                  index === launcherOptions.length - 1 && styles.launcherItemLast,
                ]}
              >
                <View style={styles.launcherIcon}>
                  <Ionicons color={colors.primary} name={option.icon} size={18} />
                </View>
                <Text style={styles.launcherText}>{option.title}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {showCoach ? (
        <View pointerEvents="box-none" style={styles.overlayRoot}>
          <Pressable style={styles.coachBackdrop} onPress={() => {
            setShowCoach(false);
            void AsyncStorage.setItem("knitmate/onboarding/v1", "done");
          }} />
          <View style={styles.coachWrap}>
            <Text style={styles.coachTitle}>처음이라면 여기부터</Text>
            <Text style={styles.coachBody}>아래 +로 새 작업, 피드 글쓰기, 뜨모저모 글쓰기를 시작할 수 있어요.</Text>
            <Text style={styles.coachBody}>피드는 사진 공유, 뜨모저모는 짧은 글, 내 뜨개방은 프로필 안에서 볼 수 있어요.</Text>
            <PrimaryCoachButton
              title="알겠어요"
              onPress={() => {
                setShowCoach(false);
                void AsyncStorage.setItem("knitmate/onboarding/v1", "done");
              }}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

function PrimaryCoachButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.coachButton}>
      <Text style={styles.coachButtonText}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  composeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  composeButtonFocused: {
    transform: [{ translateY: -2 }],
    shadowOpacity: 0.34,
  },
  overlayRoot: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(27, 22, 18, 0.16)",
  },
  coachBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20, 16, 14, 0.32)",
  },
  launcherWrap: {
    position: "absolute",
    right: 26,
    bottom: 110,
    minWidth: 164,
    borderRadius: 26,
    padding: 10,
    backgroundColor: "rgba(37, 31, 27, 0.94)",
    shadowColor: "#000000",
    shadowOpacity: 0.18,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 16,
    gap: 8,
  },
  launcherItem: {
    minHeight: 54,
    paddingHorizontal: 12,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  launcherItemLast: {
    marginBottom: 0,
  },
  launcherIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  launcherText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.white,
  },
  coachWrap: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 118,
    borderRadius: 24,
    padding: 18,
    gap: spacing.sm,
    backgroundColor: "rgba(255, 252, 248, 0.98)",
    borderWidth: 1,
    borderColor: colors.border,
  },
  coachTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  coachBody: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
  },
  coachButton: {
    alignSelf: "flex-start",
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  coachButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.white,
  },
});

import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { colors } from "@/constants/colors";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 84,
          paddingTop: 8,
          paddingBottom: 24,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "뜨개방",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons color={color} name={focused ? "albums" : "albums-outline"} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="resume"
        options={{
          title: "이어뜨기",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons color={color} name={focused ? "sparkles" : "sparkles-outline"} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="timeline"
        options={{
          title: "기록",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons color={color} name={focused ? "time" : "time-outline"} size={size} />
          ),
        }}
      />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="projects/new" options={{ href: null }} />
      <Tabs.Screen name="projects/[id]" options={{ href: null }} />
      <Tabs.Screen name="projects/[id]/edit" options={{ href: null }} />
      <Tabs.Screen name="projects/[id]/work" options={{ href: null }} />
      <Tabs.Screen name="projects/[id]/history" options={{ href: null }} />
    </Tabs>
  );
}

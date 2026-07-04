import { Redirect, Tabs } from "expo-router";
import { Text } from "react-native";
import { useAuth } from "@/lib/auth";
import { colors } from "@/lib/theme";

function TabIcon({ glyph, focused }: { glyph: string; focused: boolean }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>{glyph}</Text>;
}

export default function TabsLayout() {
  const { session, loading } = useAuth();

  if (!loading && !session) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "700" },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Shelves",
          tabBarIcon: ({ focused }) => <TabIcon glyph="🗄️" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ focused }) => <TabIcon glyph="📊" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ focused }) => <TabIcon glyph="⚙️" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0f0f0f",
          borderTopColor: "#222",
        },
        tabBarActiveTintColor: "#d4a853",
        tabBarInactiveTintColor: "#555",
      }}
    >
      <Tabs.Screen name="explore" options={{ title: "Explore" }} />
      <Tabs.Screen name="saved" options={{ title: "Saved" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}

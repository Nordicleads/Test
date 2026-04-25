import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 2 },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="route/[id]" options={{ presentation: "card" }} />
          <Stack.Screen name="route/preview" options={{ presentation: "card" }} />
          <Stack.Screen name="building/[id]" options={{ presentation: "card" }} />
        </Stack>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

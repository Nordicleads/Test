import { useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useRoutes } from "../../src/hooks/useRoutes";
import { useGenerateRoute } from "../../src/hooks/useGenerateRoute";
import { RouteCard } from "../../src/components/RouteCard";
import { FilterBar } from "../../src/components/FilterBar";
import type { BuildingCategory } from "@wandr/shared";

export default function ExploreScreen() {
  const router = useRouter();
  const { data, isLoading } = useRoutes({ status: "published" });

  const [selectedCategories, setSelectedCategories] = useState<BuildingCategory[]>([]);
  const [stepGoal, setStepGoal] = useState(10_000);

  const { mutate: generate, isPending } = useGenerateRoute();

  const toggleCategory = useCallback((cat: BuildingCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }, []);

  const handleGenerate = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Location needed", "Enable location to generate a route near you.");
      return;
    }

    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });

    generate(
      {
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        stepGoal,
        radiusMeters: 2_000,
      },
      {
        onSuccess: (route) => {
          // Navigate to a preview of the generated route
          router.push({ pathname: "/route/preview", params: { data: JSON.stringify(route) } });
        },
        onError: () => {
          Alert.alert("No routes found", "Try expanding your filters or moving to a new area.");
        },
      }
    );
  }, [selectedCategories, stepGoal, generate, router]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.wordmark}>WANDR</Text>
        <Text style={styles.subtitle}>Cultural walks, curated.</Text>
      </View>

      <FilterBar
        selectedCategories={selectedCategories}
        onToggleCategory={toggleCategory}
        stepGoal={stepGoal}
        onStepGoal={setStepGoal}
        onGenerate={handleGenerate}
        isGenerating={isPending}
      />

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        {isLoading ? (
          <View style={styles.center}>
            <Text style={styles.muted}>Loading routes…</Text>
          </View>
        ) : (data?.data ?? []).length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.muted}>Generate your first route above.</Text>
          </View>
        ) : (
          (data?.data ?? []).map((route) => (
            <RouteCard key={route.id} route={route} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f0f" },
  header: { paddingTop: 72, paddingHorizontal: 24, paddingBottom: 20 },
  wordmark: { fontSize: 28, fontWeight: "700", color: "#d4a853", letterSpacing: 6 },
  subtitle: { fontSize: 13, color: "#888", marginTop: 4, letterSpacing: 1 },
  scroll: { flex: 1 },
  list: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 },
  center: { alignItems: "center", justifyContent: "center", paddingTop: 60 },
  muted: { color: "#555" },
});

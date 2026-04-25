import { useState, useCallback, useRef } from "react";
import {
  View, Text, StyleSheet, ScrollView, Alert,
  TouchableOpacity, TextInput, FlatList,
} from "react-native";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useRoutes } from "../../src/hooks/useRoutes";
import { useGenerateRoute } from "../../src/hooks/useGenerateRoute";
import { useCollections } from "../../src/hooks/useCollections";
import { useNearbyBuildings } from "../../src/hooks/useNearbyBuildings";
import { RouteCard } from "../../src/components/RouteCard";
import { FilterBar } from "../../src/components/FilterBar";
import { CollectionCard } from "../../src/components/CollectionCard";
import { BuildingCard } from "../../src/components/BuildingCard";
import type { BuildingCategory } from "@wandr/shared";

type ExploreMode = "routes" | "nearby";

export default function ExploreScreen() {
  const router = useRouter();

  const [mode, setMode] = useState<ExploreMode>("routes");
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<BuildingCategory[]>([]);
  const [stepGoal, setStepGoal] = useState(10_000);

  const { data: routesData, isLoading: routesLoading } = useRoutes({
    status: "published",
    ...(search ? { city: search } : {}),
  });
  const { data: collections } = useCollections();
  const { data: nearbyBuildings, isLoading: nearbyLoading } = useNearbyBuildings(mode === "nearby");

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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.wordmark}>WANDR</Text>
        <Text style={styles.subtitle}>Cultural walks, curated.</Text>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by city…"
          placeholderTextColor="#555"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {/* Mode toggle */}
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === "routes" && styles.modeBtnActive]}
            onPress={() => setMode("routes")}
          >
            <Text style={[styles.modeBtnText, mode === "routes" && styles.modeBtnTextActive]}>Routes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === "nearby" && styles.modeBtnActive]}
            onPress={() => setMode("nearby")}
          >
            <Text style={[styles.modeBtnText, mode === "nearby" && styles.modeBtnTextActive]}>Nearby</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        {/* Collections row */}
        {(collections ?? []).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>COLLECTIONS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
              {collections!.map((col) => (
                <CollectionCard
                  key={col.id}
                  collection={col}
                  onPress={() => router.push(`/collection/${col.id}` as any)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {mode === "nearby" ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>NEAR YOU</Text>
            {nearbyLoading ? (
              <Text style={styles.muted}>Finding buildings…</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
                {(nearbyBuildings ?? []).map((b: any) => (
                  <BuildingCard key={b.id} building={b} />
                ))}
              </ScrollView>
            )}
          </View>
        ) : (
          <>
            {/* Filter + Generate */}
            <FilterBar
              selectedCategories={selectedCategories}
              onToggleCategory={toggleCategory}
              stepGoal={stepGoal}
              onStepGoal={setStepGoal}
              onGenerate={handleGenerate}
              isGenerating={isPending}
            />

            {/* Route list */}
            <View style={styles.list}>
              {routesLoading ? (
                <Text style={styles.muted}>Loading routes…</Text>
              ) : (routesData?.data ?? []).length === 0 ? (
                <Text style={styles.muted}>Generate your first route above.</Text>
              ) : (
                (routesData?.data ?? []).map((route) => (
                  <RouteCard key={route.id} route={route} />
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f0f" },
  header: { paddingTop: 72, paddingHorizontal: 24, paddingBottom: 16 },
  wordmark: { fontSize: 28, fontWeight: "700", color: "#d4a853", letterSpacing: 6 },
  subtitle: { fontSize: 13, color: "#888", marginTop: 4, letterSpacing: 1 },

  searchRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 10, marginBottom: 4 },
  searchInput: {
    flex: 1,
    backgroundColor: "#161616",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#f0ece4",
    fontSize: 14,
  },
  modeToggle: { flexDirection: "row", backgroundColor: "#161616", borderRadius: 10, padding: 3 },
  modeBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  modeBtnActive: { backgroundColor: "#d4a853" },
  modeBtnText: { fontSize: 12, color: "#555", fontWeight: "600" },
  modeBtnTextActive: { color: "#0f0f0f" },

  scroll: { flex: 1 },
  section: { paddingTop: 20 },
  sectionLabel: { fontSize: 10, color: "#555", letterSpacing: 2, fontWeight: "600", paddingHorizontal: 24, marginBottom: 12 },
  hScroll: { paddingLeft: 16, paddingRight: 8, paddingBottom: 4 },

  list: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  muted: { color: "#555", paddingHorizontal: 24, paddingTop: 20 },
});

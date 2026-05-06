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
import { CitySearch } from "../../src/components/CitySearch";
import { WandrLogo } from "../../src/components/WandrLogo";
import type { CityHit } from "../../src/components/CitySearch";
import type { BuildingCategory } from "@wandr/shared";

type ExploreMode = "routes" | "nearby";

export default function ExploreScreen() {
  const router = useRouter();

  const [mode, setMode] = useState<ExploreMode>("routes");
  const [cityFilter, setCityFilter] = useState("");
  const [pinCoords, setPinCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [cityHits, setCityHits] = useState<CityHit[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<BuildingCategory[]>([]);
  const [stepGoal, setStepGoal] = useState(10_000);
  const [maxStops, setMaxStops] = useState(0); // 0 = auto
  const [stepFreeOnly, setStepFreeOnly] = useState(false);

  const { data: routesData, isLoading: routesLoading } = useRoutes({
    status: "published",
    ...(cityFilter ? { city: cityFilter } : {}),
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
    let lat: number, lng: number;

    if (pinCoords) {
      // Use the city selected from autocomplete
      lat = pinCoords.lat;
      lng = pinCoords.lng;
    } else {
      // Fall back to device GPS
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Location needed", "Search for a city above or enable location access.");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      lat = loc.coords.latitude;
      lng = loc.coords.longitude;
    }

    generate(
      {
        lat,
        lng,
        categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        stepGoal,
        maxStops: maxStops > 0 ? maxStops : undefined,
        stepFreeOnly: stepFreeOnly || undefined,
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
  }, [pinCoords, selectedCategories, stepGoal, maxStops, generate, router]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <WandrLogo />
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <CitySearch
          style={styles.citySearch}
          onHitsChange={setCityHits}
          onClear={() => {
            setCityFilter("");
            setPinCoords(null);
            setCityHits([]);
          }}
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

      {/* City autocomplete suggestions — rendered in flow to avoid overflow clipping */}
      {cityHits.length > 0 && (
        <View style={styles.suggestions}>
          {cityHits.map((h, i) => (
            <TouchableOpacity
              key={h.place_id}
              style={[styles.suggestionItem, i < cityHits.length - 1 && styles.suggestionBorder]}
              onPress={() => {
                setCityFilter(h.name);
                setPinCoords({ lat: h.lat, lng: h.lng });
                setCityHits([]);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.suggestionCity}>{h.name}</Text>
              <Text style={styles.suggestionCountry}>{h.country}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

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
              maxStops={maxStops}
              onMaxStops={setMaxStops}
              stepFreeOnly={stepFreeOnly}
              onToggleStepFree={() => setStepFreeOnly((v) => !v)}
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
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  header: { paddingTop: 68, paddingHorizontal: 24, paddingBottom: 20 },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 4,
  },
  citySearch: { flex: 1 },

  suggestions: {
    marginHorizontal: 16,
    marginBottom: 4,
    backgroundColor: "#141414",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#222",
    overflow: "hidden",
  },
  suggestionItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  suggestionBorder: { borderBottomWidth: 1, borderBottomColor: "#1e1e1e" },
  suggestionCity: { fontSize: 14, color: "#f2ece2", fontWeight: "600" },
  suggestionCountry: { fontSize: 12, color: "#555" },

  modeToggle: {
    flexDirection: "row",
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: "#1e1e1e",
  },
  modeBtn: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 9 },
  modeBtnActive: { backgroundColor: "#d4a853" },
  modeBtnText: { fontSize: 12, color: "#444", fontWeight: "600", letterSpacing: 0.3 },
  modeBtnTextActive: { color: "#0a0a0a" },

  scroll: { flex: 1 },
  section: { paddingTop: 20 },
  sectionLabel: {
    fontSize: 9,
    color: "#3a3a3a",
    letterSpacing: 3,
    fontWeight: "700",
    paddingHorizontal: 24,
    marginBottom: 14,
    textTransform: "uppercase",
  },
  hScroll: { paddingLeft: 16, paddingRight: 8, paddingBottom: 4 },

  list: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  muted: { color: "#444", paddingHorizontal: 24, paddingTop: 20, fontSize: 13, letterSpacing: 0.3 },
});

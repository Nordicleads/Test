import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRoute } from "../../src/hooks/useRoutes";
import { usePitStops } from "../../src/hooks/usePitStops";
import { PitStopCard } from "../../src/components/PitStopCard";

export default function RouteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: route, isLoading } = useRoute(id);
  const { data: pitStops } = usePitStops(id);

  if (isLoading || !route) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Loading…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapLabel}>🗺 Map view available in the mobile app</Text>
      </View>

      <ScrollView style={styles.panel} contentContainerStyle={styles.panelContent}>
        <Text style={styles.title}>{route.title}</Text>
        <View style={styles.meta}>
          <Text style={styles.chip}>{route.estimatedSteps?.toLocaleString()} steps</Text>
          <Text style={styles.chip}>{route.estimatedDurationMinutes} min</Text>
          <Text style={styles.chip}>{route.difficultyLevel}</Text>
        </View>
        <Text style={styles.description}>{route.description}</Text>

        {route.stops?.map((stop: any, i: number) => (
          <TouchableOpacity
            key={stop.id}
            style={styles.stopRow}
            onPress={() => router.push(`/building/${stop.building.id}`)}
          >
            <View style={styles.stopNumber}>
              <Text style={styles.stopNumberText}>{i + 1}</Text>
            </View>
            <View style={styles.stopInfo}>
              <Text style={styles.stopName}>{stop.building.name}</Text>
              <Text style={styles.stopDesc} numberOfLines={1}>{stop.building.shortDescription}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {pitStops && pitStops.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>PIT STOPS</Text>
            {pitStops.map((ps: any) => (
              <PitStopCard key={ps.id} stop={ps} />
            ))}
          </>
        )}

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f0f" },
  mapPlaceholder: {
    height: 200,
    backgroundColor: "#161616",
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  mapLabel: { color: "#555", fontSize: 13 },
  panel: { flex: 1, backgroundColor: "#0f0f0f" },
  panelContent: { padding: 24, gap: 12 },
  center: { flex: 1, backgroundColor: "#0f0f0f", alignItems: "center", justifyContent: "center" },
  muted: { color: "#555" },
  title: { fontSize: 22, fontWeight: "700", color: "#f0ece4" },
  meta: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: { fontSize: 12, color: "#d4a853", borderWidth: 1, borderColor: "#d4a853", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  description: { color: "#888", lineHeight: 22, fontSize: 14 },
  stopRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  stopNumber: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "#d4a853",
    alignItems: "center", justifyContent: "center",
  },
  stopNumberText: { color: "#0f0f0f", fontSize: 12, fontWeight: "700" },
  stopInfo: { flex: 1 },
  stopName: { fontSize: 14, fontWeight: "600", color: "#f0ece4" },
  stopDesc: { fontSize: 12, color: "#666" },
  sectionTitle: { fontSize: 11, fontWeight: "700", color: "#d4a853", letterSpacing: 2, marginTop: 8 },
  backButton: { alignItems: "center", paddingVertical: 8, marginTop: 8 },
  backText: { color: "#555", fontSize: 13 },
});

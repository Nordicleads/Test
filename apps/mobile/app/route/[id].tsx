import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { useRoute } from "../../src/hooks/useRoutes";
import { usePitStops } from "../../src/hooks/usePitStops";
import { openInMaps } from "../../src/services/maps";
import { VoiceGuideControls } from "../../src/components/VoiceGuideControls";
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

  const coordinates = route.stops?.map((s: any) => ({
    latitude: s.building.coordinates.lat,
    longitude: s.building.coordinates.lng,
  })) ?? [];

  const firstStop = coordinates[0];

  return (
    <View style={styles.container}>
      {firstStop && (
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: firstStop.latitude,
            longitude: firstStop.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          {route.stops?.map((stop: any, i: number) => (
            <Marker
              key={stop.id}
              coordinate={{ latitude: stop.building.coordinates.lat, longitude: stop.building.coordinates.lng }}
              title={`${i + 1}. ${stop.building.name}`}
              onCalloutPress={() => router.push(`/building/${stop.building.id}`)}
            />
          ))}
          {coordinates.length > 1 && (
            <Polyline coordinates={coordinates} strokeColor="#d4a853" strokeWidth={3} />
          )}
        </MapView>
      )}

      <ScrollView style={styles.panel} contentContainerStyle={styles.panelContent}>
        <Text style={styles.title}>{route.title}</Text>
        <View style={styles.meta}>
          <Text style={styles.chip}>{route.estimatedSteps?.toLocaleString()} steps</Text>
          <Text style={styles.chip}>{route.estimatedDurationMinutes} min</Text>
          <Text style={styles.chip}>{route.difficultyLevel}</Text>
        </View>
        <Text style={styles.description}>{route.description}</Text>

        <TouchableOpacity
          style={styles.startButton}
          onPress={() => {
            const first = route.stops?.[0];
            if (first) openInMaps({ lat: first.building.coordinates.lat, lng: first.building.coordinates.lng, name: first.building.name });
          }}
        >
          <Text style={styles.startButtonText}>Start Walk</Text>
        </TouchableOpacity>

        {pitStops && pitStops.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>PIT STOPS</Text>
            {pitStops.map((ps: any) => (
              <PitStopCard key={ps.id} stop={ps} />
            ))}
          </>
        )}
      </ScrollView>
      <VoiceGuideControls />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f0f" },
  map: { flex: 1 },
  panel: { maxHeight: 420, backgroundColor: "#161616" },
  panelContent: { padding: 24, gap: 12 },
  title: { fontSize: 22, fontWeight: "700", color: "#f0ece4" },
  meta: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: { fontSize: 12, color: "#d4a853", borderWidth: 1, borderColor: "#d4a853", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  description: { color: "#888", lineHeight: 22, fontSize: 14 },
  startButton: { backgroundColor: "#d4a853", borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  startButtonText: { color: "#0f0f0f", fontWeight: "700", fontSize: 16, letterSpacing: 1 },
  sectionTitle: { fontSize: 11, fontWeight: "700", color: "#d4a853", letterSpacing: 2, marginTop: 8 },
  center: { flex: 1, backgroundColor: "#0f0f0f", alignItems: "center", justifyContent: "center" },
  muted: { color: "#555" },
});

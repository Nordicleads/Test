import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { openFullRouteInMaps } from "../../src/services/maps";

export default function RoutePreviewScreen() {
  const { data } = useLocalSearchParams<{ data: string }>();
  const router = useRouter();

  let route: any = null;
  try {
    route = JSON.parse(data ?? "null");
  } catch {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Could not load route preview.</Text>
      </View>
    );
  }

  if (!route) return null;

  const coordinates = (route.stops ?? []).map((s: any) => ({
    latitude: s.building.coordinates.lat,
    longitude: s.building.coordinates.lng,
  }));

  const mapLocations = (route.stops ?? []).map((s: any) => ({
    lat: s.building.coordinates.lat,
    lng: s.building.coordinates.lng,
    name: s.building.name,
  }));

  const first = coordinates[0];

  return (
    <View style={styles.container}>
      {first && (
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: first.latitude,
            longitude: first.longitude,
            latitudeDelta: 0.018,
            longitudeDelta: 0.018,
          }}
        >
          {(route.stops ?? []).map((stop: any, i: number) => (
            <Marker
              key={stop.order}
              coordinate={{
                latitude: stop.building.coordinates.lat,
                longitude: stop.building.coordinates.lng,
              }}
              title={`${i + 1}. ${stop.building.name}`}
              pinColor="#d4a853"
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

        <View style={styles.metaRow}>
          <Text style={styles.chip}>{route.estimatedSteps?.toLocaleString()} steps</Text>
          <Text style={styles.chip}>{route.estimatedDurationMinutes} min</Text>
          <Text style={styles.chip}>{route.difficultyLevel}</Text>
          <Text style={styles.chip}>{route.stops?.length} stops</Text>
        </View>

        <Text style={styles.description}>{route.description}</Text>

        {/* Stop list preview */}
        {(route.stops ?? []).map((stop: any, i: number) => (
          <TouchableOpacity
            key={stop.order}
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

        <TouchableOpacity
          style={styles.startButton}
          onPress={() => {
            if (mapLocations.length === 0) return;
            openFullRouteInMaps(mapLocations);
          }}
        >
          <Text style={styles.startButtonText}>Open in Maps</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back to Explore</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f0f" },
  map: { flex: 1, minHeight: 300 },
  panel: { maxHeight: 420, backgroundColor: "#0f0f0f" },
  panelContent: { padding: 20, gap: 12 },
  center: { flex: 1, backgroundColor: "#0f0f0f", alignItems: "center", justifyContent: "center" },
  muted: { color: "#555" },

  title: { fontSize: 20, fontWeight: "800", color: "#f0ece4" },
  metaRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: {
    fontSize: 11,
    color: "#d4a853",
    borderWidth: 1,
    borderColor: "#d4a853",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  description: { fontSize: 13, color: "#666", lineHeight: 20 },

  stopRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  stopNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#d4a853",
    alignItems: "center",
    justifyContent: "center",
  },
  stopNumberText: { color: "#0f0f0f", fontSize: 12, fontWeight: "700" },
  stopInfo: { flex: 1 },
  stopName: { fontSize: 14, fontWeight: "600", color: "#f0ece4" },
  stopDesc: { fontSize: 12, color: "#666" },

  startButton: {
    backgroundColor: "#d4a853",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  startButtonText: { color: "#0f0f0f", fontWeight: "700", fontSize: 15 },
  backButton: { alignItems: "center", paddingVertical: 8 },
  backText: { color: "#555", fontSize: 13 },
});

import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useItinerary } from "../../src/hooks/useItineraries";
import type { ItineraryDay } from "@wandr/shared";

const THEME_LABELS: Record<string, string> = {
  architecture: "Architecture",
  heritage: "Heritage",
  modern: "Modern",
  mixed: "Mixed",
};

export default function ItineraryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: itinerary, isLoading } = useItinerary(id);

  if (isLoading || !itinerary) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Loading…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.city}>{itinerary.city?.toUpperCase()}</Text>
      <Text style={styles.title}>{itinerary.title}</Text>

      <View style={styles.metaRow}>
        <Text style={styles.chip}>{THEME_LABELS[itinerary.theme]}</Text>
        <Text style={styles.chip}>{itinerary.daysCount} days</Text>
      </View>

      {itinerary.description && (
        <Text style={styles.description}>{itinerary.description}</Text>
      )}

      <Text style={styles.sectionTitle}>YOUR DAYS</Text>

      {(itinerary.days ?? []).map((day: ItineraryDay) => (
        <TouchableOpacity
          key={day.id}
          style={styles.dayCard}
          onPress={() => day.routeId && router.push(`/route/${day.routeId}`)}
          disabled={!day.routeId}
        >
          <View style={styles.dayNumber}>
            <Text style={styles.dayNumberText}>{day.dayNumber}</Text>
          </View>
          <View style={styles.dayInfo}>
            <Text style={styles.dayTitle}>{day.title ?? `Day ${day.dayNumber}`}</Text>
            {day.route ? (
              <>
                <Text style={styles.routeTitle}>{(day.route as any).title}</Text>
                <Text style={styles.routeMeta}>
                  {(day.route as any).estimatedSteps?.toLocaleString()} steps ·{" "}
                  {(day.route as any).estimatedDurationMinutes} min ·{" "}
                  {(day.route as any).difficultyLevel}
                </Text>
              </>
            ) : (
              <Text style={styles.noRoute}>No route assigned</Text>
            )}
            {day.notes && <Text style={styles.notes}>{day.notes}</Text>}
          </View>
          {day.routeId && <Text style={styles.arrow}>→</Text>}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f0f" },
  content: { padding: 24, paddingBottom: 60, gap: 12 },
  center: { flex: 1, backgroundColor: "#0f0f0f", alignItems: "center", justifyContent: "center" },
  muted: { color: "#555" },

  backBtn: { alignSelf: "flex-start", paddingVertical: 4, marginBottom: 12 },
  backText: { color: "#555", fontSize: 14 },

  city: { fontSize: 10, color: "#d4a853", letterSpacing: 3, fontWeight: "700" },
  title: { fontSize: 26, fontWeight: "800", color: "#f0ece4", lineHeight: 32, marginTop: 4 },
  metaRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 4 },
  chip: {
    fontSize: 11, color: "#d4a853",
    borderWidth: 1, borderColor: "#d4a853",
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  description: { fontSize: 14, color: "#888", lineHeight: 22, marginTop: 4 },

  sectionTitle: { fontSize: 10, color: "#555", letterSpacing: 2, fontWeight: "700", marginTop: 16 },

  dayCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    backgroundColor: "#161616",
    borderRadius: 14,
    padding: 16,
  },
  dayNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#d4a853",
    alignItems: "center",
    justifyContent: "center",
  },
  dayNumberText: { color: "#0f0f0f", fontWeight: "800", fontSize: 14 },
  dayInfo: { flex: 1, gap: 3 },
  dayTitle: { fontSize: 15, fontWeight: "700", color: "#f0ece4" },
  routeTitle: { fontSize: 13, color: "#b0a898" },
  routeMeta: { fontSize: 11, color: "#555" },
  noRoute: { fontSize: 12, color: "#333", fontStyle: "italic" },
  notes: { fontSize: 12, color: "#666", marginTop: 4, lineHeight: 18 },
  arrow: { fontSize: 16, color: "#d4a853", marginTop: 8 },
});

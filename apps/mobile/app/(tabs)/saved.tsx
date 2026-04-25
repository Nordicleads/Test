import { View, Text, StyleSheet, FlatList, SectionList, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useOfflineBundles } from "../../src/hooks/useOfflineBundles";
import { useItineraries } from "../../src/hooks/useItineraries";
import { StorageBar } from "../../src/components/StorageBar";
import type { OfflineBundleMeta, ItinerarySummary } from "@wandr/shared";

function daysUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

const THEME_LABELS: Record<string, string> = {
  architecture: "Architecture",
  heritage: "Heritage",
  modern: "Modern",
  mixed: "Mixed",
};

export default function SavedScreen() {
  const router = useRouter();
  const { bundles, storageBytes, remove } = useOfflineBundles();
  const { data: itineraries } = useItineraries();

  const handleDelete = (item: OfflineBundleMeta) => {
    Alert.alert("Remove route?", `"${item.title}" will be deleted from your device.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => remove(item.routeId) },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Saved</Text>
        <StorageBar usedBytes={storageBytes} />
      </View>

      <SectionList
        contentContainerStyle={styles.listContent}
        sections={[
          { title: "OFFLINE ROUTES", data: bundles },
          { title: "ITINERARIES", data: itineraries ?? [] },
        ]}
        keyExtractor={(item: any) => item.routeId ?? item.id}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionTitle}>{section.title}</Text>
        )}
        renderItem={({ item, section }) => {
          if (section.title === "OFFLINE ROUTES") {
            const b = item as OfflineBundleMeta;
            const days = daysUntil(b.expiresAt);
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/route/${b.routeId}`)}
                activeOpacity={0.85}
              >
                <View style={styles.cardBody}>
                  <Text style={styles.city}>{b.city.toUpperCase()}</Text>
                  <Text style={styles.cardTitle}>{b.title}</Text>
                  <Text style={styles.meta}>
                    {b.estimatedSteps.toLocaleString()} steps · Expires in {days} day{days !== 1 ? "s" : ""}
                  </Text>
                </View>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(b)}>
                  <Text style={styles.deleteText}>✕</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }

          const itin = item as ItinerarySummary;
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/itinerary/${itin.id}`)}
              activeOpacity={0.85}
            >
              <View style={styles.cardBody}>
                <Text style={styles.city}>{itin.city?.toUpperCase()}</Text>
                <Text style={styles.cardTitle}>{itin.title}</Text>
                <Text style={styles.meta}>
                  {THEME_LABELS[itin.theme]} · {itin.daysCount} day{itin.daysCount !== 1 ? "s" : ""}
                </Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Nothing saved yet</Text>
            <Text style={styles.emptyBody}>
              Download routes before you travel or plan a multi-day itinerary from the Explore tab.
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        stickySectionHeadersEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f0f" },
  header: { paddingTop: 72, paddingHorizontal: 24, paddingBottom: 20, gap: 16 },
  heading: { fontSize: 28, fontWeight: "800", color: "#f0ece4" },
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 10, color: "#555", letterSpacing: 2, fontWeight: "700", marginTop: 24, marginBottom: 10 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#161616",
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  cardBody: { flex: 1, gap: 4 },
  city: { fontSize: 10, color: "#d4a853", letterSpacing: 2, fontWeight: "600" },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#f0ece4" },
  meta: { fontSize: 12, color: "#555", marginTop: 2 },
  deleteBtn: { padding: 8 },
  deleteText: { color: "#555", fontSize: 16 },
  arrow: { fontSize: 16, color: "#d4a853" },
  sep: { height: 10 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#f0ece4" },
  emptyBody: { fontSize: 14, color: "#555", textAlign: "center", lineHeight: 22 },
});

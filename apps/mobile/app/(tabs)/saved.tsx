import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useOfflineBundles } from "../../src/hooks/useOfflineBundles";
import { StorageBar } from "../../src/components/StorageBar";
import type { OfflineBundleMeta } from "@wandr/shared";

function daysUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

export default function SavedScreen() {
  const router = useRouter();
  const { bundles, storageBytes, remove } = useOfflineBundles();

  const handleDelete = (item: OfflineBundleMeta) => {
    Alert.alert("Remove route?", `"${item.title}" will be deleted from your device.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => remove(item.routeId) },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Saved Routes</Text>
        <StorageBar usedBytes={storageBytes} />
      </View>

      {bundles.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No saved routes yet</Text>
          <Text style={styles.emptyBody}>
            Download routes before you travel.{"\n"}They'll work without a connection.
          </Text>
        </View>
      ) : (
        <FlatList
          data={bundles}
          keyExtractor={(b) => b.routeId}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const days = daysUntil(item.expiresAt);
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/route/${item.routeId}`)}
                activeOpacity={0.85}
              >
                <View style={styles.cardBody}>
                  <Text style={styles.city}>{item.city.toUpperCase()}</Text>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.meta}>
                    {item.estimatedSteps.toLocaleString()} steps · Expires in {days} day{days !== 1 ? "s" : ""}
                  </Text>
                </View>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                  <Text style={styles.deleteText}>✕</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f0f" },
  header: { paddingTop: 72, paddingHorizontal: 24, paddingBottom: 20, gap: 16 },
  heading: { fontSize: 28, fontWeight: "800", color: "#f0ece4" },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
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
  title: { fontSize: 16, fontWeight: "700", color: "#f0ece4" },
  meta: { fontSize: 12, color: "#555", marginTop: 2 },
  deleteBtn: { padding: 8 },
  deleteText: { color: "#555", fontSize: 16 },
  sep: { height: 10 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#f0ece4" },
  emptyBody: { fontSize: 14, color: "#555", textAlign: "center", lineHeight: 22 },
});

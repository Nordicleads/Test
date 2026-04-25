import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Switch } from "react-native";
import { useWalkStats } from "../../src/hooks/useWalkStats";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../src/services/api";
import { StatCard } from "../../src/components/StatCard";
import { WalkHistoryList } from "../../src/components/WalkHistoryList";
import { requestPermissions } from "../../src/services/healthKit";

export default function ProfileScreen() {
  const { data: stats } = useWalkStats();
  const [healthEnabled, setHealthEnabled] = useState(false);

  const { data: recentWalks } = useQuery({
    queryKey: ["walk-history"],
    queryFn: () => api.walks.history(10),
  });

  const handleHealthToggle = async (val: boolean) => {
    if (val) {
      const granted = await requestPermissions();
      setHealthEnabled(granted);
    } else {
      setHealthEnabled(false);
    }
  };

  const totalDistanceKm = ((stats?.totalDistanceMeters ?? 0) / 1000).toFixed(1);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Your Walks</Text>

      <View style={styles.healthRow}>
        <Text style={styles.healthLabel}>Sync with Health</Text>
        <Switch
          value={healthEnabled}
          onValueChange={handleHealthToggle}
          trackColor={{ false: "#333", true: "#d4a853" }}
          thumbColor="#f0ece4"
        />
      </View>

      <View style={styles.statsRow}>
        <StatCard
          label="Routes"
          value={String(stats?.totalRoutes ?? 0)}
        />
        <StatCard
          label="Steps"
          value={(stats?.totalSteps ?? 0).toLocaleString()}
        />
        <StatCard
          label="Distance"
          value={totalDistanceKm}
          unit="km"
        />
      </View>

      <Text style={styles.sectionTitle}>RECENT WALKS</Text>

      {(recentWalks ?? []).length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Complete your first walk to see stats here.</Text>
        </View>
      ) : (
        <View style={styles.historyContainer}>
          <WalkHistoryList walks={recentWalks ?? []} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f0f" },
  content: { padding: 24, paddingTop: 72, gap: 20, paddingBottom: 60 },
  heading: { fontSize: 28, fontWeight: "800", color: "#f0ece4" },
  healthRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#161616",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  healthLabel: { fontSize: 15, color: "#f0ece4" },
  statsRow: { flexDirection: "row", gap: 12 },
  sectionTitle: { fontSize: 10, color: "#555", letterSpacing: 2, fontWeight: "600", marginTop: 8 },
  historyContainer: { backgroundColor: "#161616", borderRadius: 12, paddingHorizontal: 16 },
  empty: { alignItems: "center", paddingVertical: 48 },
  emptyText: { color: "#555", textAlign: "center", lineHeight: 22 },
});

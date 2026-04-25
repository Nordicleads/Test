import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import type { PitStop } from "@wandr/shared";
import { openInMaps } from "../services/maps";

const TYPE_ICON: Record<string, string> = {
  cafe: "☕",
  restaurant: "🍴",
  water: "💧",
  restroom: "🚻",
  viewpoint: "🔭",
};

interface Props {
  stop: PitStop;
}

export function PitStopCard({ stop }: Props) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => openInMaps({ lat: stop.coordinates.lat, lng: stop.coordinates.lng, name: stop.name })}
    >
      <Text style={styles.icon}>{TYPE_ICON[stop.type] ?? "📍"}</Text>
      <View style={styles.info}>
        <Text style={styles.name}>{stop.name}</Text>
        <Text style={styles.meta}>{stop.distanceFromRouteMeters}m off route · after stop {stop.insertAfterStopOrder}</Text>
      </View>
      <Text style={styles.arrow}>→</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#161616",
    borderRadius: 12,
    padding: 14,
  },
  icon: { fontSize: 22 },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 14, fontWeight: "600", color: "#f0ece4" },
  meta: { fontSize: 11, color: "#555" },
  arrow: { fontSize: 14, color: "#d4a853" },
});

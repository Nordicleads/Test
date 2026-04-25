import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useVoiceGuideStore } from "../stores/voiceGuideStore";
import { useVoiceGuide } from "../hooks/useVoiceGuide";

export function VoiceGuideControls() {
  const store = useVoiceGuideStore();
  const { togglePause, stopGuide } = useVoiceGuide();

  if (!store.isActive) return null;

  const currentStop = store.routeStops[store.currentStopOrder - 1];
  const nextStop = store.routeStops[store.currentStopOrder];

  return (
    <View style={styles.pill}>
      <View style={styles.top}>
        <View style={styles.info}>
          <Text style={styles.stopLabel}>NOW</Text>
          <Text style={styles.stopName} numberOfLines={1}>
            {currentStop?.building.name ?? "—"}
          </Text>
          {nextStop && (
            <Text style={styles.nextStop} numberOfLines={1}>
              Next: {nextStop.building.name}
            </Text>
          )}
        </View>
        <View style={styles.controls}>
          <TouchableOpacity style={styles.playBtn} onPress={togglePause}>
            <Text style={styles.playIcon}>{store.isPlaying ? "⏸" : "▶"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.stopBtn} onPress={stopGuide}>
            <Text style={styles.stopIcon}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      {currentStop && !currentStop.building.audioGuideUrl && currentStop.narrativeText && (
        <ScrollView style={styles.narrativeScroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.narrative}>{currentStop.narrativeText}</Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: "#161616",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
    gap: 10,
  },
  top: { flexDirection: "row", alignItems: "center", gap: 12 },
  info: { flex: 1, gap: 2 },
  stopLabel: { fontSize: 9, color: "#d4a853", letterSpacing: 2, fontWeight: "700" },
  stopName: { fontSize: 15, fontWeight: "700", color: "#f0ece4" },
  nextStop: { fontSize: 11, color: "#555" },
  controls: { flexDirection: "row", gap: 8, alignItems: "center" },
  playBtn: {
    width: 40,
    height: 40,
    backgroundColor: "#d4a853",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  playIcon: { fontSize: 16, color: "#0f0f0f" },
  stopBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  stopIcon: { fontSize: 16, color: "#555" },
  narrativeScroll: { maxHeight: 80 },
  narrative: { fontSize: 13, color: "#888", lineHeight: 20 },
});

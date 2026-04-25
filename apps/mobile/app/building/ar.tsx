import {
  View, Text, StyleSheet, Image, Dimensions,
  TouchableOpacity, ScrollView, PanResponder, Animated,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../src/services/api";

const { width, height } = Dimensions.get("window");

// Phase 2 stub: camera feed replaced by a dark overlay.
// Real AR (native camera + image overlay) requires EAS custom dev client
// with a native AR module (ViroReact or Expo Camera + GL).

export default function ARScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: building } = useQuery({
    queryKey: ["building", id],
    queryFn: () => api.buildings.get(id!),
    enabled: !!id,
  });

  const historicalImages = useMemo(
    () => (building?.images ?? []).filter((i: any) => i.is_historical),
    [building]
  );

  const [selectedIdx, setSelectedIdx] = useState(0);
  const opacity = useRef(new Animated.Value(0.6)).current;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: (_e, gs) => {
          // Dragging up = more transparent, dragging down = more opaque
          const next = Math.min(1, Math.max(0.1, 0.6 - gs.dy / 300));
          opacity.setValue(next);
        },
      }),
    [opacity]
  );

  if (!building) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Loading…</Text>
      </View>
    );
  }

  if (historicalImages.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.noImages}>No historical images available for this building.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const current = historicalImages[selectedIdx];

  return (
    <View style={styles.container}>
      {/* Simulated camera feed — dark gradient background */}
      <View style={styles.cameraFeed}>
        <Text style={styles.cameraLabel}>CAMERA FEED</Text>
        <Text style={styles.cameraNote}>Live AR requires EAS custom dev client</Text>
      </View>

      {/* Historical image overlay — drag to adjust opacity */}
      <Animated.View style={[styles.overlay, { opacity }]} {...panResponder.panHandlers}>
        <Image
          source={{ uri: current.url }}
          style={styles.overlayImage}
          resizeMode="cover"
        />
      </Animated.View>

      {/* HUD */}
      <View style={styles.hud} pointerEvents="box-none">
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        <View style={styles.label}>
          <Text style={styles.buildingName}>{building.name}</Text>
          {current.year && (
            <Text style={styles.yearLabel}>Historical view · {current.year}</Text>
          )}
          <Text style={styles.dragHint}>↕ Drag overlay to adjust transparency</Text>
        </View>

        {/* Thumbnail strip */}
        {historicalImages.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.strip}
            contentContainerStyle={styles.stripContent}
          >
            {historicalImages.map((img: any, i: number) => (
              <TouchableOpacity
                key={img.id}
                onPress={() => setSelectedIdx(i)}
                style={[styles.thumb, i === selectedIdx && styles.thumbActive]}
              >
                <Image source={{ uri: img.url }} style={styles.thumbImage} />
                {img.year && <Text style={styles.thumbYear}>{img.year}</Text>}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

  cameraFeed: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0a0a0a",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  cameraLabel: { fontSize: 11, color: "#333", letterSpacing: 3, fontWeight: "700" },
  cameraNote: { fontSize: 11, color: "#222" },

  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayImage: { width, height },

  hud: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
  },

  backButton: {
    margin: 20,
    marginTop: 52,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  backArrow: { color: "#fff", fontSize: 20 },

  label: {
    backgroundColor: "rgba(0,0,0,0.6)",
    margin: 16,
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  buildingName: { fontSize: 16, fontWeight: "700", color: "#f0ece4" },
  yearLabel: { fontSize: 12, color: "#d4a853" },
  dragHint: { fontSize: 10, color: "#555", marginTop: 4 },

  strip: { maxHeight: 100 },
  stripContent: { paddingHorizontal: 16, paddingBottom: 32, gap: 8 },
  thumb: { borderRadius: 8, overflow: "hidden", opacity: 0.5 },
  thumbActive: { opacity: 1, borderWidth: 2, borderColor: "#d4a853" },
  thumbImage: { width: 72, height: 54, backgroundColor: "#1a1a1a" },
  thumbYear: { fontSize: 9, color: "#888", textAlign: "center", marginTop: 2 },

  center: { flex: 1, backgroundColor: "#0f0f0f", alignItems: "center", justifyContent: "center", gap: 16, padding: 32 },
  muted: { color: "#555" },
  noImages: { color: "#888", textAlign: "center", lineHeight: 22 },
  backBtn: { paddingVertical: 12, paddingHorizontal: 24, borderWidth: 1, borderColor: "#333", borderRadius: 12 },
  backText: { color: "#555" },
});

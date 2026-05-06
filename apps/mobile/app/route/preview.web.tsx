import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

function buildLeafletHtml(stops: any[], walkingPolyline?: { lat: number; lng: number }[]) {
  if (!stops?.length) return "";
  const first = stops[0].building;
  const markers = stops
    .map(
      (s: any, i: number) =>
        `L.marker([${s.building.lat ?? s.building.coordinates?.lat}, ${s.building.lng ?? s.building.coordinates?.lng}], {
          icon: L.divIcon({ className:'', html:'<div style="background:#d4a853;color:#0f0f0f;border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px">${i + 1}</div>', iconSize:[26,26], iconAnchor:[13,13] })
        }).addTo(map).bindPopup("<b>${i + 1}. ${s.building.name?.replace(/'/g, "\\'")}</b>")`
    )
    .join(";\n");

  // Use real walking polyline if available, otherwise straight lines between stops
  const hasRealPath = Array.isArray(walkingPolyline) && walkingPolyline.length > 1;
  const pathCoords = hasRealPath
    ? walkingPolyline!.map((p) => `[${p.lat},${p.lng}]`).join(",")
    : stops.map((s: any) => `[${s.building.lat ?? s.building.coordinates?.lat},${s.building.lng ?? s.building.coordinates?.lng}]`).join(",");

  const boundsCoords = stops
    .map((s: any) => `[${s.building.lat ?? s.building.coordinates?.lat},${s.building.lng ?? s.building.coordinates?.lng}]`)
    .join(",");

  const lat = first.lat ?? first.coordinates?.lat;
  const lng = first.lng ?? first.coordinates?.lng;
  const dashArray = hasRealPath ? "" : "dashArray: '8,6', ";

  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>body{margin:0;background:#161616}#map{height:100vh}</style>
</head><body><div id="map"></div><script>
var map=L.map('map',{zoomControl:true}).setView([${lat},${lng}],14);
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{attribution:'© OSM © CartoDB',maxZoom:19}).addTo(map);
${markers};
L.polyline([${pathCoords}],{color:'#d4a853',weight:3,opacity:0.9,${dashArray}}).addTo(map);
var bounds=L.polyline([${boundsCoords}]).getBounds();
map.fitBounds(bounds,{padding:[32,32]});
</script></body></html>`;
}

function speak(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-GB";
  u.rate = 0.88;
  u.pitch = 0.85;
  // Pick a deep British voice if available
  const voices = window.speechSynthesis.getVoices();
  const british = voices.find((v) => v.lang === "en-GB") ?? voices[0];
  if (british) u.voice = british;
  window.speechSynthesis.speak(u);
}

function buildNarration(route: any): string {
  const stops = route.stops ?? [];
  const intro = `Welcome to ${route.title}. ${route.description ?? ""} This route covers approximately ${route.estimatedSteps?.toLocaleString()} steps across ${stops.length} remarkable stops.`;
  const stopTexts = stops
    .map((s: any, i: number) => `Stop ${i + 1}: ${s.building.name}. ${s.narrativeText ?? s.building.shortDescription ?? ""}`)
    .join(" ... ");
  return `${intro} ... ${stopTexts}`;
}

export default function RoutePreviewScreen() {
  const { data } = useLocalSearchParams<{ data: string }>();
  const router = useRouter();
  const [playing, setPlaying] = React.useState(false);

  let route: any = null;
  try { route = JSON.parse(data ?? "null"); } catch { /* */ }

  if (!route) return (
    <View style={styles.center}><Text style={styles.muted}>Could not load route preview.</Text></View>
  );

  const mapHtml = buildLeafletHtml(route.stops ?? [], route.walkingPolyline);
  const mapSrc = mapHtml ? `data:text/html;charset=utf-8,${encodeURIComponent(mapHtml)}` : "";

  const handleVoice = () => {
    if (playing) {
      window.speechSynthesis?.cancel();
      setPlaying(false);
    } else {
      speak(buildNarration(route));
      setPlaying(true);
      // Reset state when speech ends
      const check = setInterval(() => {
        if (!window.speechSynthesis?.speaking) { setPlaying(false); clearInterval(check); }
      }, 500);
    }
  };

  return (
    <View style={styles.container}>
      {/* Leaflet map */}
      {mapSrc ? React.createElement("iframe", {
        src: mapSrc,
        style: { border: "none", width: "100%", height: 340 },
        title: "Route Map",
      }) : <View style={styles.mapPlaceholder}><Text style={styles.mapLabel}>Loading map…</Text></View>}

      <ScrollView style={styles.panel} contentContainerStyle={styles.panelContent}>
        <Text style={styles.title}>{route.title}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.chip}>{route.estimatedSteps?.toLocaleString()} steps</Text>
          <Text style={styles.chip}>{route.estimatedDurationMinutes} min</Text>
          <Text style={styles.chip}>{route.difficultyLevel}</Text>
          <Text style={styles.chip}>{route.stops?.length} stops</Text>
        </View>

        <Text style={styles.description}>{route.description}</Text>

        {/* Voice guide */}
        <TouchableOpacity style={[styles.voiceButton, playing && styles.voiceButtonActive]} onPress={handleVoice}>
          <Text style={styles.voiceButtonText}>{playing ? "⏹ Stop Guide" : "▶ Audio Guide"}</Text>
        </TouchableOpacity>

        {/* Stop list */}
        {(route.stops ?? []).map((stop: any, i: number) => (
          <TouchableOpacity
            key={stop.order}
            style={styles.stopRow}
            onPress={() => router.push(`/building/${stop.building.id}`)}
          >
            <View style={styles.stopNumber}><Text style={styles.stopNumberText}>{i + 1}</Text></View>
            <View style={styles.stopInfo}>
              <Text style={styles.stopName}>{stop.building.name}</Text>
              <Text style={styles.stopDesc} numberOfLines={2}>{stop.narrativeText ?? stop.building.shortDescription}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back to Explore</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f0f" },
  mapPlaceholder: { height: 340, backgroundColor: "#161616", alignItems: "center", justifyContent: "center" },
  mapLabel: { color: "#555", fontSize: 13 },
  panel: { flex: 1, backgroundColor: "#0f0f0f" },
  panelContent: { padding: 20, gap: 12 },
  center: { flex: 1, backgroundColor: "#0f0f0f", alignItems: "center", justifyContent: "center" },
  muted: { color: "#555" },
  title: { fontSize: 20, fontWeight: "800", color: "#f0ece4" },
  metaRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: { fontSize: 11, color: "#d4a853", borderWidth: 1, borderColor: "#d4a853", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  description: { fontSize: 13, color: "#666", lineHeight: 20 },
  voiceButton: { borderWidth: 1, borderColor: "#d4a853", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  voiceButtonActive: { backgroundColor: "#d4a853" },
  voiceButtonText: { color: "#d4a853", fontWeight: "700", fontSize: 15 },
  stopRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  stopNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#d4a853", alignItems: "center", justifyContent: "center", marginTop: 2 },
  stopNumberText: { color: "#0f0f0f", fontSize: 12, fontWeight: "700" },
  stopInfo: { flex: 1 },
  stopName: { fontSize: 14, fontWeight: "600", color: "#f0ece4" },
  stopDesc: { fontSize: 12, color: "#666", marginTop: 2 },
  backButton: { alignItems: "center", paddingVertical: 8, marginTop: 8 },
  backText: { color: "#555", fontSize: 13 },
});

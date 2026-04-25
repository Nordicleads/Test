import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, Dimensions, Linking,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../src/services/api";
import { openInMaps } from "../../src/services/maps";
import { useArchive } from "../../src/hooks/useArchive";
import { CATEGORY_LABELS, ERA_LABELS } from "@wandr/shared";
import type { BuildingCategory, BuildingEra, ArchiveRecord } from "@wandr/shared";

const { width } = Dimensions.get("window");

export default function BuildingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: building, isLoading } = useQuery({
    queryKey: ["building", id],
    queryFn: () => api.buildings.get(id!),
    enabled: !!id,
  });
  const { data: archiveRecords } = useArchive(id);

  if (isLoading || !building) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Loading…</Text>
      </View>
    );
  }

  const currentImages = (building.images ?? []).filter((i: any) => !i.is_historical);
  const historicalImages = (building.images ?? []).filter((i: any) => i.is_historical);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header image */}
      {currentImages.length > 0 ? (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.imageScroll}
        >
          {currentImages.map((img: any) => (
            <Image key={img.id} source={{ uri: img.url }} style={styles.heroImage} />
          ))}
        </ScrollView>
      ) : (
        <View style={[styles.heroImage, styles.heroPlaceholder]} />
      )}

      {/* Back button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>

      <View style={styles.body}>
        {/* City label */}
        <Text style={styles.cityLabel}>{building.city?.toUpperCase()}</Text>

        {/* Name */}
        <Text style={styles.name}>{building.name}</Text>

        {/* Architect + year */}
        {(building.architect || building.year_completed) && (
          <Text style={styles.meta}>
            {[building.architect, building.year_completed].filter(Boolean).join(" · ")}
          </Text>
        )}

        {/* Category chips */}
        <View style={styles.chips}>
          {(building.categories ?? []).map((cat: BuildingCategory) => (
            <Text key={cat} style={styles.chip}>{CATEGORY_LABELS[cat]}</Text>
          ))}
          {building.era && (
            <Text style={styles.chip}>{ERA_LABELS[building.era as BuildingEra]}</Text>
          )}
        </View>

        {/* Description */}
        <Text style={styles.description}>{building.description}</Text>

        {/* CTA row */}
        <View style={styles.ctaRow}>
          <TouchableOpacity
            style={[styles.navButton, styles.ctaFlex]}
            onPress={() =>
              openInMaps({
                lat: building.lat,
                lng: building.lng,
                name: building.name,
                address: building.address,
              })
            }
          >
            <Text style={styles.navButtonText}>Navigate Here</Text>
          </TouchableOpacity>

          {(building.images ?? []).some((i: any) => i.is_historical) && (
            <TouchableOpacity
              style={styles.arButton}
              onPress={() => router.push(`/building/ar?id=${building.id}`)}
            >
              <Text style={styles.arButtonText}>AR</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Historical images */}
        {historicalImages.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Historical Views</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.histScroll}
            >
              {historicalImages.map((img: any) => (
                <View key={img.id} style={styles.histCard}>
                  <Image source={{ uri: img.url }} style={styles.histImage} />
                  {img.year && <Text style={styles.histYear}>{img.year}</Text>}
                </View>
              ))}
            </ScrollView>
          </>
        )}

        {/* Historical records */}
        {(building.historical_records ?? []).length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Archive Records</Text>
            {building.historical_records.map((r: any) => (
              <View key={r.id} style={styles.recordCard}>
                <Text style={styles.recordTitle}>{r.title}</Text>
                {r.year && <Text style={styles.recordYear}>{r.year}</Text>}
                <Text style={styles.recordBody}>{r.description}</Text>
              </View>
            ))}
          </>
        )}

        {/* Planinnsyn planning documents */}
        {archiveRecords && archiveRecords.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Planning Documents</Text>
            {archiveRecords.map((r: ArchiveRecord) => (
              <TouchableOpacity
                key={r.id}
                style={styles.recordCard}
                onPress={() => r.documentUrl ? Linking.openURL(r.documentUrl) : undefined}
                disabled={!r.documentUrl}
              >
                <View style={styles.recordHeader}>
                  <Text style={styles.recordTitle}>{r.title}</Text>
                  {(r.isFloorPlan || r.isConstructionDrawing) && (
                    <Text style={styles.recordBadge}>
                      {r.isFloorPlan ? "Floor Plan" : "Drawing"}
                    </Text>
                  )}
                </View>
                {r.year && <Text style={styles.recordYear}>{r.year}</Text>}
                <Text style={styles.recordBody}>{r.description}</Text>
                {r.documentUrl && (
                  <Text style={styles.recordLink}>View document →</Text>
                )}
              </TouchableOpacity>
            ))}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f0f" },
  content: { paddingBottom: 60 },
  center: { flex: 1, backgroundColor: "#0f0f0f", alignItems: "center", justifyContent: "center" },
  muted: { color: "#555" },

  imageScroll: { height: 280 },
  heroImage: { width, height: 280 },
  heroPlaceholder: { backgroundColor: "#1a1a1a" },

  backButton: {
    position: "absolute",
    top: 52,
    left: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  backArrow: { color: "#fff", fontSize: 20 },

  body: { padding: 24, gap: 12 },
  cityLabel: { fontSize: 10, color: "#d4a853", letterSpacing: 3, fontWeight: "600" },
  name: { fontSize: 26, fontWeight: "800", color: "#f0ece4", lineHeight: 32 },
  meta: { fontSize: 13, color: "#888" },

  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    fontSize: 11,
    color: "#d4a853",
    borderWidth: 1,
    borderColor: "#d4a853",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  description: { fontSize: 15, color: "#b0a898", lineHeight: 24, marginTop: 4 },

  ctaRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  ctaFlex: { flex: 1 },
  navButton: {
    backgroundColor: "#d4a853",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  navButtonText: { color: "#0f0f0f", fontWeight: "700", fontSize: 15, letterSpacing: 0.5 },
  arButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#d4a853",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  arButtonText: { color: "#d4a853", fontWeight: "700", fontSize: 13, letterSpacing: 1 },

  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#f0ece4", marginTop: 16, letterSpacing: 1 },

  histScroll: { marginHorizontal: -24 },
  histCard: { marginLeft: 24, marginRight: 8 },
  histImage: { width: 200, height: 140, borderRadius: 8, backgroundColor: "#1a1a1a" },
  histYear: { fontSize: 11, color: "#555", marginTop: 4 },

  recordCard: {
    backgroundColor: "#161616",
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  recordHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  recordTitle: { fontSize: 14, fontWeight: "600", color: "#f0ece4", flex: 1 },
  recordBadge: { fontSize: 10, color: "#0f0f0f", backgroundColor: "#d4a853", borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, fontWeight: "700" },
  recordYear: { fontSize: 11, color: "#d4a853" },
  recordBody: { fontSize: 13, color: "#888", lineHeight: 20 },
  recordLink: { fontSize: 12, color: "#d4a853", marginTop: 4 },
});

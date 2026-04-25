import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { CATEGORY_LABELS } from "@wandr/shared";
import type { BuildingCategory } from "@wandr/shared";

interface NearbyBuilding {
  id: string;
  name: string;
  short_description: string;
  categories: BuildingCategory[];
  city: string;
  distance_meters: number;
  images?: { url: string }[];
}

interface Props {
  building: NearbyBuilding;
}

export function BuildingCard({ building }: Props) {
  const router = useRouter();
  const imageUrl = building.images?.[0]?.url;
  const distanceText =
    building.distance_meters < 1000
      ? `${Math.round(building.distance_meters)} m`
      : `${(building.distance_meters / 1000).toFixed(1)} km`;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => router.push(`/building/${building.id}`)}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]} />
      )}
      <View style={styles.body}>
        <Text style={styles.distance}>{distanceText}</Text>
        <Text style={styles.name} numberOfLines={2}>{building.name}</Text>
        {building.categories[0] && (
          <Text style={styles.category}>{CATEGORY_LABELS[building.categories[0]]}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 160,
    backgroundColor: "#161616",
    borderRadius: 14,
    overflow: "hidden",
    marginRight: 12,
  },
  image: { width: "100%", height: 110 },
  imagePlaceholder: { backgroundColor: "#222" },
  body: { padding: 10, gap: 3 },
  distance: { fontSize: 10, color: "#d4a853", fontWeight: "600" },
  name: { fontSize: 13, fontWeight: "700", color: "#f0ece4", lineHeight: 17 },
  category: { fontSize: 10, color: "#555" },
});

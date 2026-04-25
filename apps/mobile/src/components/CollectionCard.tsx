import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import type { CollectionSummary } from "@wandr/shared";

interface Props {
  collection: CollectionSummary;
  onPress: () => void;
}

export function CollectionCard({ collection, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {collection.coverImageUrl ? (
        <Image source={{ uri: collection.coverImageUrl }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]} />
      )}
      <View style={styles.body}>
        <Text style={styles.theme}>{collection.theme.toUpperCase()}</Text>
        <Text style={styles.title} numberOfLines={2}>{collection.title}</Text>
        <Text style={styles.count}>{collection.routeCount} routes</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 180,
    backgroundColor: "#161616",
    borderRadius: 14,
    overflow: "hidden",
    marginRight: 12,
  },
  image: { width: "100%", height: 120 },
  imagePlaceholder: { backgroundColor: "#222" },
  body: { padding: 12, gap: 4 },
  theme: { fontSize: 9, color: "#d4a853", letterSpacing: 2, fontWeight: "700" },
  title: { fontSize: 14, fontWeight: "700", color: "#f0ece4", lineHeight: 19 },
  count: { fontSize: 11, color: "#555" },
});

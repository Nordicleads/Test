import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import type { Route } from "@wandr/shared";
import { CATEGORY_LABELS } from "@wandr/shared";

interface Props {
  route: Route;
}

export function RouteCard({ route }: Props) {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => router.push(`/route/${route.id}`)}
    >
      {route.coverImageUrl ? (
        <Image source={{ uri: route.coverImageUrl }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]} />
      )}

      <View style={styles.body}>
        <Text style={styles.city}>{route.city.toUpperCase()}</Text>
        <Text style={styles.title} numberOfLines={2}>{route.title}</Text>

        <View style={styles.tags}>
          {route.categories.slice(0, 2).map((cat) => (
            <Text key={cat} style={styles.tag}>{CATEGORY_LABELS[cat]}</Text>
          ))}
        </View>

        <View style={styles.stats}>
          <Text style={styles.stat}>{route.estimatedSteps?.toLocaleString()} steps</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.stat}>{route.estimatedDurationMinutes} min</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.stat}>{route.stops?.length ?? 0} stops</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#161616",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
  },
  image: { width: "100%", height: 180 },
  imagePlaceholder: { backgroundColor: "#222" },
  body: { padding: 16, gap: 6 },
  city: { fontSize: 10, color: "#d4a853", letterSpacing: 2, fontWeight: "600" },
  title: { fontSize: 18, fontWeight: "700", color: "#f0ece4", lineHeight: 24 },
  tags: { flexDirection: "row", gap: 6, flexWrap: "wrap", marginTop: 2 },
  tag: { fontSize: 11, color: "#888", borderWidth: 1, borderColor: "#333", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  stats: { flexDirection: "row", gap: 6, alignItems: "center", marginTop: 4 },
  stat: { fontSize: 12, color: "#666" },
  dot: { fontSize: 12, color: "#444" },
});

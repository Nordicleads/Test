import { FlatList, View, Text, StyleSheet } from "react-native";
import type { WalkLog } from "@wandr/shared";

function formatDate(iso: string): string {
  const d = new Date(iso);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

interface Props {
  walks: WalkLog[];
}

export function WalkHistoryList({ walks }: Props) {
  return (
    <FlatList
      data={walks}
      keyExtractor={(w) => w.id}
      scrollEnabled={false}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <View style={styles.left}>
            <Text style={styles.date}>{formatDate(item.completedAt)}</Text>
            <Text style={styles.steps}>{item.stepsActual.toLocaleString()} steps</Text>
          </View>
          <View style={styles.right}>
            <Text style={styles.duration}>{item.durationMinutesActual} min</Text>
            {item.caloriesEstimated != null && (
              <Text style={styles.cal}>{item.caloriesEstimated} kcal</Text>
            )}
          </View>
        </View>
      )}
      ItemSeparatorComponent={() => <View style={styles.sep} />}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12 },
  left: { gap: 2 },
  right: { alignItems: "flex-end", gap: 2 },
  date: { fontSize: 12, color: "#555" },
  steps: { fontSize: 16, fontWeight: "700", color: "#f0ece4" },
  duration: { fontSize: 13, color: "#888" },
  cal: { fontSize: 12, color: "#d4a853" },
  sep: { height: 1, backgroundColor: "#1a1a1a" },
});

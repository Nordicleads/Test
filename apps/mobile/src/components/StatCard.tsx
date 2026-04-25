import { View, Text, StyleSheet } from "react-native";

interface Props {
  label: string;
  value: string;
  unit?: string;
}

export function StatCard({ label, value, unit }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label.toUpperCase()}</Text>
      <Text style={styles.value}>{value}</Text>
      {unit && <Text style={styles.unit}>{unit}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "#161616",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    gap: 4,
  },
  label: { fontSize: 10, color: "#555", letterSpacing: 2, fontWeight: "600" },
  value: { fontSize: 24, fontWeight: "800", color: "#f0ece4" },
  unit: { fontSize: 11, color: "#888" },
});

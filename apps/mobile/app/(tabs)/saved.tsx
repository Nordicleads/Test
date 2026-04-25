import { View, Text, StyleSheet } from "react-native";

export default function SavedScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Saved Routes</Text>
      <Text style={styles.muted}>Downloaded routes appear here for offline use.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f0f", padding: 24, paddingTop: 72 },
  label: { fontSize: 22, fontWeight: "700", color: "#f0ece4" },
  muted: { color: "#555", marginTop: 8, fontSize: 14 },
});

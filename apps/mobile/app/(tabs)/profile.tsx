import { View, Text, StyleSheet } from "react-native";

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Your Walks</Text>
      <Text style={styles.muted}>Steps, routes completed, and health data will appear here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f0f", padding: 24, paddingTop: 72 },
  label: { fontSize: 22, fontWeight: "700", color: "#f0ece4" },
  muted: { color: "#555", marginTop: 8, fontSize: 14 },
});

import { View, Text, StyleSheet } from "react-native";

interface Props {
  usedBytes: number;
  totalBytes?: number;
}

function formatMB(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return mb < 1 ? `${Math.round(bytes / 1024)} KB` : `${mb.toFixed(1)} MB`;
}

export function StorageBar({ usedBytes, totalBytes = 2 * 1024 * 1024 * 1024 }: Props) {
  const percent = Math.min((usedBytes / totalBytes) * 100, 100);

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%` as any }]} />
      </View>
      <Text style={styles.label}>{formatMB(usedBytes)} used</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  track: { height: 4, backgroundColor: "#333", borderRadius: 2, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: "#d4a853", borderRadius: 2 },
  label: { fontSize: 11, color: "#555" },
});

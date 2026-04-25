import { TouchableOpacity, Text, StyleSheet, Alert, View } from "react-native";
import { useOfflineBundles } from "../hooks/useOfflineBundles";

interface Props {
  routeId: string;
  title: string;
}

export function DownloadButton({ routeId, title }: Props) {
  const { isDownloaded, download, remove, progress } = useOfflineBundles();
  const p = progress[routeId];
  const downloaded = isDownloaded(routeId);

  const handlePress = () => {
    if (downloaded) {
      Alert.alert("Remove offline route?", `"${title}" will be deleted from your device.`, [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: () => remove(routeId) },
      ]);
    } else {
      download(routeId).catch(() => Alert.alert("Download failed", "Check your connection and try again."));
    }
  };

  if (p?.status === "downloading") {
    return (
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${p.percent}%` as any }]} />
        <Text style={styles.progressText}>{p.percent}%</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.btn, downloaded && styles.btnDone]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Text style={[styles.label, downloaded && styles.labelDone]}>
        {downloaded ? "✓ Saved offline" : "↓ Save offline"}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderWidth: 1,
    borderColor: "#d4a853",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  btnDone: { backgroundColor: "#d4a85322" },
  label: { fontSize: 12, color: "#d4a853", fontWeight: "600" },
  labelDone: { color: "#d4a853" },
  progressContainer: {
    height: 28,
    backgroundColor: "#222",
    borderRadius: 20,
    overflow: "hidden",
    justifyContent: "center",
    paddingHorizontal: 12,
    minWidth: 100,
  },
  progressBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#d4a85344",
  },
  progressText: { fontSize: 12, color: "#d4a853", fontWeight: "600" },
});

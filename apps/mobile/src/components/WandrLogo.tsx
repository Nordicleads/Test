import { View, Text, StyleSheet } from "react-native";

// Fixed Oslo coordinate — textural/aesthetic, not dynamic yet
const OSLO_COORD = "59.9139° N  ·  10.7522° E";

export function WandrLogo() {
  return (
    <View style={styles.container}>
      {/* Ghost coordinate — barely visible, creates depth and authenticity */}
      <Text style={styles.coord}>{OSLO_COORD}</Text>

      {/* Route path mark: ○ ─── ● ─── ○ */}
      <View style={styles.pathRow}>
        <View style={styles.nodeOuter} />
        <View style={styles.pathLine} />
        <View style={styles.nodeCenter}>
          <View style={styles.nodeCenterFill} />
        </View>
        <View style={styles.pathLine} />
        <View style={styles.nodeOuter} />
      </View>

      {/* Wordmark */}
      <Text style={styles.wordmark}>WANDR</Text>

      {/* Tagline */}
      <Text style={styles.tagline}>Cultural walks, curated.</Text>
    </View>
  );
}

const GOLD = "#d4a853";
const CREAM = "#f2ece2";

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },

  coord: {
    fontSize: 9,
    color: "#2c2c2c",
    letterSpacing: 2.5,
    fontWeight: "500",
  },

  pathRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
  },
  nodeOuter: {
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#333",
  },
  pathLine: {
    width: 28,
    height: 1,
    backgroundColor: "#282828",
  },
  nodeCenter: {
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
  },
  nodeCenterFill: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: GOLD,
  },

  wordmark: {
    fontSize: 34,
    fontWeight: "800",
    color: CREAM,
    letterSpacing: 9,
    // Negative margin to compensate for trailing letterSpacing
    marginBottom: -2,
  },

  tagline: {
    fontSize: 11,
    color: "#555",
    letterSpacing: 1.5,
    fontWeight: "400",
  },
});

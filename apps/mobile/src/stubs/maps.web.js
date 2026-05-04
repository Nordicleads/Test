import React from "react";
import { View, Text } from "react-native";

const MapView = ({ style, children }) =>
  React.createElement(
    View,
    { style: [{ backgroundColor: "#1a1a1a", alignItems: "center", justifyContent: "center" }, style] },
    React.createElement(Text, { style: { color: "#555", fontSize: 12 } }, "Map view (mobile only)"),
    children
  );

MapView.Animated = MapView;

export default MapView;
export const Marker = () => null;
export const Polyline = () => null;
export const PROVIDER_GOOGLE = "google";
export const PROVIDER_DEFAULT = null;

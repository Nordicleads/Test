import { Linking, Platform } from "react-native";

interface Location {
  lat: number;
  lng: number;
  name?: string;
  address?: string;
}

export function openInMaps(destination: Location) {
  const label = encodeURIComponent(destination.name ?? destination.address ?? "Destination");
  const { lat, lng } = destination;

  if (Platform.OS === "ios") {
    // Try Apple Maps first
    Linking.openURL(`maps://?daddr=${lat},${lng}&dirflg=w`);
  } else {
    // Google Maps on Android
    Linking.openURL(`google.navigation:q=${lat},${lng}&mode=w`);
  }
}

export function openFullRouteInMaps(stops: Location[]) {
  if (stops.length === 0) return;

  if (Platform.OS === "ios") {
    const waypoints = stops
      .map((s) => `saddr=${s.lat},${s.lng}`)
      .join("&");
    Linking.openURL(`maps://?${waypoints}&dirflg=w`);
  } else {
    const destination = stops[stops.length - 1];
    const waypoints = stops
      .slice(0, -1)
      .map((s) => `${s.lat},${s.lng}`)
      .join("|");
    const base = `https://www.google.com/maps/dir/?api=1`;
    const dest = `&destination=${destination.lat},${destination.lng}`;
    const wp = waypoints ? `&waypoints=${encodeURIComponent(waypoints)}` : "";
    Linking.openURL(`${base}${dest}${wp}&travelmode=walking`);
  }
}

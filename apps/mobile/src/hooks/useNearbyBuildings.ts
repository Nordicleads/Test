import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import * as Location from "expo-location";
import { api } from "../services/api";

export function useNearbyBuildings(enabled: boolean) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!enabled) return;
    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      if (status !== "granted") return;
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).then((loc) => {
        setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      });
    });
  }, [enabled]);

  return useQuery({
    queryKey: ["nearby-buildings", coords],
    queryFn: () => api.buildings.nearby(coords!.lat, coords!.lng, 800),
    enabled: enabled && coords !== null,
  });
}

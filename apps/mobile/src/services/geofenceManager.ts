import * as Location from "expo-location";
import { GEOFENCE_TASK_NAME } from "../tasks/geofenceTask";
import type { RouteStop } from "@wandr/shared";

export async function startGeofencing(stops: RouteStop[]): Promise<void> {
  const { status } = await Location.requestBackgroundPermissionsAsync();
  if (status !== "granted") return;

  const regions = stops.map((stop) => ({
    identifier: String(stop.order),
    latitude: stop.building.coordinates.lat,
    longitude: stop.building.coordinates.lng,
    radius: stop.arrivalTriggerRadiusMeters,
    notifyOnEnter: true,
    notifyOnExit: false,
  }));

  await Location.startGeofencingAsync(GEOFENCE_TASK_NAME, regions);
}

export async function stopGeofencing(): Promise<void> {
  const active = await Location.hasStartedGeofencingAsync(GEOFENCE_TASK_NAME);
  if (active) await Location.stopGeofencingAsync(GEOFENCE_TASK_NAME);
}

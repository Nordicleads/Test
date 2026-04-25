import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";
import type { GeofenceEvent } from "@wandr/shared";

export const GEOFENCE_TASK_NAME = "WANDR_GEOFENCE_TASK";

type GeofenceCallback = (event: GeofenceEvent) => void;

let _onEnter: GeofenceCallback | null = null;

export function defineGeofenceTask(onEnter: GeofenceCallback): void {
  _onEnter = onEnter;
  if (!TaskManager.isTaskDefined(GEOFENCE_TASK_NAME)) {
    TaskManager.defineTask(GEOFENCE_TASK_NAME, async ({ data, error }: any) => {
      if (error || !data) return;
      const { eventType, region } = data;
      if (eventType === Location.GeofencingEventType.Enter && _onEnter) {
        const stopOrder = parseInt(region.identifier, 10);
        _onEnter({
          stopOrder,
          buildingId: region.identifier,
          buildingName: region.identifier,
        });
      }
    });
  }
}

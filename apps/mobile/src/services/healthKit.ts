// Phase 2: console fallback. Real HealthKit/Health Connect bridge in Layer 3.

export async function requestPermissions(): Promise<boolean> {
  console.log("[HealthKit] requestPermissions called — simulator fallback");
  return true;
}

export async function logWalk(
  steps: number,
  distanceMeters: number,
  start: Date,
  end: Date
): Promise<void> {
  console.log("[HealthKit] logWalk", { steps, distanceMeters, start, end });
}

import { query } from "../db/client.js";
import type { BuildingCategory, BuildingEra } from "@wandr/shared";

const STEP_LENGTH_METERS = 0.762;
const WALKING_SPEED_M_PER_MIN = 83.3;
const DWELL_TIME_MINUTES = 10;
const NARRATIVE_PLACEHOLDER = "Audio guide content will be loaded from the archive.";
const OSRM_BASE = "https://router.project-osrm.org/route/v1/walking";

export interface GenerateRouteInput {
  lat: number;
  lng: number;
  radiusMeters?: number;
  categories?: BuildingCategory[];
  eras?: BuildingEra[];
  stepGoal?: number;
  maxStops?: number;
  stepFreeOnly?: boolean;
  maxGradientPercent?: number;
}

interface CandidateBuilding {
  id: string;
  name: string;
  short_description: string;
  architect: string | null;
  year_completed: number | null;
  address: string;
  city: string;
  categories: BuildingCategory[];
  era: BuildingEra | null;
  audio_guide_url: string | null;
  is_step_free: boolean;
  max_gradient_percent: number | null;
  surface_type: string | null;
  lat: number;
  lng: number;
  distance_from_origin: number;
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface OsrmResult {
  distanceMeters: number;
  durationSeconds: number;
  polyline: { lat: number; lng: number }[];
}

// Fetch a real walking route from OSRM. Falls back gracefully on timeout or error.
async function fetchWalkingRoute(
  waypoints: { lat: number; lng: number }[]
): Promise<OsrmResult | null> {
  if (waypoints.length < 2) return null;
  // OSRM coords are lng,lat order
  const coords = waypoints.map((p) => `${p.lng},${p.lat}`).join(";");
  const url = `${OSRM_BASE}/${coords}?overview=full&geometries=geojson`;
  try {
    const resp = await fetch(url, {
      signal: AbortSignal.timeout(6_000),
      headers: { "User-Agent": "WANDR-App/1.0" },
    });
    if (!resp.ok) return null;
    const data = (await resp.json()) as any;
    if (data.code !== "Ok" || !data.routes?.[0]) return null;
    const route = data.routes[0];
    // GeoJSON coordinates are [lng, lat] — flip to {lat, lng}
    const polyline = (route.geometry.coordinates as [number, number][]).map(
      ([lng, lat]) => ({ lat, lng })
    );
    return {
      distanceMeters: Math.round(route.distance),
      durationSeconds: Math.round(route.duration),
      polyline,
    };
  } catch {
    return null;
  }
}

// Spread-to-target: each step picks the building whose distance from the current
// position is closest to (remainingTargetMeters / remainingSlots). This distributes
// walking distance evenly toward the step goal instead of always picking the nearest.
function spreadToTarget(
  origin: { lat: number; lng: number },
  candidates: CandidateBuilding[],
  targetMeters: number,
  maxStops: number
): CandidateBuilding[] {
  if (candidates.length === 0) return [];
  const cap = Math.min(maxStops, candidates.length);

  const selected: CandidateBuilding[] = [];
  const remaining = [...candidates];
  let currentLat = origin.lat;
  let currentLng = origin.lng;
  let remainingMeters = targetMeters;

  while (remaining.length > 0 && selected.length < cap) {
    const slotsLeft = cap - selected.length;
    // Ideal walking distance for this leg
    const legTarget = remainingMeters / slotsLeft;

    let bestIdx = 0;
    let bestScore = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      // Straight-line × 1.35 approximates actual street walking distance
      const walkDist = haversine(currentLat, currentLng, remaining[i].lat, remaining[i].lng) * 1.35;
      const score = Math.abs(walkDist - legTarget);
      if (score < bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }

    const next = remaining.splice(bestIdx, 1)[0];
    const walkDist = haversine(currentLat, currentLng, next.lat, next.lng) * 1.35;
    remainingMeters = Math.max(0, remainingMeters - walkDist);
    selected.push(next);
    currentLat = next.lat;
    currentLng = next.lng;
  }

  return selected;
}

function metricsFromStops(
  origin: { lat: number; lng: number },
  stops: CandidateBuilding[]
): { distanceMeters: number; estimatedSteps: number; estimatedDurationMinutes: number } {
  let distanceMeters = 0;
  let prev = origin;

  for (const stop of stops) {
    distanceMeters += haversine(prev.lat, prev.lng, stop.lat, stop.lng) * 1.35;
    prev = stop;
  }

  const estimatedSteps = Math.round(distanceMeters / STEP_LENGTH_METERS);
  const walkingMinutes = distanceMeters / WALKING_SPEED_M_PER_MIN;
  const estimatedDurationMinutes = Math.round(walkingMinutes + stops.length * DWELL_TIME_MINUTES);

  return { distanceMeters: Math.round(distanceMeters), estimatedSteps, estimatedDurationMinutes };
}

function difficultyFrom(steps: number): "easy" | "moderate" | "challenging" {
  if (steps < 8_000) return "easy";
  if (steps < 14_000) return "moderate";
  return "challenging";
}

// Auto-compute maxStops from step goal if not supplied
function defaultStops(stepGoal: number): number {
  if (stepGoal <= 5_000) return 3;
  if (stepGoal <= 10_000) return 5;
  if (stepGoal <= 15_000) return 7;
  return 10;
}

export async function generateRoute(input: GenerateRouteInput) {
  const {
    lat,
    lng,
    radiusMeters = 2_000,
    categories = [],
    eras = [],
    stepGoal = 10_000,
    maxStops,
    stepFreeOnly = false,
    maxGradientPercent,
  } = input;

  const stops = maxStops ?? defaultStops(stepGoal);

  // Expand search radius so we can find buildings far enough apart to hit the step goal.
  // Target walking distance = stepGoal × step_length. We need a radius that covers
  // at least ~65% of that distance in straight-line terms.
  const targetMeters = stepGoal * STEP_LENGTH_METERS;
  const effectiveRadius = Math.max(radiusMeters, targetMeters * 0.65);

  const categoryCondition =
    categories.length > 0 ? "AND b.categories && $5::building_category[]" : "";
  const eraCondition = eras.length > 0 ? "AND b.era = ANY($6::building_era[])" : "";
  const stepFreeCondition = stepFreeOnly ? "AND b.is_step_free = true" : "";
  const gradientCondition =
    maxGradientPercent !== undefined
      ? `AND (b.max_gradient_percent IS NULL OR b.max_gradient_percent <= ${maxGradientPercent})`
      : "";

  // Fetch enough candidates: at least stops×5 so the spread algorithm has real choice
  const candidateLimit = Math.max(stops * 6, 30);
  const params: unknown[] = [lat, lng, effectiveRadius, candidateLimit];
  if (categories.length) params.push(`{${categories.join(",")}}`);
  if (eras.length) params.push(`{${eras.join(",")}}`);

  const candidates = await query<CandidateBuilding>(
    `SELECT
       b.id, b.name, b.short_description, b.architect, b.year_completed,
       b.address, b.city, b.categories, b.era, b.audio_guide_url,
       b.is_step_free, b.max_gradient_percent, b.surface_type,
       b.lat, b.lng,
       (6371000 * acos(LEAST(1.0, cos(radians($1)) * cos(radians(b.lat)) * cos(radians(b.lng) - radians($2)) + sin(radians($1)) * sin(radians(b.lat))))) AS distance_from_origin
     FROM buildings b
     WHERE b.is_verified = true
       AND b.lat BETWEEN $1 - $3 / 111320.0 AND $1 + $3 / 111320.0
       AND b.lng BETWEEN $2 - $3 / (111320.0 * cos(radians($1))) AND $2 + $3 / (111320.0 * cos(radians($1)))
       ${categoryCondition}
       ${eraCondition}
       ${stepFreeCondition}
       ${gradientCondition}
     ORDER BY distance_from_origin
     LIMIT $4`,
    params
  );

  if (candidates.length === 0) return null;

  const selected = spreadToTarget({ lat, lng }, candidates, targetMeters, stops);

  // Fetch the real walking path from OSRM. Falls back to haversine on failure.
  const waypoints = [{ lat, lng }, ...selected.map((b) => ({ lat: b.lat, lng: b.lng }))];
  const osrm = await fetchWalkingRoute(waypoints);

  let distanceMeters: number;
  let estimatedSteps: number;
  let estimatedDurationMinutes: number;
  let walkingPolyline: { lat: number; lng: number }[] | undefined;

  if (osrm) {
    distanceMeters = osrm.distanceMeters;
    estimatedSteps = Math.round(osrm.distanceMeters / STEP_LENGTH_METERS);
    const walkingMinutes = osrm.durationSeconds / 60;
    estimatedDurationMinutes = Math.round(walkingMinutes + selected.length * DWELL_TIME_MINUTES);
    walkingPolyline = osrm.polyline;
  } else {
    const metrics = metricsFromStops({ lat, lng }, selected);
    distanceMeters = metrics.distanceMeters;
    estimatedSteps = metrics.estimatedSteps;
    estimatedDurationMinutes = metrics.estimatedDurationMinutes;
  }

  const allCategories = [...new Set(selected.flatMap((s) => s.categories))] as BuildingCategory[];
  const isStepFree = selected.every((s) => s.is_step_free);
  const maxGrad = selected.reduce(
    (max, s) =>
      s.max_gradient_percent !== null && s.max_gradient_percent > max
        ? s.max_gradient_percent
        : max,
    0
  );

  return {
    title: `${selected[0]?.city ?? "City"} Walk`,
    description: `A curated ${estimatedDurationMinutes}-minute walk through ${selected.length} architectural highlights.`,
    city: selected[0]?.city ?? "",
    country: "NO",
    categories: allCategories,
    distanceMeters,
    estimatedSteps,
    estimatedDurationMinutes,
    difficultyLevel: difficultyFrom(estimatedSteps),
    status: "draft" as const,
    tags: stepFreeOnly ? ["step-free"] : [],
    isStepFree,
    maxGradientPercent: maxGrad > 0 ? maxGrad : null,
    walkingPolyline,
    stops: selected.map((b, i) => ({
      order: i + 1,
      dwellTimeMinutes: DWELL_TIME_MINUTES,
      narrativeText: NARRATIVE_PLACEHOLDER,
      arrivalTriggerRadiusMeters: 50,
      building: {
        id: b.id,
        name: b.name,
        shortDescription: b.short_description,
        architect: b.architect,
        yearCompleted: b.year_completed,
        address: b.address,
        categories: b.categories,
        era: b.era,
        coordinates: { lat: b.lat, lng: b.lng },
        audioGuideUrl: b.audio_guide_url,
        isStepFree: b.is_step_free,
        surfaceType: b.surface_type,
      },
    })),
  };
}

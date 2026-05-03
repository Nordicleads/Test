import { query } from "../db/client.js";
import type { BuildingCategory, BuildingEra } from "@wandr/shared";

const STEP_LENGTH_METERS = 0.762;
const WALKING_SPEED_M_PER_MIN = 83.3; // 5 km/h
const DWELL_TIME_MINUTES = 10;
const NARRATIVE_PLACEHOLDER = "Audio guide content will be loaded from the archive.";

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

// Haversine distance in meters between two lat/lng points
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

// Greedy nearest-neighbour ordering — good enough for ≤50 stops, O(n²)
function nearestNeighbour(
  origin: { lat: number; lng: number },
  candidates: CandidateBuilding[],
  stepGoal: number,
  maxStops: number
): CandidateBuilding[] {
  const maxDistanceMeters = stepGoal * STEP_LENGTH_METERS;
  const ordered: CandidateBuilding[] = [];
  const remaining = [...candidates];
  let currentLat = origin.lat;
  let currentLng = origin.lng;
  let accumulatedMeters = 0;

  while (remaining.length > 0 && ordered.length < maxStops) {
    let nearestIdx = 0;
    let nearestDist = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const d = haversine(currentLat, currentLng, remaining[i].lat, remaining[i].lng);
      if (d < nearestDist) {
        nearestDist = d;
        nearestIdx = i;
      }
    }

    // Walking factor: straight-line * 1.35 approximates actual street distance
    const walkingDist = nearestDist * 1.35;
    if (accumulatedMeters + walkingDist > maxDistanceMeters && ordered.length >= 3) break;

    accumulatedMeters += walkingDist;
    const next = remaining.splice(nearestIdx, 1)[0];
    ordered.push(next);
    currentLat = next.lat;
    currentLng = next.lng;
  }

  return ordered;
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

export async function generateRoute(input: GenerateRouteInput) {
  const {
    lat,
    lng,
    radiusMeters = 2_000,
    categories = [],
    eras = [],
    stepGoal = 10_000,
    maxStops = 10,
    stepFreeOnly = false,
    maxGradientPercent,
  } = input;

  const categoryCondition =
    categories.length > 0 ? "AND b.categories && $5::building_category[]" : "";
  const eraCondition = eras.length > 0 ? "AND b.era = ANY($6::building_era[])" : "";
  const stepFreeCondition = stepFreeOnly ? "AND b.is_step_free = true" : "";
  const gradientCondition =
    maxGradientPercent !== undefined
      ? `AND (b.max_gradient_percent IS NULL OR b.max_gradient_percent <= ${maxGradientPercent})`
      : "";

  const params: unknown[] = [lat, lng, radiusMeters, maxStops * 4];
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

  const stops = nearestNeighbour({ lat, lng }, candidates, stepGoal, maxStops);
  const metrics = metricsFromStops({ lat, lng }, stops);

  const allCategories = [
    ...new Set(stops.flatMap((s) => s.categories)),
  ] as BuildingCategory[];

  const isStepFree = stops.every((s) => s.is_step_free);
  const maxGrad = stops.reduce(
    (max, s) => (s.max_gradient_percent !== null && s.max_gradient_percent > max ? s.max_gradient_percent : max),
    0
  );

  return {
    title: `${stops[0]?.city ?? "City"} Walk`,
    description: `A curated ${metrics.estimatedDurationMinutes}-minute walk through ${stops.length} architectural highlights.`,
    city: stops[0]?.city ?? "",
    country: "NO",
    categories: allCategories,
    distanceMeters: metrics.distanceMeters,
    estimatedSteps: metrics.estimatedSteps,
    estimatedDurationMinutes: metrics.estimatedDurationMinutes,
    difficultyLevel: difficultyFrom(metrics.estimatedSteps),
    status: "draft" as const,
    tags: stepFreeOnly ? ["step-free"] : [],
    isStepFree,
    maxGradientPercent: maxGrad > 0 ? maxGrad : null,
    stops: stops.map((b, i) => ({
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

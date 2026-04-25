import type { PitStop, PitStopType, Coordinates } from "@wandr/shared";

const PLACES_API_BASE = "https://places.googleapis.com/v1";
const API_KEY = process.env.GOOGLE_PLACES_API_KEY ?? "";

const TYPE_MAP: Record<string, PitStopType> = {
  cafe: "cafe",
  coffee_shop: "cafe",
  restaurant: "restaurant",
  bar: "restaurant",
  drinking_water: "water",
  water_fountain: "water",
  toilet: "restroom",
  viewpoint: "viewpoint",
};

interface PlacesResult {
  id: string;
  displayName: { text: string };
  location: { latitude: number; longitude: number };
  formattedAddress: string;
  primaryType: string;
}

interface NearbySearchResponse {
  places?: PlacesResult[];
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function classifyType(primaryType: string): PitStopType {
  return TYPE_MAP[primaryType] ?? "cafe";
}

export async function fetchPitStopsAlongRoute(
  stops: Array<{ order: number; lat: number; lng: number }>,
  radiusMeters = 150
): Promise<PitStop[]> {
  if (!API_KEY) {
    return mockPitStops(stops);
  }

  const pitStops: PitStop[] = [];
  const seen = new Set<string>();

  // Check midpoint between consecutive stops and at each stop
  const checkPoints = stops.map((s) => ({ ...s, insertAfter: s.order }));

  for (const point of checkPoints) {
    const body = {
      includedTypes: ["cafe", "coffee_shop", "restaurant"],
      maxResultCount: 3,
      locationRestriction: {
        circle: {
          center: { latitude: point.lat, longitude: point.lng },
          radius: radiusMeters,
        },
      },
    };

    const res = await fetch(`${PLACES_API_BASE}/places:searchNearby`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": API_KEY,
        "X-Goog-FieldMask": "places.id,places.displayName,places.location,places.formattedAddress,places.primaryType",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) continue;

    const data = (await res.json()) as NearbySearchResponse;
    for (const place of data.places ?? []) {
      if (seen.has(place.id)) continue;
      seen.add(place.id);
      pitStops.push({
        id: place.id,
        name: place.displayName.text,
        type: classifyType(place.primaryType ?? ""),
        coordinates: { lat: place.location.latitude, lng: place.location.longitude },
        address: place.formattedAddress,
        googlePlacesId: place.id,
        distanceFromRouteMeters: Math.round(
          haversine(point.lat, point.lng, place.location.latitude, place.location.longitude)
        ),
        insertAfterStopOrder: point.insertAfter,
      });
    }
  }

  return pitStops;
}

// Deterministic mock for development / missing API key
function mockPitStops(stops: Array<{ order: number; lat: number; lng: number }>): PitStop[] {
  if (stops.length < 2) return [];
  const mid = stops[Math.floor(stops.length / 2)];
  return [
    {
      id: "mock-cafe-1",
      name: "Fuglen Coffee",
      type: "cafe",
      coordinates: { lat: mid.lat + 0.0005, lng: mid.lng + 0.0003 },
      address: "Universitetsgata 2, Oslo",
      googlePlacesId: undefined,
      distanceFromRouteMeters: 60,
      insertAfterStopOrder: mid.order,
    },
  ];
}

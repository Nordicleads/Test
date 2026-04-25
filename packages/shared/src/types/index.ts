// ─── Enums ───────────────────────────────────────────────────────────────────

export type BuildingCategory =
  | "new_build"
  | "medieval"
  | "civic"
  | "transformation"
  | "under_construction"
  | "planned"
  | "landmark"
  | "religious"
  | "industrial_heritage"
  | "residential_heritage"
  | "unesco";

export type BuildingEra =
  | "ancient"        // pre-1000
  | "medieval"       // 1000–1500
  | "renaissance"    // 1500–1700
  | "baroque"        // 1700–1800
  | "neoclassical"   // 1800–1900
  | "modernist"      // 1900–1970
  | "postmodern"     // 1970–2000
  | "contemporary";  // 2000–present

export type RouteStatus = "draft" | "published" | "archived";

export type DataSource =
  | "kartverket"
  | "planinnsyn"
  | "unesco"
  | "google_places"
  | "city_archive"
  | "manual";

// ─── Coordinates ─────────────────────────────────────────────────────────────

export interface Coordinates {
  lat: number;
  lng: number;
}

// ─── Building ────────────────────────────────────────────────────────────────

export interface Building {
  id: string;
  name: string;
  nameLocal?: string;
  description: string;
  shortDescription: string;
  architect?: string;
  yearBuilt?: number;
  yearCompleted?: number;
  address: string;
  city: string;
  country: string;
  coordinates: Coordinates;
  categories: BuildingCategory[];
  era?: BuildingEra;
  sources: DataSource[];
  externalIds: {
    kartverket?: string;
    planinnsyn?: string;
    unesco?: string;
    googlePlaces?: string;
  };
  images: BuildingImage[];
  historicalRecords: HistoricalRecord[];
  audioGuideUrl?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Building Image ───────────────────────────────────────────────────────────

export interface BuildingImage {
  id: string;
  url: string;
  caption?: string;
  year?: number;
  isHistorical: boolean;
  credit?: string;
}

// ─── Historical Record ───────────────────────────────────────────────────────

export interface HistoricalRecord {
  id: string;
  buildingId: string;
  title: string;
  description: string;
  year?: number;
  documentUrl?: string;
  imageUrl?: string;
  source: DataSource;
}

// ─── Route Stop ──────────────────────────────────────────────────────────────

export interface RouteStop {
  id: string;
  routeId: string;
  building: Building;
  order: number;
  dwellTimeMinutes: number;
  narrativeText: string;
  arrivalTriggerRadiusMeters: number;
}

// ─── Route ───────────────────────────────────────────────────────────────────

export interface Route {
  id: string;
  title: string;
  description: string;
  city: string;
  country: string;
  coverImageUrl?: string;
  stops: RouteStop[];
  categories: BuildingCategory[];
  distanceMeters: number;
  estimatedSteps: number;
  estimatedDurationMinutes: number;
  difficultyLevel: "easy" | "moderate" | "challenging";
  status: RouteStatus;
  isOfflineAvailable: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Route Filters ───────────────────────────────────────────────────────────

export interface RouteFilters {
  city?: string;
  categories?: BuildingCategory[];
  eras?: BuildingEra[];
  minSteps?: number;
  maxSteps?: number;
  maxDurationMinutes?: number;
  tags?: string[];
}

// ─── Nearby Query ────────────────────────────────────────────────────────────

export interface NearbyQuery {
  coordinates: Coordinates;
  radiusMeters: number;
  categories?: BuildingCategory[];
  limit?: number;
}

// ─── Pit Stop ────────────────────────────────────────────────────────────────

export type PitStopType = "cafe" | "restaurant" | "water" | "restroom" | "viewpoint";

export interface PitStop {
  id: string;
  name: string;
  type: PitStopType;
  coordinates: Coordinates;
  address: string;
  googlePlacesId?: string;
  distanceFromRouteMeters: number;
  insertAfterStopOrder: number;
}

// ─── Offline Bundle ──────────────────────────────────────────────────────────

export interface OfflineBundle {
  routeId: string;
  downloadedAt: string;
  expiresAt: string;
  sizeBytes: number;
  route: Route;
  pitStops: PitStop[];
  audioFiles: string[];
  mapTileBounds: {
    north: number;
    south: number;
    east: number;
    west: number;
    minZoom: number;
    maxZoom: number;
  };
}

// ─── API Responses ───────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// ─── Walk Log (Track C) ──────────────────────────────────────────────────────

export interface WalkLogInput {
  routeId?: string;
  startedAt: string;
  completedAt: string;
  stepsActual: number;
  distanceMetersActual: number;
  durationMinutesActual: number;
  buildingsVisited: string[];
  caloriesEstimated?: number;
  deviceId?: string;
}

export interface WalkLog extends WalkLogInput {
  id: string;
  healthKitSynced: boolean;
  createdAt: string;
}

export interface WalkStats {
  totalRoutes: number;
  totalSteps: number;
  totalDistanceMeters: number;
  totalCalories: number;
}

// ─── Collection (Track D) ────────────────────────────────────────────────────

export type CollectionTheme =
  | "brutalist" | "modernist" | "waterfront" | "heritage"
  | "contemporary" | "civic" | "unesco" | "transformation";

export interface CollectionSummary {
  id: string;
  title: string;
  description: string;
  theme: CollectionTheme;
  coverImageUrl?: string;
  city?: string;
  routeCount: number;
}

export interface Collection extends CollectionSummary {
  routes: Route[];
}

// ─── Offline Store (Track A) ─────────────────────────────────────────────────

export interface OfflineBundleMeta {
  routeId: string;
  title: string;
  city: string;
  estimatedSteps: number;
  downloadedAt: string;
  expiresAt: string;
  sizeBytes: number;
}

export interface DownloadProgress {
  routeId: string;
  percent: number;
  status: "idle" | "downloading" | "done" | "error";
}

// ─── Voice Guide (Track B) ───────────────────────────────────────────────────

export interface VoiceGuideState {
  isActive: boolean;
  currentStopOrder: number;
  isPlaying: boolean;
  routeStops: RouteStop[];
}

export interface GeofenceEvent {
  stopOrder: number;
  buildingId: string;
  buildingName: string;
}

// ─── Archive (Layer 3) ───────────────────────────────────────────────────────

export interface ArchiveRecord {
  id: string;
  buildingId: string;
  title: string;
  description: string;
  year?: number;
  documentUrl?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  source: DataSource;
  planinnsynCaseId?: string;
  isFloorPlan: boolean;
  isConstructionDrawing: boolean;
}

// ─── Itinerary (Layer 3) ──────────────────────────────────────────────────────

export type ItineraryTheme = "architecture" | "heritage" | "modern" | "mixed";

export interface ItineraryDay {
  id: string;
  itineraryId: string;
  dayNumber: number;
  title: string;
  routeId?: string;
  route?: Route;
  notes?: string;
}

export interface ItinerarySummary {
  id: string;
  title: string;
  city: string;
  theme: ItineraryTheme;
  daysCount: number;
  createdAt: string;
}

export interface Itinerary extends ItinerarySummary {
  description?: string;
  days: ItineraryDay[];
}

export interface CreateItineraryInput {
  title: string;
  city: string;
  theme: ItineraryTheme;
  description?: string;
  routeIds: string[];
}

// ─── Accessibility (Layer 3) ─────────────────────────────────────────────────

export interface AccessibilityInfo {
  isStepFree: boolean;
  maxGradientPercent?: number;
  hasBenchesEveryNMeters?: number;
  surfaceType?: "paved" | "cobblestone" | "gravel" | "mixed";
  notes?: string;
}

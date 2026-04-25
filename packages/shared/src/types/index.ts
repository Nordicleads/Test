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

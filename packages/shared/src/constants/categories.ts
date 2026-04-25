import type { BuildingCategory, BuildingEra } from "../types/index.js";

export const CATEGORY_LABELS: Record<BuildingCategory, string> = {
  new_build: "New Build",
  medieval: "Medieval",
  civic: "Civic & Public",
  transformation: "Transformation",
  under_construction: "Under Construction",
  planned: "Planned",
  landmark: "Landmark",
  religious: "Religious",
  industrial_heritage: "Industrial Heritage",
  residential_heritage: "Residential Heritage",
  unesco: "UNESCO",
};

export const ERA_LABELS: Record<BuildingEra, string> = {
  ancient: "Ancient (pre-1000)",
  medieval: "Medieval (1000–1500)",
  renaissance: "Renaissance (1500–1700)",
  baroque: "Baroque (1700–1800)",
  neoclassical: "Neoclassical (1800–1900)",
  modernist: "Modernist (1900–1970)",
  postmodern: "Postmodern (1970–2000)",
  contemporary: "Contemporary (2000–present)",
};

export const FITNESS_STEP_GOALS = [5000, 10000, 15000, 20000] as const;

export const VOICE_GUIDE_TRIGGER_RADIUS_METERS = 50;

export const OFFLINE_BUNDLE_EXPIRY_DAYS = 30;

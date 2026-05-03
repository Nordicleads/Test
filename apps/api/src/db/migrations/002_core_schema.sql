CREATE TYPE building_category AS ENUM (
  'new_build', 'medieval', 'civic', 'transformation',
  'under_construction', 'planned', 'landmark', 'religious',
  'industrial_heritage', 'residential_heritage', 'unesco'
);

CREATE TYPE building_era AS ENUM (
  'ancient', 'medieval', 'renaissance', 'baroque',
  'neoclassical', 'modernist', 'postmodern', 'contemporary'
);

CREATE TYPE data_source AS ENUM (
  'kartverket', 'planinnsyn', 'unesco', 'google_places', 'city_archive', 'manual'
);

CREATE TYPE route_status AS ENUM ('draft', 'published', 'archived');

CREATE TABLE buildings (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              TEXT NOT NULL,
  name_local        TEXT,
  description       TEXT NOT NULL,
  short_description TEXT NOT NULL,
  architect         TEXT,
  year_built        INTEGER,
  year_completed    INTEGER,
  address           TEXT NOT NULL,
  city              TEXT NOT NULL,
  country           TEXT NOT NULL DEFAULT 'NO',
  lat               DECIMAL(10,8) NOT NULL DEFAULT 0,
  lng               DECIMAL(11,8) NOT NULL DEFAULT 0,
  categories        building_category[] NOT NULL DEFAULT '{}',
  era               building_era,
  sources           data_source[] NOT NULL DEFAULT '{}',
  external_kartverket    TEXT,
  external_planinnsyn    TEXT,
  external_unesco        TEXT,
  external_google_places TEXT,
  audio_guide_url   TEXT,
  is_verified       BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_buildings_city ON buildings (city);
CREATE INDEX idx_buildings_categories ON buildings USING GIN (categories);
CREATE INDEX idx_buildings_latlon ON buildings (lat, lng);

CREATE TABLE building_images (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  building_id  UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  url          TEXT NOT NULL,
  caption      TEXT,
  year         INTEGER,
  is_historical BOOLEAN NOT NULL DEFAULT false,
  credit       TEXT,
  sort_order   INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_building_images_building ON building_images (building_id);

CREATE TABLE historical_records (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  building_id  UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT NOT NULL,
  year         INTEGER,
  document_url TEXT,
  image_url    TEXT,
  source       data_source NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_historical_records_building ON historical_records (building_id);

CREATE TABLE routes (
  id                         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title                      TEXT NOT NULL,
  description                TEXT NOT NULL,
  city                       TEXT NOT NULL,
  country                    TEXT NOT NULL DEFAULT 'NO',
  cover_image_url            TEXT,
  categories                 building_category[] NOT NULL DEFAULT '{}',
  distance_meters            INTEGER NOT NULL DEFAULT 0,
  estimated_steps            INTEGER NOT NULL DEFAULT 0,
  estimated_duration_minutes INTEGER NOT NULL DEFAULT 0,
  difficulty_level           TEXT NOT NULL DEFAULT 'easy' CHECK (difficulty_level IN ('easy', 'moderate', 'challenging')),
  status                     route_status NOT NULL DEFAULT 'draft',
  tags                       TEXT[] NOT NULL DEFAULT '{}',
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_routes_city ON routes (city);
CREATE INDEX idx_routes_status ON routes (status);
CREATE INDEX idx_routes_categories ON routes USING GIN (categories);
CREATE INDEX idx_routes_steps ON routes (estimated_steps);

CREATE TABLE route_stops (
  id                            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id                      UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  building_id                   UUID NOT NULL REFERENCES buildings(id),
  stop_order                    INTEGER NOT NULL,
  dwell_time_minutes            INTEGER NOT NULL DEFAULT 10,
  narrative_text                TEXT NOT NULL DEFAULT '',
  arrival_trigger_radius_meters INTEGER NOT NULL DEFAULT 50,
  UNIQUE (route_id, stop_order)
);

CREATE INDEX idx_route_stops_route ON route_stops (route_id);

CREATE TABLE pit_stops (
  id                         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id                   UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  name                       TEXT NOT NULL,
  type                       TEXT NOT NULL CHECK (type IN ('cafe', 'restaurant', 'water', 'restroom', 'viewpoint')),
  lat                        DECIMAL(10,8) NOT NULL DEFAULT 0,
  lng                        DECIMAL(11,8) NOT NULL DEFAULT 0,
  address                    TEXT,
  google_places_id           TEXT,
  distance_from_route_meters INTEGER NOT NULL DEFAULT 0,
  insert_after_stop_order    INTEGER NOT NULL
);

CREATE INDEX idx_pit_stops_route ON pit_stops (route_id);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER buildings_updated_at BEFORE UPDATE ON buildings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER routes_updated_at BEFORE UPDATE ON routes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

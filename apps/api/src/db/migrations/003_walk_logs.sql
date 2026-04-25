CREATE TABLE walk_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID REFERENCES routes(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL,
  steps_actual INTEGER NOT NULL DEFAULT 0,
  distance_meters_actual INTEGER NOT NULL DEFAULT 0,
  duration_minutes_actual INTEGER NOT NULL DEFAULT 0,
  buildings_visited UUID[] NOT NULL DEFAULT '{}',
  calories_estimated INTEGER,
  health_kit_synced BOOLEAN NOT NULL DEFAULT false,
  device_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_walk_logs_started ON walk_logs (started_at DESC);
CREATE INDEX idx_walk_logs_route ON walk_logs (route_id);

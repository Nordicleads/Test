-- Accessibility metadata for buildings and routes

ALTER TABLE buildings
  ADD COLUMN IF NOT EXISTS is_step_free BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS max_gradient_percent NUMERIC(4,1),
  ADD COLUMN IF NOT EXISTS surface_type TEXT CHECK (surface_type IN ('paved', 'cobblestone', 'gravel', 'mixed')),
  ADD COLUMN IF NOT EXISTS has_benches_every_n_meters INTEGER,
  ADD COLUMN IF NOT EXISTS accessibility_notes TEXT;

ALTER TABLE routes
  ADD COLUMN IF NOT EXISTS is_step_free BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS max_gradient_percent NUMERIC(4,1),
  ADD COLUMN IF NOT EXISTS surface_type TEXT,
  ADD COLUMN IF NOT EXISTS accessibility_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_buildings_step_free ON buildings (is_step_free) WHERE is_step_free = true;
CREATE INDEX IF NOT EXISTS idx_routes_step_free ON routes (is_step_free) WHERE is_step_free = true;

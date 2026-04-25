CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  theme TEXT NOT NULL,
  cover_image_url TEXT,
  city TEXT,
  country TEXT NOT NULL DEFAULT 'NO',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE collection_routes (
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (collection_id, route_id)
);

CREATE INDEX idx_collections_city ON collections (city);
CREATE INDEX idx_collections_published ON collections (is_published);
CREATE INDEX idx_collection_routes_collection ON collection_routes (collection_id);

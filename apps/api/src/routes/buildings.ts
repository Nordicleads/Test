import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { query, queryOne } from "../db/client.js";

const nearbySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(100).max(5000).default(500),
  categories: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export async function buildingRoutes(app: FastifyInstance) {
  app.get("/buildings/nearby", async (req, reply) => {
    const params = nearbySchema.safeParse(req.query);
    if (!params.success) return reply.badRequest(params.error.message);

    const { lat, lng, radius, categories, limit } = params.data;
    const categoryFilter = categories?.split(",").filter(Boolean) ?? [];

    const rows = await query(
      `SELECT
         b.id, b.name, b.short_description, b.architect, b.year_completed,
         b.address, b.city, b.categories, b.era, b.is_verified,
         b.lat, b.lng,
         (6371000 * acos(LEAST(1.0, cos(radians($1)) * cos(radians(b.lat)) * cos(radians(b.lng) - radians($2)) + sin(radians($1)) * sin(radians(b.lat))))) AS distance_meters,
         COALESCE(
           json_agg(bi ORDER BY bi.sort_order) FILTER (WHERE bi.id IS NOT NULL), '[]'
         ) AS images
       FROM buildings b
       LEFT JOIN building_images bi ON bi.building_id = b.id AND bi.is_historical = false
       WHERE b.lat BETWEEN $1 - $3 / 111320.0 AND $1 + $3 / 111320.0
         AND b.lng BETWEEN $2 - $3 / (111320.0 * cos(radians($1))) AND $2 + $3 / (111320.0 * cos(radians($1)))
       ${categoryFilter.length ? "AND b.categories && $5::building_category[]" : ""}
       GROUP BY b.id
       ORDER BY distance_meters
       LIMIT $4`,
      categoryFilter.length
        ? [lat, lng, radius, limit, `{${categoryFilter.join(",")}}`]
        : [lat, lng, radius, limit]
    );

    return rows;
  });

  app.get<{ Params: { id: string } }>("/buildings/:id", async (req, reply) => {
    const building = await queryOne(
      `SELECT
         b.*,
         COALESCE(
           json_agg(DISTINCT bi ORDER BY bi.sort_order) FILTER (WHERE bi.id IS NOT NULL), '[]'
         ) AS images,
         COALESCE(
           json_agg(DISTINCT hr ORDER BY hr.year DESC NULLS LAST) FILTER (WHERE hr.id IS NOT NULL), '[]'
         ) AS historical_records
       FROM buildings b
       LEFT JOIN building_images bi ON bi.building_id = b.id
       LEFT JOIN historical_records hr ON hr.building_id = b.id
       WHERE b.id = $1
       GROUP BY b.id`,
      [req.params.id]
    );

    if (!building) return reply.notFound();
    return building;
  });
}

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { query, queryOne } from "../db/client.js";

const listSchema = z.object({
  city: z.string().optional(),
  categories: z.string().optional(),
  minSteps: z.coerce.number().optional(),
  maxSteps: z.coerce.number().optional(),
  maxDuration: z.coerce.number().optional(),
  status: z.enum(["draft", "published", "archived"]).default("published"),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(50).default(20),
});

export async function routeRoutes(app: FastifyInstance) {
  app.get("/routes", async (req, reply) => {
    const params = listSchema.safeParse(req.query);
    if (!params.success) return reply.badRequest(params.error.message);

    const { city, categories, minSteps, maxSteps, maxDuration, status, page, pageSize } =
      params.data;
    const categoryFilter = categories?.split(",").filter(Boolean) ?? [];
    const offset = (page - 1) * pageSize;

    const conditions: string[] = ["r.status = $1"];
    const values: unknown[] = [status];
    let idx = 2;

    if (city) { conditions.push(`r.city ILIKE $${idx++}`); values.push(`%${city}%`); }
    if (categoryFilter.length) { conditions.push(`r.categories && $${idx++}::building_category[]`); values.push(`{${categoryFilter.join(",")}}`); }
    if (minSteps) { conditions.push(`r.estimated_steps >= $${idx++}`); values.push(minSteps); }
    if (maxSteps) { conditions.push(`r.estimated_steps <= $${idx++}`); values.push(maxSteps); }
    if (maxDuration) { conditions.push(`r.estimated_duration_minutes <= $${idx++}`); values.push(maxDuration); }

    const where = conditions.join(" AND ");

    const [rows, countRows] = await Promise.all([
      query(
        `SELECT r.id, r.title, r.description, r.city, r.cover_image_url,
                r.categories, r.distance_meters, r.estimated_steps,
                r.estimated_duration_minutes, r.difficulty_level, r.tags,
                COUNT(rs.id)::int AS stop_count
         FROM routes r
         LEFT JOIN route_stops rs ON rs.route_id = r.id
         WHERE ${where}
         GROUP BY r.id
         ORDER BY r.created_at DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...values, pageSize, offset]
      ),
      query<{ total: string }>(
        `SELECT COUNT(*)::text AS total FROM routes r WHERE ${where}`,
        values
      ),
    ]);

    return {
      data: rows,
      total: parseInt(countRows[0]?.total ?? "0", 10),
      page,
      pageSize,
    };
  });

  app.get<{ Params: { id: string } }>("/routes/:id", async (req, reply) => {
    const route = await queryOne(
      `SELECT r.*,
              COALESCE(
                json_agg(
                  json_build_object(
                    'id', rs.id,
                    'order', rs.stop_order,
                    'dwellTimeMinutes', rs.dwell_time_minutes,
                    'narrativeText', rs.narrative_text,
                    'arrivalTriggerRadiusMeters', rs.arrival_trigger_radius_meters,
                    'building', json_build_object(
                      'id', b.id, 'name', b.name,
                      'shortDescription', b.short_description,
                      'address', b.address,
                      'categories', b.categories,
                      'lat', b.lat,
                      'lng', b.lng,
                      'audioGuideUrl', b.audio_guide_url
                    )
                  ) ORDER BY rs.stop_order
                ) FILTER (WHERE rs.id IS NOT NULL), '[]'
              ) AS stops
       FROM routes r
       LEFT JOIN route_stops rs ON rs.route_id = r.id
       LEFT JOIN buildings b ON b.id = rs.building_id
       WHERE r.id = $1
       GROUP BY r.id`,
      [req.params.id]
    );

    if (!route) return reply.notFound();
    return route;
  });
}

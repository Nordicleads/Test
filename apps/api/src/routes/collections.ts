import type { FastifyInstance } from "fastify";
import { query, queryOne } from "../db/client.js";

export async function collectionRoutes(app: FastifyInstance) {
  app.get("/collections", async () => {
    return query(
      `SELECT
         c.id, c.title, c.description, c.theme,
         c.cover_image_url, c.city, c.sort_order,
         COUNT(cr.route_id)::int AS route_count
       FROM collections c
       LEFT JOIN collection_routes cr ON cr.collection_id = c.id
       WHERE c.is_published = true
       GROUP BY c.id
       ORDER BY c.sort_order, c.created_at`,
      []
    );
  });

  app.get<{ Params: { id: string } }>("/collections/:id", async (req, reply) => {
    const collection = await queryOne(
      `SELECT
         c.*,
         COALESCE(
           json_agg(
             json_build_object(
               'id', r.id, 'title', r.title, 'description', r.description,
               'city', r.city, 'coverImageUrl', r.cover_image_url,
               'estimatedSteps', r.estimated_steps,
               'estimatedDurationMinutes', r.estimated_duration_minutes,
               'difficultyLevel', r.difficulty_level,
               'categories', r.categories
             ) ORDER BY cr.sort_order
           ) FILTER (WHERE r.id IS NOT NULL), '[]'
         ) AS routes
       FROM collections c
       LEFT JOIN collection_routes cr ON cr.collection_id = c.id
       LEFT JOIN routes r ON r.id = cr.route_id AND r.status = 'published'
       WHERE c.id = $1 AND c.is_published = true
       GROUP BY c.id`,
      [req.params.id]
    );
    if (!collection) return reply.notFound();
    return collection;
  });
}

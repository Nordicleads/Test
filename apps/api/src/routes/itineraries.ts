import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { query, queryOne } from "../db/client.js";

const createSchema = z.object({
  title: z.string().min(1).max(120),
  city: z.string().min(1).max(80),
  theme: z.enum(["architecture", "heritage", "modern", "mixed"]),
  description: z.string().max(500).optional(),
  routeIds: z.array(z.string().uuid()).min(1).max(14),
});

const addDaySchema = z.object({
  routeId: z.string().uuid().optional(),
  dayNumber: z.number().int().min(1).max(14),
  title: z.string().min(1).max(120).optional(),
  notes: z.string().max(500).optional(),
});

export async function itineraryRoutes(app: FastifyInstance) {
  // List all published itineraries
  app.get("/itineraries", async () => {
    return query(
      `SELECT i.id, i.title, i.city, i.theme,
              COUNT(d.id)::int AS days_count,
              i.created_at
       FROM itineraries i
       LEFT JOIN itinerary_days d ON d.itinerary_id = i.id
       WHERE i.is_published = true
       GROUP BY i.id
       ORDER BY i.created_at DESC`
    );
  });

  // Get single itinerary with days + route summaries
  app.get<{ Params: { id: string } }>("/itineraries/:id", async (req, reply) => {
    const { id } = req.params;
    if (!z.string().uuid().safeParse(id).success) return reply.badRequest("Invalid id");

    const itinerary = await queryOne<any>(
      `SELECT id, title, city, theme, description, is_published, created_at
       FROM itineraries WHERE id = $1`,
      [id]
    );
    if (!itinerary) return reply.notFound("Itinerary not found");

    const days = await query<any>(
      `SELECT d.id, d.day_number, d.title, d.notes,
              r.id AS route_id, r.title AS route_title,
              r.estimated_steps, r.estimated_duration_minutes, r.difficulty_level,
              r.distance_meters
       FROM itinerary_days d
       LEFT JOIN routes r ON r.id = d.route_id
       WHERE d.itinerary_id = $1
       ORDER BY d.day_number`,
      [id]
    );

    return {
      ...itinerary,
      daysCount: days.length,
      days: days.map((d: any) => ({
        id: d.id,
        itineraryId: id,
        dayNumber: d.day_number,
        title: d.title ?? `Day ${d.day_number}`,
        notes: d.notes,
        routeId: d.route_id,
        route: d.route_id
          ? {
              id: d.route_id,
              title: d.route_title,
              estimatedSteps: d.estimated_steps,
              estimatedDurationMinutes: d.estimated_duration_minutes,
              difficultyLevel: d.difficulty_level,
              distanceMeters: d.distance_meters,
            }
          : null,
      })),
    };
  });

  // Create itinerary from a list of route IDs (one route per day)
  app.post("/itineraries", async (req, reply) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return reply.badRequest(parsed.error.message);

    const { title, city, theme, description, routeIds } = parsed.data;

    const itinerary = await queryOne<{ id: string }>(
      `INSERT INTO itineraries (title, city, theme, description)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [title, city, theme, description ?? null]
    );
    if (!itinerary) return reply.internalServerError("Failed to create itinerary");

    for (let i = 0; i < routeIds.length; i++) {
      await queryOne(
        `INSERT INTO itinerary_days (itinerary_id, day_number, title, route_id)
         VALUES ($1, $2, $3, $4)`,
        [itinerary.id, i + 1, `Day ${i + 1}`, routeIds[i]]
      );
    }

    reply.code(201);
    return { id: itinerary.id, title, city, theme, daysCount: routeIds.length };
  });

  // Add or update a single day
  app.post<{ Params: { id: string } }>("/itineraries/:id/days", async (req, reply) => {
    const { id } = req.params;
    if (!z.string().uuid().safeParse(id).success) return reply.badRequest("Invalid id");

    const parsed = addDaySchema.safeParse(req.body);
    if (!parsed.success) return reply.badRequest(parsed.error.message);

    const { routeId, dayNumber, title, notes } = parsed.data;

    const exists = await queryOne(`SELECT id FROM itineraries WHERE id = $1`, [id]);
    if (!exists) return reply.notFound("Itinerary not found");

    const day = await queryOne<{ id: string }>(
      `INSERT INTO itinerary_days (itinerary_id, day_number, title, route_id, notes)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (itinerary_id, day_number)
       DO UPDATE SET route_id = EXCLUDED.route_id,
                     title = EXCLUDED.title,
                     notes = EXCLUDED.notes
       RETURNING id`,
      [id, dayNumber, title ?? `Day ${dayNumber}`, routeId ?? null, notes ?? null]
    );

    reply.code(201);
    return { id: day?.id, itineraryId: id, dayNumber, routeId };
  });
}

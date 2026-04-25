import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { query, queryOne } from "../db/client.js";

const walkInputSchema = z.object({
  routeId: z.string().uuid().optional(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime(),
  stepsActual: z.number().int().min(0),
  distanceMetersActual: z.number().int().min(0),
  durationMinutesActual: z.number().int().min(0),
  buildingsVisited: z.array(z.string().uuid()).default([]),
  caloriesEstimated: z.number().int().optional(),
  deviceId: z.string().optional(),
});

export async function walkRoutes(app: FastifyInstance) {
  app.post("/walks", async (req, reply) => {
    const parsed = walkInputSchema.safeParse(req.body);
    if (!parsed.success) return reply.badRequest(parsed.error.message);

    const d = parsed.data;
    const row = await queryOne(
      `INSERT INTO walk_logs (
        route_id, started_at, completed_at,
        steps_actual, distance_meters_actual, duration_minutes_actual,
        buildings_visited, calories_estimated, device_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7::uuid[], $8, $9)
      RETURNING *`,
      [
        d.routeId ?? null,
        d.startedAt,
        d.completedAt,
        d.stepsActual,
        d.distanceMetersActual,
        d.durationMinutesActual,
        `{${d.buildingsVisited.join(",")}}`,
        d.caloriesEstimated ?? null,
        d.deviceId ?? null,
      ]
    );
    return reply.code(201).send(row);
  });

  app.get("/walks", async (req) => {
    const limit = Math.min(parseInt((req.query as any).limit ?? "20", 10), 100);
    return query(
      `SELECT * FROM walk_logs ORDER BY started_at DESC LIMIT $1`,
      [limit]
    );
  });

  app.get("/walks/stats", async () => {
    const row = await queryOne<{
      total_routes: string;
      total_steps: string;
      total_distance: string;
      total_calories: string;
    }>(
      `SELECT
        COUNT(*)::text AS total_routes,
        COALESCE(SUM(steps_actual), 0)::text AS total_steps,
        COALESCE(SUM(distance_meters_actual), 0)::text AS total_distance,
        COALESCE(SUM(calories_estimated), 0)::text AS total_calories
       FROM walk_logs`,
      []
    );
    return {
      totalRoutes: parseInt(row?.total_routes ?? "0", 10),
      totalSteps: parseInt(row?.total_steps ?? "0", 10),
      totalDistanceMeters: parseInt(row?.total_distance ?? "0", 10),
      totalCalories: parseInt(row?.total_calories ?? "0", 10),
    };
  });
}

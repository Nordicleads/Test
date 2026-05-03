import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { query } from "../db/client.js";
import { fetchPitStopsAlongRoute } from "../services/placesClient.js";

const paramsSchema = z.object({ id: z.string().uuid() });

export async function pitStopRoutes(app: FastifyInstance) {
  app.get("/routes/:id/pitstops", async (req, reply) => {
    const params = paramsSchema.safeParse(req.params);
    if (!params.success) return reply.badRequest("Invalid route id");

    const stops = await query<{ order: number; lat: number; lng: number }>(
      `SELECT rs.stop_order AS "order",
              b.lat,
              b.lng
       FROM route_stops rs
       JOIN buildings b ON b.id = rs.building_id
       WHERE rs.route_id = $1
       ORDER BY rs.stop_order`,
      [params.data.id]
    );

    if (stops.length === 0) return reply.notFound("Route not found");

    const pitStops = await fetchPitStopsAlongRoute(stops);
    return pitStops;
  });
}

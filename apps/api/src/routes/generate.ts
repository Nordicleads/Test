import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { generateRoute } from "../services/routeGenerator.js";

const bodySchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  radiusMeters: z.number().min(200).max(15_000).optional(),
  categories: z.array(z.string()).optional(),
  eras: z.array(z.string()).optional(),
  stepGoal: z.number().min(1_000).max(30_000).optional(),
  maxStops: z.number().min(2).max(20).optional(),
  stepFreeOnly: z.boolean().optional(),
  maxGradientPercent: z.number().min(0).max(30).optional(),
});

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radiusMeters: z.coerce.number().min(200).max(15_000).optional(),
  stepGoal: z.coerce.number().min(1_000).max(30_000).optional(),
  maxStops: z.coerce.number().min(2).max(20).optional(),
  stepFreeOnly: z.coerce.boolean().optional(),
  maxGradientPercent: z.coerce.number().min(0).max(30).optional(),
});

export async function generateRoutes(app: FastifyInstance) {
  app.post("/routes/generate", async (req, reply) => {
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) return reply.badRequest(parsed.error.message);
    const route = await generateRoute(parsed.data as any);
    if (!route) return reply.notFound("No buildings found matching your filters in this area.");
    return route;
  });

  app.get("/routes/generate", async (req, reply) => {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) return reply.badRequest(parsed.error.message);
    const route = await generateRoute(parsed.data as any);
    if (!route) return reply.notFound("No buildings found matching your filters in this area.");
    return route;
  });
}

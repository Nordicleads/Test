import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { queryOne } from "../db/client.js";
import { fetchArchiveForBuilding } from "../services/planinnsynClient.js";

const paramsSchema = z.object({ id: z.string().uuid() });

export async function archiveRoutes(app: FastifyInstance) {
  app.get("/buildings/:id/archive", async (req, reply) => {
    const params = paramsSchema.safeParse(req.params);
    if (!params.success) return reply.badRequest("Invalid building id");

    const building = await queryOne<{
      id: string;
      address: string;
      city: string;
      planinnsyn_id: string | null;
    }>(
      `SELECT id, address, city,
              external_ids->>'planinnsyn' AS planinnsyn_id
       FROM buildings WHERE id = $1`,
      [params.data.id]
    );

    if (!building) return reply.notFound("Building not found");

    const records = await fetchArchiveForBuilding(
      building.id,
      building.planinnsyn_id,
      building.address,
      building.city
    );

    return records;
  });
}

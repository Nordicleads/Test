import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import { buildingRoutes } from "./routes/buildings.js";
import { routeRoutes } from "./routes/routes.js";
import { generateRoutes } from "./routes/generate.js";

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });
await app.register(sensible);

app.get("/health", async () => ({ status: "ok" }));

await app.register(buildingRoutes, { prefix: "/api/v1" });
await app.register(routeRoutes, { prefix: "/api/v1" });
await app.register(generateRoutes, { prefix: "/api/v1" });

const port = parseInt(process.env.PORT ?? "3000", 10);
await app.listen({ port, host: "0.0.0.0" });

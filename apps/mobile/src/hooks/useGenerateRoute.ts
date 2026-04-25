import { useMutation } from "@tanstack/react-query";
import type { BuildingCategory } from "@wandr/shared";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

interface GenerateInput {
  lat: number;
  lng: number;
  categories?: BuildingCategory[];
  stepGoal?: number;
  radiusMeters?: number;
}

async function postGenerate(input: GenerateInput) {
  const res = await fetch(`${BASE_URL}/routes/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Generate failed: ${res.status}`);
  return res.json();
}

export function useGenerateRoute() {
  return useMutation({ mutationFn: postGenerate });
}

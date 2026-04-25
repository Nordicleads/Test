import type { PaginatedResponse, Route, RouteFilters } from "@wandr/shared";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

async function get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) url.searchParams.set(k, String(v));
    });
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

export const api = {
  routes: {
    list: (filters?: RouteFilters & { status?: string; page?: number; pageSize?: number }) =>
      get<PaginatedResponse<Route>>("/routes", filters as any),

    get: (id: string) =>
      get<Route>(`/routes/${id}`),
  },

  buildings: {
    nearby: (lat: number, lng: number, radius = 500, categories?: string) =>
      get<any[]>("/buildings/nearby", { lat, lng, radius, categories }),

    get: (id: string) =>
      get<any>(`/buildings/${id}`),
  },
};

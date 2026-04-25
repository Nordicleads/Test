import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import type { RouteFilters } from "@wandr/shared";

export function useRoutes(filters?: RouteFilters & { status?: string }) {
  return useQuery({
    queryKey: ["routes", filters],
    queryFn: () => api.routes.list(filters),
  });
}

export function useRoute(id: string | undefined) {
  return useQuery({
    queryKey: ["route", id],
    queryFn: () => api.routes.get(id!),
    enabled: !!id,
  });
}

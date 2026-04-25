import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";

export function usePitStops(routeId: string | undefined) {
  return useQuery({
    queryKey: ["pitstops", routeId],
    queryFn: () => api.pitStops.list(routeId!),
    enabled: !!routeId,
    staleTime: 5 * 60 * 1000,
  });
}

import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import type { WalkStats } from "@wandr/shared";

export function useWalkStats() {
  return useQuery<WalkStats>({
    queryKey: ["walk-stats"],
    queryFn: () => api.walks.stats(),
  });
}

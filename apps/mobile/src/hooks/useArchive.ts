import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";

export function useArchive(buildingId: string | undefined) {
  return useQuery({
    queryKey: ["archive", buildingId],
    queryFn: () => api.archive.list(buildingId!),
    enabled: !!buildingId,
    staleTime: 10 * 60 * 1000,
  });
}

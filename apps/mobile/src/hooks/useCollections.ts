import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";

export function useCollections() {
  return useQuery({
    queryKey: ["collections"],
    queryFn: () => api.collections.list(),
  });
}

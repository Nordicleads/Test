import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import type { CreateItineraryInput } from "@wandr/shared";

export function useItineraries() {
  return useQuery({
    queryKey: ["itineraries"],
    queryFn: () => api.itineraries.list(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useItinerary(id: string | undefined) {
  return useQuery({
    queryKey: ["itinerary", id],
    queryFn: () => api.itineraries.get(id!),
    enabled: !!id,
  });
}

export function useCreateItinerary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateItineraryInput) => api.itineraries.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["itineraries"] }),
  });
}

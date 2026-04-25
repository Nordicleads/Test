import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import { logWalk } from "../services/healthKit";
import type { WalkLogInput } from "@wandr/shared";

export function useWalkLogger() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: WalkLogInput) => {
      const walk = await api.walks.log(input);
      const start = new Date(input.startedAt);
      const end = new Date(input.completedAt);
      await logWalk(input.stepsActual, input.distanceMetersActual, start, end).catch(() => {});
      return walk;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["walk-stats"] });
    },
  });
}

import { create } from "zustand";
import type { RouteStop } from "@wandr/shared";

interface VoiceGuideStore {
  isActive: boolean;
  currentStopOrder: number;
  isPlaying: boolean;
  routeStops: RouteStop[];
  startGuide: (stops: RouteStop[]) => void;
  stopGuide: () => void;
  setCurrentStop: (order: number) => void;
  setPlaying: (playing: boolean) => void;
}

export const useVoiceGuideStore = create<VoiceGuideStore>((set) => ({
  isActive: false,
  currentStopOrder: 1,
  isPlaying: false,
  routeStops: [],
  startGuide: (stops) => set({ isActive: true, routeStops: stops, currentStopOrder: 1, isPlaying: true }),
  stopGuide: () => set({ isActive: false, isPlaying: false, routeStops: [], currentStopOrder: 1 }),
  setCurrentStop: (order) => set({ currentStopOrder: order }),
  setPlaying: (playing) => set({ isPlaying: playing }),
}));

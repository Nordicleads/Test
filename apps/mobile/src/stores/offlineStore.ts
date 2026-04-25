import { create } from "zustand";
import type { OfflineBundleMeta, DownloadProgress } from "@wandr/shared";

interface OfflineStoreState {
  bundles: Record<string, OfflineBundleMeta>;
  progress: Record<string, DownloadProgress>;
  storageBytes: number;
  setBundles: (bundles: OfflineBundleMeta[]) => void;
  setProgress: (routeId: string, p: DownloadProgress) => void;
  addBundle: (meta: OfflineBundleMeta) => void;
  removeBundle: (routeId: string) => void;
  setStorageBytes: (bytes: number) => void;
}

export const useOfflineStore = create<OfflineStoreState>((set) => ({
  bundles: {},
  progress: {},
  storageBytes: 0,
  setBundles: (list) =>
    set({ bundles: Object.fromEntries(list.map((b) => [b.routeId, b])) }),
  setProgress: (routeId, p) =>
    set((s) => ({ progress: { ...s.progress, [routeId]: p } })),
  addBundle: (meta) =>
    set((s) => ({ bundles: { ...s.bundles, [meta.routeId]: meta } })),
  removeBundle: (routeId) =>
    set((s) => {
      const { [routeId]: _, ...rest } = s.bundles;
      const { [routeId]: __, ...restP } = s.progress;
      return { bundles: rest, progress: restP };
    }),
  setStorageBytes: (bytes) => set({ storageBytes: bytes }),
}));

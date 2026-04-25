import { useEffect, useCallback } from "react";
import { useOfflineStore } from "../stores/offlineStore";
import { downloadRoute, deleteRoute, getStorageUsageBytes } from "../services/offlineManager";
import { loadAllBundleMetas, initDb } from "../services/sqliteClient";

export function useOfflineBundles() {
  const { bundles, progress, storageBytes, setBundles, setProgress, addBundle, removeBundle, setStorageBytes } =
    useOfflineStore();

  useEffect(() => {
    initDb().then(() =>
      loadAllBundleMetas().then((metas) => {
        setBundles(metas);
        getStorageUsageBytes().then(setStorageBytes);
      })
    );
  }, []);

  const download = useCallback(async (routeId: string) => {
    try {
      const meta = await downloadRoute(routeId, (p) => setProgress(routeId, p));
      addBundle(meta);
      getStorageUsageBytes().then(setStorageBytes);
    } catch (err) {
      setProgress(routeId, { routeId, percent: 0, status: "error" });
      throw err;
    }
  }, []);

  const remove = useCallback(async (routeId: string) => {
    await deleteRoute(routeId);
    removeBundle(routeId);
    getStorageUsageBytes().then(setStorageBytes);
  }, []);

  return {
    bundles: Object.values(bundles),
    progress,
    storageBytes,
    isDownloaded: (routeId: string) => routeId in bundles,
    download,
    remove,
  };
}

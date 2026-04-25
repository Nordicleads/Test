import * as FileSystem from "expo-file-system";
import { api } from "./api";
import { saveBundleMeta, deleteBundleMeta, getTotalSizeBytes } from "./sqliteClient";
import { OFFLINE_BUNDLE_EXPIRY_DAYS } from "@wandr/shared";
import type { OfflineBundleMeta, DownloadProgress } from "@wandr/shared";

const IMAGE_DIR = FileSystem.documentDirectory + "wandr/images/";

async function ensureImageDir() {
  const info = await FileSystem.getInfoAsync(IMAGE_DIR);
  if (!info.exists) await FileSystem.makeDirectoryAsync(IMAGE_DIR, { intermediates: true });
}

export async function downloadRoute(
  routeId: string,
  onProgress: (p: DownloadProgress) => void
): Promise<OfflineBundleMeta> {
  onProgress({ routeId, percent: 0, status: "downloading" });

  const route = await api.offline.getRoute(routeId);
  onProgress({ routeId, percent: 40, status: "downloading" });

  await ensureImageDir();
  if (route.coverImageUrl) {
    try {
      await FileSystem.downloadAsync(route.coverImageUrl, `${IMAGE_DIR}${routeId}.jpg`);
    } catch {
      // non-fatal — image unavailable offline
    }
  }
  onProgress({ routeId, percent: 80, status: "downloading" });

  const routeJson = JSON.stringify(route);
  const sizeBytes = new TextEncoder().encode(routeJson).length;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + OFFLINE_BUNDLE_EXPIRY_DAYS * 86_400_000);

  const meta: OfflineBundleMeta = {
    routeId,
    title: route.title,
    city: route.city,
    estimatedSteps: route.estimatedSteps,
    downloadedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    sizeBytes,
  };

  await saveBundleMeta({ ...meta, routeJson });
  onProgress({ routeId, percent: 100, status: "done" });

  return meta;
}

export async function deleteRoute(routeId: string): Promise<void> {
  await deleteBundleMeta(routeId);
  const imgPath = `${IMAGE_DIR}${routeId}.jpg`;
  const info = await FileSystem.getInfoAsync(imgPath);
  if (info.exists) await FileSystem.deleteAsync(imgPath, { idempotent: true });
}

export async function getStorageUsageBytes(): Promise<number> {
  return getTotalSizeBytes();
}

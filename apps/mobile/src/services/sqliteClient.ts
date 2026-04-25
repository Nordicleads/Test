import * as SQLite from "expo-sqlite";
import type { OfflineBundleMeta } from "@wandr/shared";

let db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync("wandr.db");
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS offline_bundles (
        route_id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        city TEXT NOT NULL,
        estimated_steps INTEGER NOT NULL,
        downloaded_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        size_bytes INTEGER NOT NULL,
        route_json TEXT NOT NULL,
        audio_files_json TEXT NOT NULL DEFAULT '[]'
      )
    `);
  }
  return db;
}

export async function initDb(): Promise<void> {
  await getDb();
}

export async function saveBundleMeta(
  meta: OfflineBundleMeta & { routeJson: string; audioFilesJson?: string }
): Promise<void> {
  const d = await getDb();
  await d.runAsync(
    `INSERT OR REPLACE INTO offline_bundles
      (route_id, title, city, estimated_steps, downloaded_at, expires_at, size_bytes, route_json, audio_files_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      meta.routeId, meta.title, meta.city, meta.estimatedSteps,
      meta.downloadedAt, meta.expiresAt, meta.sizeBytes,
      meta.routeJson, meta.audioFilesJson ?? "[]",
    ]
  );
}

export async function loadAllBundleMetas(): Promise<OfflineBundleMeta[]> {
  const d = await getDb();
  const rows = await d.getAllAsync<{
    route_id: string; title: string; city: string;
    estimated_steps: number; downloaded_at: string; expires_at: string; size_bytes: number;
  }>("SELECT route_id, title, city, estimated_steps, downloaded_at, expires_at, size_bytes FROM offline_bundles");
  return rows.map((r) => ({
    routeId: r.route_id,
    title: r.title,
    city: r.city,
    estimatedSteps: r.estimated_steps,
    downloadedAt: r.downloaded_at,
    expiresAt: r.expires_at,
    sizeBytes: r.size_bytes,
  }));
}

export async function deleteBundleMeta(routeId: string): Promise<void> {
  const d = await getDb();
  await d.runAsync("DELETE FROM offline_bundles WHERE route_id = ?", [routeId]);
}

export async function getBundleRoute(routeId: string): Promise<string | null> {
  const d = await getDb();
  const row = await d.getFirstAsync<{ route_json: string }>(
    "SELECT route_json FROM offline_bundles WHERE route_id = ?",
    [routeId]
  );
  return row?.route_json ?? null;
}

export async function getTotalSizeBytes(): Promise<number> {
  const d = await getDb();
  const row = await d.getFirstAsync<{ total: number }>(
    "SELECT COALESCE(SUM(size_bytes), 0) AS total FROM offline_bundles"
  );
  return row?.total ?? 0;
}

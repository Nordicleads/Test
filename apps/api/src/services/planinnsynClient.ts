import type { ArchiveRecord } from "@wandr/shared";

// Planinnsyn public API — Norwegian municipal planning documents
// Docs: https://www.planinnsyn.no/api
const BASE = "https://www.planinnsyn.no/api/v1";

interface PlanCase {
  saksId: string;
  tittel: string;
  beskrivelse?: string;
  aar?: number;
  dokumenter?: Array<{
    dokumentId: string;
    tittel: string;
    filUrl?: string;
    mimeType?: string;
    erTegning?: boolean;
    erPlan?: boolean;
  }>;
}

export async function fetchArchiveForBuilding(
  buildingId: string,
  planinnsynCaseId: string | null,
  address: string,
  city: string
): Promise<ArchiveRecord[]> {
  // If we have a direct case ID, fetch it. Otherwise search by address.
  try {
    if (planinnsynCaseId) {
      return await fetchByCase(buildingId, planinnsynCaseId);
    }
    return await searchByAddress(buildingId, address, city);
  } catch {
    return [];
  }
}

async function fetchByCase(buildingId: string, caseId: string): Promise<ArchiveRecord[]> {
  const res = await fetch(`${BASE}/saker/${caseId}`);
  if (!res.ok) return [];
  const data = (await res.json()) as PlanCase;
  return mapCase(buildingId, data);
}

async function searchByAddress(buildingId: string, address: string, city: string): Promise<ArchiveRecord[]> {
  const q = encodeURIComponent(`${address} ${city}`);
  const res = await fetch(`${BASE}/saker?q=${q}&limit=5`);
  if (!res.ok) return [];
  const data = (await res.json()) as { results: PlanCase[] };
  return (data.results ?? []).flatMap((c) => mapCase(buildingId, c));
}

function mapCase(buildingId: string, c: PlanCase): ArchiveRecord[] {
  const records: ArchiveRecord[] = [];

  const base: Omit<ArchiveRecord, "id" | "documentUrl" | "imageUrl" | "thumbnailUrl" | "year" | "isFloorPlan" | "isConstructionDrawing"> = {
    buildingId,
    title: c.tittel,
    description: c.beskrivelse ?? `Planning case ${c.saksId}`,
    source: "planinnsyn",
    planinnsynCaseId: c.saksId,
  };

  if (!c.dokumenter?.length) {
    records.push({ ...base, id: c.saksId, year: c.aar, isFloorPlan: false, isConstructionDrawing: false });
    return records;
  }

  for (const doc of c.dokumenter) {
    const isPdf = doc.mimeType === "application/pdf" || doc.filUrl?.endsWith(".pdf");
    const isImage = doc.mimeType?.startsWith("image/") || /\.(jpg|jpeg|png)$/i.test(doc.filUrl ?? "");
    records.push({
      ...base,
      id: `${c.saksId}-${doc.dokumentId}`,
      title: doc.tittel,
      year: c.aar,
      documentUrl: isPdf ? doc.filUrl : undefined,
      imageUrl: isImage ? doc.filUrl : undefined,
      isFloorPlan: doc.erPlan ?? false,
      isConstructionDrawing: doc.erTegning ?? false,
      planinnsynCaseId: c.saksId,
    });
  }

  return records;
}

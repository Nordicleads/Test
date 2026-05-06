#!/usr/bin/env node
/**
 * Seeds all religious buildings in Oslo from OpenStreetMap (Overpass API).
 * Coordinates come directly from OSM — no geocoding needed.
 *
 * Usage:
 *   node scripts/seed-oslo-religious.mjs
 *   WANDR_API=https://test-production-8a18.up.railway.app/api/v1 node scripts/seed-oslo-religious.mjs
 *   DRY_RUN=1 node scripts/seed-oslo-religious.mjs
 */

const API = process.env.WANDR_API ?? "https://test-production-8a18.up.railway.app/api/v1";
const OVERPASS = "https://overpass.kumi.systems/api/interpreter";
const DRY_RUN = process.env.DRY_RUN === "1";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function eraFromYear(year) {
  if (!year) return null;
  if (year < 1500) return "medieval";
  if (year < 1700) return "renaissance";
  if (year < 1800) return "baroque";
  if (year < 1900) return "neoclassical";
  if (year < 1945) return "modernist";
  if (year < 1990) return "postmodern";
  return "contemporary";
}

function parseYear(raw) {
  if (!raw) return null;
  const m = raw.match(/\b(1[0-9]{3}|20[012][0-9])\b/);
  if (!m) return null;
  const y = parseInt(m[1]);
  return y >= 1000 && y <= 2030 ? y : null;
}

// Map OSM religion + denomination tags → human-readable building type
function buildingType(tags) {
  const rel = tags.religion ?? "";
  const den = (tags.denomination ?? tags["denomination:wikipedia"] ?? "").toLowerCase();

  if (rel === "muslim") return "Mosque";
  if (rel === "jewish") return "Synagogue";
  if (rel === "buddhist") return "Buddhist temple";
  if (rel === "hindu") return "Hindu temple";
  if (rel === "sikh") return "Gurdwara";
  if (rel === "christian") {
    if (den.includes("lutheran") || den.includes("church_of_norway") || den.includes("evangelical")) return "Church of Norway";
    if (den.includes("roman_catholic") || den.includes("catholic")) return "Roman Catholic church";
    if (den.includes("orthodox")) return "Orthodox church";
    if (den.includes("baptist")) return "Baptist church";
    if (den.includes("methodist")) return "Methodist church";
    if (den.includes("pentecostal")) return "Pentecostal church";
    if (den.includes("salvation_army")) return "Salvation Army";
    if (den.includes("adventist")) return "Adventist church";
    if (den.includes("reformed")) return "Reformed church";
    return "Christian church";
  }
  return "Place of worship";
}

function shortDesc(tags, type) {
  const name = tags.name ?? "";
  if (type === "Mosque") return `${name} is one of Oslo's mosques, serving the city's Muslim community.`;
  if (type === "Synagogue") return `${name} — Oslo's synagogue serving the Jewish community.`;
  if (type === "Buddhist temple") return `${name} — Buddhist place of worship in Oslo.`;
  if (type === "Church of Norway") return `${name} — Church of Norway parish church.`;
  if (type === "Roman Catholic church") return `${name} — Roman Catholic church in Oslo.`;
  return `${name} — ${type} in Oslo.`;
}

function formatAddress(tags) {
  const street = tags["addr:street"] ?? "";
  const num = tags["addr:housenumber"] ?? "";
  if (street && num) return `${street} ${num}`;
  if (street) return street;
  return "";
}

// ─── Fetch from Overpass ──────────────────────────────────────────────────────

async function fetchOsloWorshipPlaces() {
  const query = `
[out:json][timeout:60];
area["name"="Oslo"]["admin_level"="4"]->.oslo;
(
  node["amenity"="place_of_worship"](area.oslo);
  way["amenity"="place_of_worship"](area.oslo);
  relation["amenity"="place_of_worship"](area.oslo);
);
out center tags;
`.trim();

  console.log("Fetching places of worship from OpenStreetMap...");
  const body = new URLSearchParams({ data: query });
  const resp = await fetch(OVERPASS, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "WANDR-App/1.0 (building research)",
    },
    body: body.toString(),
  });
  if (!resp.ok) throw new Error(`Overpass returned ${resp.status}`);
  const data = await resp.json();
  return data.elements ?? [];
}

// ─── WANDR API ────────────────────────────────────────────────────────────────

async function addBuilding(building) {
  if (DRY_RUN) {
    console.log(`  [DRY RUN] ${building.name} (${building.short_description.split(" — ")[1] ?? ""}) @ ${building.lat.toFixed(4)},${building.lng.toFixed(4)}`);
    return "dry-run";
  }
  const resp = await fetch(`${API}/dev/add-building`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(building),
  });
  const json = await resp.json();
  return json.status;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nWANDR Oslo Religious Buildings Seed`);
  console.log(`API: ${API}`);
  console.log(`Dry run: ${DRY_RUN}\n`);

  const elements = await fetchOsloWorshipPlaces();
  console.log(`Found ${elements.length} OSM elements\n`);

  // Deduplicate by name — OSM sometimes has both a node and a way for the same building.
  // Prefer way/relation (polygon) over node (point) as it's more precisely mapped.
  const seen = new Map(); // name → element
  for (const el of elements) {
    const name = el.tags?.name?.trim();
    if (!name) continue;
    const existing = seen.get(name);
    if (!existing || el.type === "way" || el.type === "relation") {
      seen.set(name, el);
    }
  }

  const unique = [...seen.values()];
  console.log(`Unique named places: ${unique.length}`);
  console.log("─────────────────────────────────────\n");

  let inserted = 0, skipped = 0, failed = 0;

  for (const el of unique) {
    const tags = el.tags ?? {};
    const name = tags.name?.trim();
    if (!name) { failed++; continue; }

    // Extract coordinates (node has lat/lon directly; way/relation has center)
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;

    if (!lat || !lng) {
      console.log(`  SKIP (no coords) ${name}`);
      failed++;
      continue;
    }

    // Oslo bounds check (rough — Overpass area filter should already constrain this)
    if (lat < 59.8 || lat > 60.1 || lng < 10.4 || lng > 11.0) {
      console.log(`  SKIP (out of bounds) ${name}`);
      failed++;
      continue;
    }

    const type = buildingType(tags);
    const year = parseYear(tags.start_date ?? tags["building:start_date"]);
    const address = formatAddress(tags);
    const architect = tags.architect ?? null;

    const building = {
      name,
      short_description: shortDesc(tags, type),
      description: [
        shortDesc(tags, type),
        tags.description ?? "",
        tags.wikipedia ? `Wikipedia: ${tags.wikipedia}` : "",
        tags.website ? `Website: ${tags.website}` : "",
      ].filter(Boolean).join(" ").trim().slice(0, 2000),
      architect,
      year_completed: year,
      address,
      city: "Oslo",
      lat,
      lng,
      categories: ["religious"],
      era: eraFromYear(year),
    };

    const status = await addBuilding(building);

    if (status === "inserted" || status === "dry-run") {
      const typeLabel = type.padEnd(26);
      console.log(`  ✓ ${typeLabel} ${name} (${year ?? "?"})`);
      inserted++;
    } else if (status === "skipped") {
      console.log(`  · already exists  ${name}`);
      skipped++;
    } else {
      console.log(`  ✗ error           ${name}: ${status}`);
      failed++;
    }

    // Small delay to avoid hammering the API
    if (!DRY_RUN) await sleep(80);
  }

  console.log(`\n── Done ──`);
  console.log(`  Inserted: ${inserted}`);
  console.log(`  Skipped:  ${skipped}`);
  console.log(`  Failed:   ${failed}`);
  console.log(`  Total:    ${unique.length}\n`);
}

main().catch(err => { console.error(err); process.exit(1); });

#!/usr/bin/env node
/**
 * Scrapes buildings from Oslo Byleksikon (MediaWiki API) and inserts them
 * into the WANDR database via the seed endpoint.
 *
 * Usage:
 *   node scripts/seed-byleksikon.mjs
 *   WANDR_API=https://test-production-8a18.up.railway.app/api/v1 node scripts/seed-byleksikon.mjs
 */

const API = process.env.WANDR_API ?? "https://test-production-8a18.up.railway.app/api/v1";
const MW_API = "https://oslobyleksikon.no/api.php";
const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const DRY_RUN = process.env.DRY_RUN === "1";

// Categories to scrape + how to map them to WANDR building_category enum values.
// Entries can appear in multiple Byleksikon categories; deduplication handles that.
const CATEGORIES = [
  { slug: "Fredede_bygninger",    cats: ["landmark"],            note: "protected" },
  { slug: "Vernede_bygninger",    cats: ["landmark"],            note: "heritage-listed" },
  { slug: "Offentlige_bygninger", cats: ["civic"],               note: "public" },
  { slug: "Kulturbygninger",      cats: ["civic"],               note: "cultural" },
  { slug: "Næringsbygninger",     cats: ["industrial_heritage"], note: "commercial" },
  { slug: "Idrettsanlegg",        cats: ["civic"],               note: "sports" },
  { slug: "Stasjonsbygninger",    cats: ["industrial_heritage"], note: "stations" },
  { slug: "Brannstasjoner",       cats: ["industrial_heritage"], note: "fire stations" },
  { slug: "Forsamlingshus",       cats: ["civic"],               note: "assembly halls" },
  { slug: "Gudshus",              cats: ["religious"],           note: "religious" },
  // Church sub-categories
  { slug: "Den_norske_kirke",     cats: ["religious"],           note: "Church of Norway" },
  { slug: "Den_romersk_katolske_kirke", cats: ["religious"],    note: "Catholic" },
  { slug: "Ortodokse_kirker",     cats: ["religious"],           note: "Orthodox" },
  { slug: "Kirker",               cats: ["religious"],           note: "churches" },
  { slug: "Synagoger",            cats: ["religious"],           note: "synagogues" },
  { slug: "Mosque",               cats: ["religious"],           note: "mosques" },
  // Other sub-categories likely to have notable buildings
  { slug: "Villaer",              cats: ["landmark"],            note: "villas" },
  { slug: "Bibliotek",            cats: ["civic"],               note: "libraries" },
  { slug: "Konserthus",           cats: ["civic"],               note: "concert halls" },
  { slug: "Museer",               cats: ["civic"],               note: "museums" },
  { slug: "Kinoer",               cats: ["civic"],               note: "cinemas" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// Extract the first plausible completion year from a text blob
function extractYear(text) {
  // Prefer "ferdigstilt YYYY", "innviet YYYY", "åpnet YYYY", "bygget YYYY-YYYY"
  const completionMatch = text.match(
    /(?:ferdigstilt|innviet|åpnet|fullført|stod ferdig)[^\d]*(\d{4})/i
  );
  if (completionMatch) return parseInt(completionMatch[1]);

  // Fall back to a range like "1875-1878" → take the end year
  const rangeMatch = text.match(/(\d{4})\s*[-–]\s*(\d{4})/);
  if (rangeMatch) {
    const y = parseInt(rangeMatch[2]);
    if (y >= 1100 && y <= 2030) return y;
  }

  // Any 4-digit year in a plausible range
  const years = [...text.matchAll(/\b(1[1-9]\d{2}|20[012]\d)\b/g)]
    .map(m => parseInt(m[1]))
    .filter(y => y >= 1100 && y <= 2030);
  return years.length ? Math.max(...years) : null;
}

// Simple architect extraction — looks for names near the word "arkitekt"
function extractArchitect(text) {
  const m = text.match(
    /arkitekt(?:en|ene|ane)?\s+(?:var\s+|ble\s+)?([A-ZÆØÅ][a-zæøå]+(?: [A-ZÆØÅ][a-zæøå]+){1,3})/i
  );
  if (m) return m[1].trim();
  // "tegnet av X Y"
  const m2 = text.match(/tegnet av ([A-ZÆØÅ][a-zæøå]+(?: [A-ZÆØÅ][a-zæøå]+){1,3})/i);
  if (m2) return m2[1].trim();
  return null;
}

// ─── MediaWiki API ────────────────────────────────────────────────────────────

async function getCategoryMembers(categorySlug) {
  const url = `${MW_API}?action=query&list=categorymembers&cmtitle=Kategori:${encodeURIComponent(categorySlug)}&format=json&cmlimit=500&cmnamespace=0`;
  const resp = await fetch(url, { headers: { "User-Agent": "WANDR-App/1.0" } });
  if (!resp.ok) return [];
  const data = await resp.json();
  return (data?.query?.categorymembers ?? []).map(m => m.title);
}

async function getExtracts(titles) {
  if (!titles.length) return {};
  // MW API accepts up to 50 titles per request
  const chunks = [];
  for (let i = 0; i < titles.length; i += 20) chunks.push(titles.slice(i, i + 20));

  const result = {};
  for (const chunk of chunks) {
    const url = `${MW_API}?action=query&titles=${encodeURIComponent(chunk.join("|"))}&prop=extracts&exintro=1&explaintext=1&format=json`;
    const resp = await fetch(url, { headers: { "User-Agent": "WANDR-App/1.0" } });
    if (!resp.ok) continue;
    const data = await resp.json();
    for (const page of Object.values(data?.query?.pages ?? {})) {
      if (page.title && page.extract) result[page.title] = page.extract;
    }
    await sleep(300);
  }
  return result;
}

// ─── Nominatim geocoding ──────────────────────────────────────────────────────

let lastGeocode = 0;

async function nominatimSearch(q) {
  const wait = 1100 - (Date.now() - lastGeocode);
  if (wait > 0) await sleep(wait);
  lastGeocode = Date.now();

  const url = `${NOMINATIM}?q=${encodeURIComponent(q)}&format=json&limit=3&countrycodes=no&addressdetails=1`;
  try {
    const resp = await fetch(url, { headers: { "User-Agent": "WANDR-App/1.0" } });
    const results = await resp.json();
    const oslo = results.find(r =>
      r.address?.city === "Oslo" ||
      r.address?.county === "Oslo" ||
      r.address?.state === "Oslo"
    ) ?? results[0];
    if (!oslo) return null;
    const lat = parseFloat(oslo.lat);
    const lng = parseFloat(oslo.lon);
    if (lat < 59.7 || lat > 60.2 || lng < 10.4 || lng > 11.1) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}

// Decode HTML entities that MediaWiki injects into titles
function decodeTitle(title) {
  return title
    .replace(/&amp;/g, "&")
    .replace(/&aelig;/gi, "æ")
    .replace(/&oslash;/gi, "ø")
    .replace(/&aring;/gi, "å")
    .replace(/&#\d+;/g, "");
}

async function geocode(rawName) {
  const name = decodeTitle(rawName);

  // Try 1: full name + Oslo
  let geo = await nominatimSearch(`${name}, Oslo, Norway`);
  if (geo) return geo;

  // Try 2: strip leading "Det/Den/De/The" articles and retry
  const stripped = name.replace(/^(Det|Den|De|The)\s+/i, "");
  if (stripped !== name) {
    geo = await nominatimSearch(`${stripped}, Oslo, Norway`);
    if (geo) return geo;
  }

  // Try 3: just the name + Norway (catches things outside Oslo municipality but still in Oslo region)
  geo = await nominatimSearch(`${name}, Norway`);
  return geo;
}

// ─── WANDR API ────────────────────────────────────────────────────────────────

async function addBuilding(building) {
  if (DRY_RUN) {
    console.log("  [DRY RUN]", building.name, building.lat, building.lng);
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
  console.log(`\nWANDR Oslo Byleksikon Seed`);
  console.log(`API: ${API}`);
  console.log(`Dry run: ${DRY_RUN}\n`);

  // 1. Collect all building titles, tracking which category they came from
  console.log("── Fetching category members from Byleksikon...");
  const buildingCategories = new Map(); // title → Set of WANDR category strings

  for (const cat of CATEGORIES) {
    const titles = await getCategoryMembers(cat.slug);
    console.log(`  ${cat.slug}: ${titles.length} articles`);
    for (const title of titles) {
      if (!buildingCategories.has(title)) buildingCategories.set(title, new Set());
      for (const c of cat.cats) buildingCategories.get(title).add(c);
    }
    await sleep(300);
  }

  const allTitles = [...buildingCategories.keys()];
  console.log(`\nTotal unique buildings: ${allTitles.length}`);

  // 2. Fetch article extracts in batches
  console.log("\n── Fetching article extracts...");
  const extracts = await getExtracts(allTitles);
  console.log(`  Got extracts for ${Object.keys(extracts).length} articles`);

  // 3. Process each building
  console.log("\n── Geocoding + inserting buildings...");
  let inserted = 0, skipped = 0, failed = 0;

  for (const title of allTitles) {
    const extract = extracts[title] ?? "";

    // Skip very short articles (stubs) — likely not real buildings
    if (extract.length < 80 && !extract.includes("kirke") && !extract.includes("gård")) {
      console.log(`  SKIP (stub)    ${title}`);
      failed++;
      continue;
    }

    // Geocode by name
    const geo = await geocode(title);
    if (!geo) {
      console.log(`  SKIP (no geo)  ${title}`);
      failed++;
      continue;
    }

    const year = extractYear(extract);
    const architect = extractArchitect(extract);
    const cats = [...buildingCategories.get(title)];

    // First sentence of extract → short_description
    const firstSentence = extract.split(/[.!?]/)[0]?.trim() ?? title;
    const shortDesc = firstSentence.length > 200
      ? firstSentence.slice(0, 197) + "…"
      : firstSentence;

    const building = {
      name: title,
      short_description: shortDesc,
      description: extract.slice(0, 2000),
      architect: architect ?? null,
      year_completed: year,
      address: "",
      city: "Oslo",
      lat: geo.lat,
      lng: geo.lng,
      categories: cats,
      era: eraFromYear(year),
    };

    const status = await addBuilding(building);

    if (status === "inserted" || status === "dry-run") {
      console.log(`  ✓ ${status.padEnd(10)} ${title} (${year ?? "?"}, ${geo.lat.toFixed(4)},${geo.lng.toFixed(4)})`);
      inserted++;
    } else {
      console.log(`  · skipped     ${title}`);
      skipped++;
    }
  }

  console.log(`\n── Done ──`);
  console.log(`  Inserted: ${inserted}`);
  console.log(`  Skipped:  ${skipped}`);
  console.log(`  Failed:   ${failed}`);
  console.log(`  Total:    ${allTitles.length}\n`);
}

main().catch(err => { console.error(err); process.exit(1); });

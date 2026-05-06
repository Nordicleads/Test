#!/usr/bin/env node
/**
 * Scrapes buildings from Oslo Open House 2025 programme and inserts them
 * into the WANDR database via the seed endpoint.
 *
 * Usage:
 *   node scripts/seed-openhouse.mjs
 *   WANDR_API=https://test-production-8a18.up.railway.app/api/v1 node scripts/seed-openhouse.mjs
 *   DRY_RUN=1 node scripts/seed-openhouse.mjs
 */

const API = process.env.WANDR_API ?? "https://test-production-8a18.up.railway.app/api/v1";
const BASE_URL = "https://openhouseoslo.no";
const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const DRY_RUN = process.env.DRY_RUN === "1";

// All 76 building slugs from the 2025 programme
const SLUGS = [
  "/2025-siemensbygget/",
  "/2025-studio-hallstein/",
  "/2025-byens-tak/",
  "/2025-doga/",
  "/gamle-aker-kirke-2025-utkast/",
  "/2025-oslo-tinghus/",
  "/2025-villa-otium/",
  "/2025-nedre-sem-lave/",
  "/arbeiderleiligheten-pa-sagene/",
  "/2025-bentsebrua-ungdomsskole/",
  "/voienvolden-gard-2/",
  "/linderud-gard/",
  "/2025-vertikalen/",
  "/2025-torkeloftet/",
  "/2025-trelastlageret/",
  "/2025-aker-scholarship/",
  "/2025-fabriksen/",
  "/2025-lakkegata-75-c/",
  "/2025-arkitektens-leilighet/",
  "/2025-damstredet-20/",
  "/2025-geitmyrsveien-35-a/",
  "/2025-gyldendalhuset/",
  "/2025-hoyesteretts-hus/",
  "/2025-hoyskolen-kristiania/",
  "/2025-pressens-hus/",
  "/2025-wernergarden/",
  "/2025-villa-andenaes/",
  "/2025-ambassaden/",
  "/vigelandmuseet/",
  "/2025-hoffsjef-lovenskiolds-vei-59/",
  "/2025-house-of-svaboe/",
  "/2025-ove-kristiansens-vei-10-c/",
  "/2025-villa-eckbo/",
  "/2025-guldbergsvei-24/",
  "/2025-konvent-garden/",
  "/2025-slyngveien-3/",
  "/2025-hoffsveien-hage/",
  "/2025-smestad-hovedgard/",
  "/2025-villa-voraa/",
  "/2025-lysaker-brygge/",
  "/2025-kunstnerhjem-med-sjel-og-harmoni/",
  "/2025-trollveien-38/",
  "/2025-trollveien-42/",
  "/2025-villa-hellvik/",
  "/2025-annekset/",
  "/2025-eivinds-atelier/",
  "/2025-evenstuveien-43/",
  "/2025-hellviktangen-folkebadstue/",
  "/2025-house-on-pillars/",
  "/2025-ovre-utsiktsvei-43-b/",
  "/2025-villa-v/",
  "/2025-tryms-vei-11/",
  "/2025-bakkhaugen-kirke/",
  "/2025-kolonihagehytte-og-atelier/",
  "/2025-obos-living-lab/",
  "/setervollveien-9/",
  "/arbeiderleiligheten-pa-toyen/",
  "/2025-aulaen/",
  "/2025-byvandring/",
  "/2025-oslo-skolemuseum/",
  "/2025-sentralen/",
  "/2025-frogner-hovedgard/",
  "/2025-arbeiderboliger-pa-lilleaker/",
  "/2025-bestumhus/",
  "/2025-hovseter-ungdomsskole/",
  "/2025-prinsessealleen-8/",
  "/2025-teglsteinhuset/",
  "/2025-trehuset/",
  "/2025-sun-house/",
  "/2025-villa-johnsrud/",
  "/2025-villa-nottelia/",
  "/2025-tarnhuset-pa-batsto/",
  "/2025-villa-brone/",
  "/2025-holmsbu-kirkested/",
  "/libakken/",
  "/lidarende-26/",
  "/2025-villa-holme/",
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

// Strip HTML tags
function stripTags(html) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

// Decode common HTML entities
function decodeEntities(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&aelig;/gi, "æ")
    .replace(/&oslash;/gi, "ø")
    .replace(/&aring;/gi, "å")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)));
}

// Pull out just the "Streetname NNN" part from a raw string that may have noise before/after
function extractStreetAddress(raw) {
  // Pattern: word(s) ending in road suffix + a number, optionally with letter
  // Handles "Monrads gate 13a", "Østre Aker vei 90", "Slyngveien 3", "Geitmyrsveien 35 A"
  const m = raw.match(
    /([A-ZÆØÅ][a-zæøå]*(?:\s+[a-zæøå]+)*\s+(?:vei|veien|gate|gata|gaten|allé|alléen|plass|plassen|torg|torget|brygge|bryggen|sti|stien|grenda|stranda|lund|lunden|kollen|haugen|bakken|dalen|hagen|vollen|strøm|løkka|lykka|bråten|åsen|berg)\s+\d+[A-Za-z]?)|([A-ZÆØÅ][a-zæøå]+(?:gata|gate|gaten|veien|vei|plassen|torget|bryggen)\s+\d+[A-Za-z]?)/
  );
  if (m) return (m[1] || m[2]).trim();
  // Fallback: strip everything before the first recognisable number+street combo
  const num = raw.match(/([A-ZÆØÅ][a-zæøå\s]{2,40}\d+[A-Za-z]?)/);
  if (num) return num[1].trim();
  return raw.trim();
}

// ─── HTML Parser ──────────────────────────────────────────────────────────────

function parseBuilding(html, slug) {
  // Title — prefer the main h1
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const name = h1Match ? decodeEntities(stripTags(h1Match[1])).trim() : slug.replace(/^\/|\/$/g, "").replace(/-/g, " ");

  // Description: collect paragraph text from the main content area
  const paragraphs = [];
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let pm;
  while ((pm = pRegex.exec(html)) !== null) {
    const t = decodeEntities(stripTags(pm[1])).trim();
    // Skip nav-like short strings and the programme boilerplate
    if (t.length > 40 && !t.toLowerCase().includes("javascript") && !t.toLowerCase().includes("cookie")) {
      paragraphs.push(t);
    }
  }
  const description = paragraphs.slice(0, 5).join(" ").slice(0, 2000);

    // Strip script/style blocks before address search to avoid picking up JS/CSS junk
  const htmlClean = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");

  // Address — look for Norwegian address patterns near keywords
  let address = "";

  // Structured data / meta tags (most reliable)
  const metaAddr = htmlClean.match(/<meta[^>]+(?:address|streetAddress)[^>]+content="([^"]+)"/i);
  if (metaAddr) address = decodeEntities(metaAddr[1]).trim();

  if (!address) {
    // Norwegian address pattern in clean text: "Streetname 123, Oslo" or "Streetname 12 A"
    const addrRe = /([A-ZÆØÅ][a-zæøåA-ZÆØÅ]{2,}(?:\s+[A-ZÆØÅ][a-zæøå]+)*\s+(?:vei|veien|gate|gata|gaten|allé|alléen|plass|plassen|torg|torget|brygge|bryggen|bru|brua|sti|stien|dal|dalen|lia|lien|hagen|berg|haugen|bakken|kollen|vollen|grenda|stranda)\s+\d+[A-Za-z]?(?:\s*[,–-]\s*\d+[A-Za-z]?)?(?:,\s*(?:Oslo|Bærum|Asker|Nesodden|Drammen|Lørenskog|Oppegård))?)/;
    const addrMatch = htmlClean.match(addrRe);
    if (addrMatch) {
      const candidate = decodeEntities(addrMatch[1]).trim();
      // Reject if it looks like HTML or is too short
      if (!candidate.includes("<") && !candidate.includes(">") && candidate.length > 6) {
        address = candidate;
      }
    }
  }

  // Keyword-based fallback: "adresse: X" — only use if the extracted text looks clean
  if (!address) {
    const addrKeyMatch = htmlClean.match(/(?:adresse|besøksadresse)[:\s]*([A-ZÆØÅ][^\n<]{5,60})/i);
    if (addrKeyMatch) {
      const candidate = decodeEntities(stripTags(addrKeyMatch[1])).trim();
      if (!candidate.includes("<") && !candidate.includes(">") && candidate.length > 6 && candidate.length < 80) {
        address = candidate;
      }
    }
  }

  // JSON-LD structured data (most reliable if present) — use raw html before cleaning
  let jsonLdAddress = "";
  let jsonLdYear = null;
  let jsonLdArchitect = "";
  const jsonLdMatch = html.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
  if (jsonLdMatch) {
    try {
      const ld = JSON.parse(jsonLdMatch[1]);
      if (ld.address) {
        const a = ld.address;
        jsonLdAddress = [a.streetAddress, a.addressLocality].filter(Boolean).join(", ");
      }
      if (ld.dateCreated || ld.datePublished) {
        const y = parseInt((ld.dateCreated || ld.datePublished).slice(0, 4));
        if (y >= 1100 && y <= 2030) jsonLdYear = y;
      }
      if (ld.architect) jsonLdArchitect = typeof ld.architect === "string" ? ld.architect : ld.architect?.name ?? "";
    } catch {}
  }
  if (jsonLdAddress) address = jsonLdAddress;

  // Clean address: strip any leading non-address prefix (building name prepended)
  if (address) address = extractStreetAddress(address);

  // Year — from JSON-LD, or from common label patterns, or from year in text
  // Exclude 2025 (the Open House event year) unless explicitly a build/completion year
  let year = jsonLdYear;
  if (!year) {
    const yearLabelMatch = htmlClean.match(/(?:byggeår|oppført|tegnet|built|year|årstall|ferdigstilt|completed|stod ferdig)[:\s]*(\d{4})/i);
    if (yearLabelMatch) {
      const y = parseInt(yearLabelMatch[1]);
      if (y >= 1100 && y <= 2024) year = y;
    }
  }
  if (!year) {
    // Scan description for 4-digit years, excluding 2025 (event year)
    const years = [...description.matchAll(/\b(1[1-9]\d{2}|200\d|201\d|202[0-4])\b/g)]
      .map(m => parseInt(m[1]))
      .filter(y => y >= 1100 && y <= 2024);
    if (years.length) year = Math.max(...years);
  }

  // Architect — from JSON-LD, or keyword scan
  let architect = jsonLdArchitect || null;
  if (!architect) {
    const archMatch = html.match(
      /arkitekt(?:en|ene|ane)?\s*[:\-]?\s*([A-ZÆØÅ][a-zæøå]+(?: [A-ZÆØÅ][a-zæøå]+){1,3})/i
    );
    if (archMatch) architect = decodeEntities(archMatch[1]).trim();
  }
  if (!architect) {
    const archMatch2 = description.match(
      /(?:tegnet|designet|arkitekt)\s+(?:av\s+)?([A-ZÆØÅ][a-zæøå]+(?: [A-ZÆØÅ][a-zæøå]+){1,3})/i
    );
    if (archMatch2) architect = decodeEntities(archMatch2[1]).trim();
  }

  // Category — rough heuristic from name + description
  const lc = (name + " " + description).toLowerCase();
  let categories = ["landmark"]; // default for Open House buildings
  if (lc.includes("kirke") || lc.includes("church") || lc.includes("katedral")) {
    categories = ["religious"];
  } else if (lc.includes("rådhus") || lc.includes("tinghus") || lc.includes("skole") || lc.includes("bibliotek") || lc.includes("museum")) {
    categories = ["civic"];
  } else if (lc.includes("villa") || lc.includes("bolig") || lc.includes("leilighet") || lc.includes("hus")) {
    categories = ["landmark"];
  } else if (lc.includes("fabrikk") || lc.includes("industri") || lc.includes("lageret") || lc.includes("brygge")) {
    categories = ["industrial_heritage"];
  } else if (lc.includes("ny") || lc.includes("new") || year && year >= 2010) {
    categories = ["new_build"];
  }

  const shortDesc = (paragraphs[0] ?? name).slice(0, 200);

  return { name, address, description, shortDesc, year, architect, categories };
}

// ─── Nominatim geocoding ──────────────────────────────────────────────────────

let lastGeocode = 0;

async function nominatimSearch(q) {
  const wait = 1100 - (Date.now() - lastGeocode);
  if (wait > 0) await sleep(wait);
  lastGeocode = Date.now();

  const url = `${NOMINATIM}?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=no&addressdetails=1`;
  try {
    const resp = await fetch(url, { headers: { "User-Agent": "WANDR-App/1.0" } });
    const results = await resp.json();
    // Wider bounding box to include Bærum, Nesodden, Asker, Drammen
    const hit = results.find(r => {
      const lat = parseFloat(r.lat);
      const lng = parseFloat(r.lon);
      return lat >= 59.6 && lat <= 60.3 && lng >= 10.2 && lng <= 11.2;
    }) ?? results[0];
    if (!hit) return null;
    const lat = parseFloat(hit.lat);
    const lng = parseFloat(hit.lon);
    if (lat < 59.6 || lat > 60.3 || lng < 10.2 || lng > 11.2) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}

async function geocode(address, name) {
  // Try 1: full address + Oslo (most precise for Norwegian addresses)
  if (address) {
    let geo = await nominatimSearch(`${address}, Oslo, Norway`);
    if (geo) return geo;

    // Try 2: address + Norway (catches Bærum/Nesodden/Asker)
    geo = await nominatimSearch(`${address}, Norway`);
    if (geo) return geo;

    // Try 3: strip trailing letter suffix "75 C" → "75"
    const simplified = address.replace(/\s+[A-Za-z]$/, "");
    if (simplified !== address) {
      geo = await nominatimSearch(`${simplified}, Norway`);
      if (geo) return geo;
    }
  }

  // Try 4: name + Oslo
  let geo = await nominatimSearch(`${name}, Oslo, Norway`);
  if (geo) return geo;

  // Try 5: strip parenthetical acronyms "(DOGA)" → "Design og arkitektur Norge"
  const nameClean = name.replace(/\s*\([^)]+\)\s*/g, "").trim();
  if (nameClean !== name) {
    geo = await nominatimSearch(`${nameClean}, Oslo, Norway`);
    if (geo) return geo;
  }

  // Try 6: just the first word(s) before " – " or " - " (subtitle pattern)
  const namePrimary = name.split(/\s*[–-]\s*/)[0].trim();
  if (namePrimary !== name && namePrimary.length > 4) {
    geo = await nominatimSearch(`${namePrimary}, Oslo, Norway`);
    if (geo) return geo;
  }

  // Try 7: name + Norway (broader)
  geo = await nominatimSearch(`${name}, Norway`);
  return geo;
}

// ─── Fetch building page ──────────────────────────────────────────────────────

async function fetchPage(slug) {
  const url = `${BASE_URL}${slug}`;
  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent": "WANDR-App/1.0 (building research)",
        "Accept": "text/html",
      },
    });
    if (!resp.ok) {
      console.log(`  FETCH FAIL (${resp.status}) ${slug}`);
      return null;
    }
    return await resp.text();
  } catch (e) {
    console.log(`  FETCH ERROR ${slug}: ${e.message}`);
    return null;
  }
}

// ─── WANDR API ────────────────────────────────────────────────────────────────

async function addBuilding(building) {
  if (DRY_RUN) {
    console.log(`  [DRY RUN] ${building.name} → ${building.lat?.toFixed(4)},${building.lng?.toFixed(4)}`);
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
  console.log(`\nWANDR Oslo Open House 2025 Seed`);
  console.log(`API: ${API}`);
  console.log(`Dry run: ${DRY_RUN}`);
  console.log(`Buildings to process: ${SLUGS.length}\n`);

  let inserted = 0, skipped = 0, failed = 0;

  for (const slug of SLUGS) {
    await sleep(200); // polite crawl delay between page fetches

    const html = await fetchPage(slug);
    if (!html) { failed++; continue; }

    const { name, address, description, shortDesc, year, architect, categories } = parseBuilding(html, slug);

    if (!name || name.length < 3) {
      console.log(`  SKIP (no name)   ${slug}`);
      failed++;
      continue;
    }

    // Geocode
    const geo = await geocode(address, name);
    if (!geo) {
      console.log(`  SKIP (no geo)    ${name} [addr: "${address}"]`);
      failed++;
      continue;
    }

    const building = {
      name,
      short_description: shortDesc,
      description: description.slice(0, 2000),
      architect: architect ?? null,
      year_completed: year ?? null,
      address: address || "",
      city: "Oslo",
      lat: geo.lat,
      lng: geo.lng,
      categories,
      era: eraFromYear(year),
    };

    const status = await addBuilding(building);

    if (status === "inserted" || status === "dry-run") {
      console.log(`  ✓ ${status.padEnd(8)} ${name} (${year ?? "?"}) @ ${geo.lat.toFixed(4)},${geo.lng.toFixed(4)}`);
      inserted++;
    } else {
      console.log(`  · skipped   ${name}`);
      skipped++;
    }
  }

  console.log(`\n── Done ──`);
  console.log(`  Inserted: ${inserted}`);
  console.log(`  Skipped:  ${skipped}`);
  console.log(`  Failed:   ${failed}`);
  console.log(`  Total:    ${SLUGS.length}\n`);
}

main().catch(err => { console.error(err); process.exit(1); });

// Finds freely-licensed photographs of specific US airport lounges on
// Wikimedia Commons and matches them to lounges in lounge-sources.mjs.
//
//   node scripts/harvest-photos.mjs            # discover, print a report
//   node scripts/harvest-photos.mjs --download # also fetch matched files
//
// Why this exists: there is no legal way to obtain a real photograph of all
// 330 lounges. Airline and card-issuer press photos are copyrighted, and
// scraping review sites is worse. Commons is the one large pool of images
// under licenses that actually permit redistribution, so this script mines it
// exhaustively rather than leaving coverage to whatever someone stumbled on.
//
// Output: scripts/harvest-report.json, holding one entry per matched lounge
// with the license and attribution needed for CREDITS.md.

import { createWriteStream } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { AIRPORTS, LOUNGES } from './lounge-sources.mjs';

const API = 'https://commons.wikimedia.org/w/api.php';
// Commons asks for a descriptive agent; anonymous scripted access gets throttled.
const UA = 'lounge-directory-photo-harvest/1.0 (https://github.com/tengdu/lounge)';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'assets', 'lounges', 'real');
const reportPath = join(root, 'scripts', 'harvest-report.json');

/**
 * Licenses that permit redistribution on a public site. Everything else —
 * "fair use", non-commercial, no-derivatives, "press photo" — is excluded.
 * Matched against Commons' machine-readable license short name.
 */
const FREE_LICENSE = /^(cc0|cc[ -]by(?![ -]nc|[ -]nd)|public domain|pd[ -]|attribution)/i;
const NONFREE_HINT = /(fair use|non[- ]commercial|nc\b|nd\b|copyright|all rights reserved)/i;

/**
 * Brand fingerprints. A file only matches a lounge if its title or description
 * names the brand — "some lounge at JFK" is not evidence about which lounge.
 */
const BRAND_PATTERNS = [
  ['delta-one', /\bdelta\s*one\s+lounge\b/i],
  ['delta-sky-club', /\b(delta\s+)?sky\s*club\b/i],
  ['united-polaris', /\bpolaris\s+lounge\b/i],
  ['united-club-fly', /\bunited\s+club\s+fly\b/i],
  ['united-club', /\bunited\s+club\b/i],
  ['flagship', /\bflagship\s+(lounge|first|dining)\b/i],
  ['provisions', /\bprovisions\b/i],
  ['admirals', /\badmirals\s+club\b/i],
  ['alaska', /\balaska\s+lounge\b/i],
  ['centurion', /\bcenturion\s+lounge\b/i],
  ['capital-one-landing', /\bcapital\s+one\s+landing\b/i],
  ['capital-one-lounge', /\bcapital\s+one\s+lounge\b/i],
  ['chase-sapphire-terrace', /\bsapphire\s+terrace\b/i],
  ['chase-sapphire', /\bsapphire\s+lounge\b/i],
  ['escape', /\bescape\s+lounge\b/i],
  ['plaza-premium-first', /\bplaza\s+premium\s+first\b/i],
  ['plaza-premium', /\bplaza\s+premium\b/i],
  ['the-club', /\bthe\s+club\s+(at\s+)?[a-z]{3}\b/i],
  ['uso', /\buso\b/i],
  ['jetblue', /\b(jetblue|bluehouse)\b/i],
  ['hawaiian', /\b(plumeria|premier\s+club)\b/i],
];

/**
 * Airport aliases for matching prose. The IATA code alone is ambiguous in
 * running text ("SEA" appears inside "Chelsea"), so codes are matched as
 * standalone tokens and city/airport names carry most of the weight.
 */
const AIRPORT_ALIASES = {
  ANC: ['Ted Stevens', 'Anchorage'],
  ATL: ['Hartsfield', 'Atlanta'],
  AUS: ['Austin-Bergstrom', 'Austin Bergstrom', 'Austin'],
  BOS: ['Logan', 'Boston'],
  BWI: ['Baltimore'],
  CLT: ['Charlotte Douglas', 'Charlotte'],
  CVG: ['Cincinnati'],
  DCA: ['Reagan National', 'Reagan Washington', 'National Airport'],
  DEN: ['Denver'],
  DFW: ['Dallas/Fort Worth', 'Dallas-Fort Worth', 'Dallas Fort Worth', 'Dallas'],
  DTW: ['Detroit Metropolitan', 'Detroit'],
  EWR: ['Newark Liberty', 'Newark'],
  FLL: ['Fort Lauderdale'],
  HNL: ['Daniel K. Inouye', 'Honolulu'],
  IAD: ['Dulles'],
  IAH: ['George Bush Intercontinental', 'Houston Intercontinental', 'Houston'],
  JFK: ['John F. Kennedy', 'Kennedy International', 'New York JFK'],
  LAS: ['Harry Reid', 'McCarran', 'Las Vegas'],
  LAX: ['Los Angeles International', 'Los Angeles'],
  LGA: ['LaGuardia'],
  MCO: ['Orlando'],
  MIA: ['Miami'],
  MSP: ['Minneapolis'],
  MSY: ['Louis Armstrong', 'New Orleans'],
  ORD: ["O'Hare", 'OHare', 'Chicago'],
  PDX: ['Portland'],
  PHL: ['Philadelphia'],
  PHX: ['Sky Harbor', 'Phoenix'],
  PIT: ['Pittsburgh'],
  RDU: ['Raleigh'],
  SAN: ['San Diego'],
  SEA: ['Seattle-Tacoma', 'Seattle–Tacoma', 'Sea-Tac', 'SeaTac', 'Seattle'],
  SFO: ['San Francisco'],
  SJC: ['San Jose'],
  SJU: ['San Juan', 'Luis Muñoz Marín'],
  SLC: ['Salt Lake City'],
  TPA: ['Tampa'],
  TUL: ['Tulsa'],
};

/**
 * Photos that are demonstrably not a lounge interior. Commons descriptions are
 * chatty — an aircraft photo whose caption happens to mention the Sky Club the
 * photographer had just left will otherwise sail through the brand test.
 */
const NOT_A_LOUNGE = [
  /\b[NC]\d{2,5}[A-Z]{0,2}\b/, // aircraft registration
  /\b(a3[1234]\d|a220|a350|a380|b7[3457]7|7[3457]7|md-?8\d|crj|e1[79]\d|dc-?\d)\b/i,
  /\b(boeing|airbus|embraer|bombardier)\b/i,
  /\b(taxiing|takeoff|taking off|landing|apron|runway \d|pushback|tarmac|in flight|cockpit)\b/i,
  /\b(tower|skyline|parking garage|rental car|baggage claim|jet bridge)\b/i,
];

/** Concourse/terminal hints, used to pin a photo to one club at a busy airport. */
const PLACE_PATTERNS = [
  [/\bconcourse\s+([a-g])\b/i, (m) => `concourse ${m[1].toLowerCase()}`],
  [/\bterminal\s+([1-9a-e])\b/i, (m) => `terminal ${m[1].toLowerCase()}`],
  [/\bgate\s+([a-z]?\s?\d{1,3})\b/i, (m) => `gate ${m[1].replace(/\s/g, '').toLowerCase()}`],
  [/\bnorth\s+satellite\b/i, () => 'north satellite'],
  [/\b([a-g])\s+concourse\b/i, (m) => `concourse ${m[1].toLowerCase()}`],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(params) {
  const url = `${API}?${new URLSearchParams({ format: 'json', formatversion: '2', ...params })}`;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (attempt === 3) throw err;
      await sleep(500 * 2 ** attempt);
    }
  }
}

/** Every file in a category, walking one level of subcategories. */
async function filesInCategory(title, depth = 1, seen = new Set()) {
  if (seen.has(title)) return [];
  seen.add(title);

  const out = [];
  let cont;
  do {
    const r = await api({
      action: 'query',
      list: 'categorymembers',
      cmtitle: title,
      cmlimit: '500',
      cmtype: 'file|subcat',
      ...(cont ? { cmcontinue: cont } : {}),
    });
    for (const m of r.query?.categorymembers ?? []) {
      if (m.ns === 6) out.push(m.title);
      else if (m.ns === 14 && depth > 0) out.push(...(await filesInCategory(m.title, depth - 1, seen)));
    }
    cont = r.continue?.cmcontinue;
  } while (cont);
  return out;
}

async function search(srsearch, limit = 200) {
  const out = [];
  let offset = 0;
  while (out.length < limit) {
    const r = await api({
      action: 'query',
      list: 'search',
      srsearch,
      srnamespace: '6',
      srlimit: '50',
      sroffset: String(offset),
    });
    const hits = r.query?.search ?? [];
    out.push(...hits.map((h) => h.title));
    if (!r.continue) break;
    offset = r.continue.sroffset;
  }
  return out;
}

/** License + attribution + description for a batch of files (50 max per call). */
async function fileInfo(titles) {
  const out = [];
  for (let i = 0; i < titles.length; i += 50) {
    const r = await api({
      action: 'query',
      titles: titles.slice(i, i + 50).join('|'),
      prop: 'imageinfo',
      iiprop: 'url|extmetadata|size|mime',
      iiextmetadatafilter: 'LicenseShortName|UsageTerms|Artist|Credit|ImageDescription|LicenseUrl',
    });
    for (const page of r.query?.pages ?? []) {
      const info = page.imageinfo?.[0];
      if (!info) continue;
      const meta = info.extmetadata ?? {};
      const value = (k) => (meta[k]?.value ?? '').replace(/<[^>]*>/g, '').trim();
      out.push({
        title: page.title,
        url: info.url,
        descriptionUrl: info.descriptionurl,
        mime: info.mime,
        width: info.width,
        height: info.height,
        license: value('LicenseShortName'),
        licenseUrl: value('LicenseUrl'),
        usageTerms: value('UsageTerms'),
        artist: value('Artist'),
        credit: value('Credit'),
        description: value('ImageDescription'),
      });
    }
    await sleep(120);
  }
  return out;
}

function isFree(file) {
  const lic = file.license || file.usageTerms;
  if (!lic) return false;
  if (NONFREE_HINT.test(lic) && !/^cc[ -]by([ -]sa)?[ -]?\d/i.test(lic)) return false;
  return FREE_LICENSE.test(lic);
}

/** Which airports a file's text mentions. */
function airportsIn(text) {
  const found = new Set();
  for (const code of Object.keys(AIRPORTS)) {
    // Standalone uppercase token, so "SEA" does not fire inside "Chelsea".
    if (new RegExp(`(^|[^A-Za-z])${code}([^A-Za-z]|$)`).test(text)) found.add(code);
  }
  for (const [code, aliases] of Object.entries(AIRPORT_ALIASES)) {
    for (const alias of aliases) {
      if (text.toLowerCase().includes(alias.toLowerCase())) found.add(code);
    }
  }
  return [...found];
}

function brandIn(text) {
  for (const [brand, re] of BRAND_PATTERNS) if (re.test(text)) return brand;
  return null;
}

function placesIn(text) {
  const out = new Set();
  for (const [re, fmt] of PLACE_PATTERNS) {
    const m = text.match(re);
    if (m) out.add(fmt(m));
  }
  return [...out];
}

const slug = (str) =>
  str.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function loungeId(code, name, location) {
  return `${code.toLowerCase()}-${slug(name)}-${slug(location)}`;
}

/**
 * Match a file to a lounge.
 *
 * `exact` means the file identifies one specific room — either it is the only
 * lounge of that brand at the airport, or the title names its concourse.
 * `airport` means we know the brand and airport but not which of several
 * rooms, which is still a real photo of a real club the traveller will
 * recognise, just possibly a sibling location. Anything vaguer is dropped.
 */
function matchLounge(file, index) {
  const title = file.title.replace(/^File:/, '');
  const text = `${title} ${file.description} ${file.credit}`;

  if (NOT_A_LOUNGE.some((re) => re.test(title))) return null;

  // The brand has to be named in the title, or named in a description that is
  // clearly describing an airport interior. A passing mention is not evidence.
  let brand = brandIn(title);
  if (!brand) {
    const inDescription = brandIn(file.description);
    const airportish = /\b(airport|terminal|concourse|lounge)\b/i.test(file.description);
    if (!inDescription || !airportish) return null;
    if (NOT_A_LOUNGE.some((re) => re.test(text))) return null;
    brand = inDescription;
  }

  const codes = airportsIn(text);
  if (codes.length !== 1) return null; // ambiguous or unknown airport
  const code = codes[0];

  const candidates = index.filter((l) => l.code === code && l.brand === brand);
  if (candidates.length === 0) return null;

  if (candidates.length === 1) {
    return { lounge: candidates[0], scope: 'exact', brand };
  }

  const places = placesIn(text);
  if (places.length > 0) {
    const pinned = candidates.filter((l) => {
      const loc = l.location.toLowerCase();
      return places.every((p) => loc.includes(p));
    });
    if (pinned.length === 1) return { lounge: pinned[0], scope: 'exact', brand };
  }

  // Known brand at a known airport, unknown room. Attach to the first
  // location so the airport still gets a real photograph, labelled honestly.
  return { lounge: candidates[0], scope: 'airport', brand };
}

async function download(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
}

async function main() {
  const wantDownload = process.argv.includes('--download');

  const index = LOUNGES.map(([code, name, location, brand]) => ({
    code,
    name,
    location,
    brand,
    id: loungeId(code, name, location),
  }));

  console.log(`Indexed ${index.length} lounges.\nDiscovering Commons candidates…`);

  const categories = [
    'Category:Airport lounges in the United States',
    'Category:Airport lounges',
    'Category:Delta Sky Club',
    'Category:United Club',
    'Category:Admirals Club',
    'Category:Plaza Premium Lounge',
    'Category:Business class airport lounges',
    'Category:First class airport lounges',
  ];

  // `intitle:` is high-precision — a Commons uploader who names a file after a
  // lounge is nearly always photographing that lounge. The looser full-text
  // queries backfill, and the matcher throws out whatever they drag in.
  const brandTitles = [
    'Sky Club', 'United Club', 'Polaris Lounge', 'Admirals Club', 'Flagship Lounge',
    'Centurion Lounge', 'Capital One Lounge', 'Capital One Landing', 'Sapphire Lounge',
    'Alaska Lounge', 'Escape Lounge', 'Plaza Premium', 'Delta One Lounge', 'USO',
  ];

  const queries = [
    ...brandTitles.map((b) => `intitle:"${b}"`),
    // Per-airport sweep: any file whose title says "lounge" and names the airport.
    ...Object.entries(AIRPORT_ALIASES).map(([code, aliases]) => `intitle:lounge ${aliases[0]} ${code}`),
    'Sky Club airport lounge',
    'United Club lounge airport',
    'Admirals Club American Airlines lounge',
    'Centurion Lounge American Express',
    'Capital One Lounge airport',
    'Alaska Lounge airport',
    'Escape Lounge airport',
    'airport lounge interior United States',
  ];

  const titles = new Set();
  for (const cat of categories) {
    try {
      const files = await filesInCategory(cat);
      files.forEach((f) => titles.add(f));
      console.log(`  ${cat}: ${files.length}`);
    } catch (err) {
      console.log(`  ${cat}: failed (${err.message})`);
    }
  }
  for (const q of queries) {
    try {
      const files = await search(q);
      files.forEach((f) => titles.add(f));
      console.log(`  search "${q}": ${files.length}`);
    } catch (err) {
      console.log(`  search "${q}": failed (${err.message})`);
    }
  }

  console.log(`\n${titles.size} unique candidate files. Fetching license metadata…`);
  const files = await fileInfo([...titles]);

  const bitmap = files.filter((f) => /^image\/(jpeg|png|webp)$/.test(f.mime) && f.width >= 900);
  const free = bitmap.filter(isFree);
  console.log(`${bitmap.length} usable bitmaps, ${free.length} under a free license.`);

  // Best photo per lounge: prefer an exact-room match, then the largest file.
  const best = new Map();
  for (const file of free) {
    const match = matchLounge(file, index);
    if (!match) continue;
    const key = match.lounge.id;
    const score = (match.scope === 'exact' ? 1e9 : 0) + file.width * file.height;
    const existing = best.get(key);
    if (!existing || score > existing.score) {
      best.set(key, { file, ...match, score });
    }
  }

  const matched = [...best.values()].sort((a, b) => a.lounge.id.localeCompare(b.lounge.id));
  const exact = matched.filter((m) => m.scope === 'exact').length;

  console.log(`\nMatched ${matched.length} lounges (${exact} exact-room, ${matched.length - exact} brand-at-airport).`);
  for (const m of matched) {
    console.log(`  [${m.scope.padEnd(7)}] ${m.lounge.id}\n            ${m.file.title} — ${m.file.license}`);
  }

  const report = matched.map((m) => ({
    loungeId: m.lounge.id,
    scope: m.scope,
    slug: m.lounge.id,
    commonsTitle: m.file.title,
    descriptionUrl: m.file.descriptionUrl,
    downloadUrl: m.file.url,
    license: m.file.license,
    licenseUrl: m.file.licenseUrl,
    artist: m.file.artist,
    width: m.file.width,
    height: m.file.height,
  }));

  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`\nWrote ${reportPath}`);

  if (!wantDownload) {
    console.log('Re-run with --download to fetch the matched files.');
    return;
  }

  await mkdir(outDir, { recursive: true });
  for (const entry of report) {
    const dest = join(outDir, `${entry.slug}.jpg`);
    try {
      await download(entry.downloadUrl, dest);
      console.log(`  downloaded ${entry.slug}.jpg`);
    } catch (err) {
      console.log(`  FAILED ${entry.slug}: ${err.message}`);
    }
    await sleep(200);
  }
}

main();

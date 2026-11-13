// Builds indoor floor plans for lounges from OpenStreetMap indoor mapping.
//
//   node scripts/fetch-indoor-maps.mjs            # all airports
//   node scripts/fetch-indoor-maps.mjs SEA SFO    # just these
//   node scripts/fetch-indoor-maps.mjs --refresh  # ignore the cache
//
// Writes public/maps/<lounge-id>.svg plus src/data/indoor-maps.ts, which says
// which lounges have a plan and what gates sit either side of them.
//
// Why not a maps app: Google and Apple can route you to a terminal, not to a
// room inside it. Airports navigate by gate number, so the useful picture is
// the concourse with the lounge marked and the gates labelled — which is
// exactly what OSM's indoor tagging holds, where anyone has bothered to map
// it. Coverage is uneven and that is fine: a lounge without a plan simply
// does not show one.
//
// Overpass is rate-limited and flaky under load, so every response is cached
// in .cache/overpass/ and re-runs are cheap.

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { AIRPORTS, LOUNGES } from './lounge-sources.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cacheDir = join(root, '.cache', 'overpass');
const mapsDir = join(root, 'public', 'maps');
const manifestOut = join(root, 'src', 'data', 'indoor-maps.ts');

const MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
const UA = 'lounge-directory-indoor-maps/1.0 (https://github.com/tengdu/lounge)';

/** Names OSM contributors give these lounges. Broad on purpose — the airport
 *  and brand check downstream is what actually decides a match. */
const LOUNGE_NAME_RE =
  'Sky Club|United Club|Admirals Club|Centurion|Polaris|Capital One|Sapphire Lounge|' +
  'Alaska Lounge|Escape Lounge|Flagship|Plaza Premium|The Club|USO|Maple Leaf|Clubhouse|' +
  'Galleries|Crown Lounge|Sakura|Prestige|Bluehouse|Provisions|Lounge';

/** Same brand fingerprints as the photo harvester, matched against OSM names. */
const BRAND_PATTERNS = [
  ['delta-one', /\bdelta\s*one\s+lounge\b/i],
  ['delta-sky-club', /\bsky\s*club\b/i],
  ['united-polaris', /\bpolaris\b/i],
  ['united-club-fly', /\bunited\s+club\s+fly\b/i],
  ['united-club', /\bunited\s+club\b/i],
  ['flagship', /\bflagship\b/i],
  ['provisions', /\bprovisions\b/i],
  ['admirals', /\badmirals\b/i],
  ['alaska', /\balaska\s+lounge\b/i],
  ['centurion', /\bcenturion\b/i],
  ['capital-one-landing', /\bcapital\s+one\s+landing\b/i],
  ['capital-one-lounge', /\bcapital\s+one\b/i],
  ['chase-sapphire-terrace', /\bsapphire\s+terrace\b/i],
  ['chase-sapphire', /\bsapphire\b/i],
  ['escape', /\bescape\s+lounge\b/i],
  ['plaza-premium-first', /\bplaza\s+premium\s+first\b/i],
  ['plaza-premium', /\bplaza\s+premium\b/i],
  ['the-club', /\bthe\s+club\b/i],
  ['uso', /\buso\b/i],
  ['jetblue', /\b(jetblue|bluehouse)\b/i],
  ['foreign-first', /\b(senator|first\s+class\s+lounge|qantas\s+first)\b/i],
  ['foreign-business', /\b(maple\s+leaf|clubhouse|galleries|crown\s+lounge|sakura|prestige|dynasty|maharaja)\b/i],
];

const RADIUS_M = 260;

/** Half-height as a fraction of half-width. Keep in sync with the aspect box
 *  in src/components/FloorPlan.tsx. */
const ASPECT_H = 0.3;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const slug = (s) =>
  s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function cachePath(query) {
  return join(cacheDir, `${createHash('sha1').update(query).digest('hex')}.json`);
}

async function overpass(query, { refresh = false } = {}) {
  const file = cachePath(query);
  if (!refresh && existsSync(file)) return JSON.parse(readFileSync(file, 'utf8'));

  for (let attempt = 0; attempt < 4; attempt++) {
    const url = MIRRORS[attempt % MIRRORS.length];
    try {
      const res = await fetch(url, {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
        headers: { 'User-Agent': UA },
        signal: AbortSignal.timeout(100_000),
      });
      const text = await res.text();
      // Overpass answers overload with an HTML error page, not a status code.
      if (text.trimStart().startsWith('{')) {
        mkdirSync(cacheDir, { recursive: true });
        writeFileSync(file, text);
        return JSON.parse(text);
      }
    } catch {
      // fall through to the backoff
    }
    await sleep(3000 * (attempt + 1));
  }
  return null;
}

const centre = (el) => (el.center ? el.center : { lat: el.lat, lon: el.lon });

function brandOf(name) {
  for (const [brand, re] of BRAND_PATTERNS) if (re.test(name)) return brand;
  return null;
}

/** The pier a location names — "Concourse B", "Terminal G", "the C gates". */
function pierLetter(location) {
  return (
    location.match(/\bConcourse\s+([A-Z])\b/)?.[1] ??
    location.match(/\bTerminal\s+([A-Z])\b/)?.[1] ??
    location.match(/\bthe\s+([A-Z])\s+gates\b/)?.[1] ??
    null
  );
}

/**
 * Does this OSM point actually sit where our dataset says the lounge is?
 *
 * Brand plus airport is not enough: ORD has three United Clubs, and pairing
 * the Concourse C one with the Concourse B point produces a floor plan that
 * confidently sends people to the wrong pier. Gate references are the check —
 * they are how airports are laid out and signposted.
 *
 * Returns true (confirmed), false (contradicted), or null (nothing to check
 * against, e.g. "Main Terminal, after the checkpoint").
 */
function confirmsLocation(lounge, nearbyRefs) {
  const refs = nearbyRefs.map((r) => r.toUpperCase());
  if (refs.length === 0) return null;

  if (lounge.gate) {
    const gate = lounge.gate.toUpperCase();
    if (refs.includes(gate)) return true;
    const m = gate.match(/^([A-Z]*)(\d+)/);
    if (m) {
      for (const ref of refs) {
        const rm = ref.match(/^([A-Z]*)(\d+)/);
        // Same pier, and close enough along it to be the same room.
        if (rm && rm[1] === m[1] && Math.abs(Number(rm[2]) - Number(m[2])) <= 8) return true;
      }
    }
    return false;
  }

  const letter = pierLetter(lounge.location);
  if (letter) return refs.some((r) => r.startsWith(letter));
  return null;
}

/** Metres between two coordinates — near enough at airport scale. */
function metres(a, b) {
  const k = Math.cos((a.lat * Math.PI) / 180);
  const dx = (a.lon - b.lon) * k * 111320;
  const dy = (a.lat - b.lat) * 111320;
  return Math.hypot(dx, dy);
}

/** Levels are tagged "1", "0;1" or "1;2" — a way can span several. */
function levelsOf(tags) {
  if (tags?.level === undefined) return [];
  return String(tags.level).split(';').map((s) => s.trim());
}

// ---------------------------------------------------------------- geometry

/**
 * Rotate the plan so the concourse runs left-to-right. Concourses are long
 * thin things at arbitrary compass angles; drawn unrotated, a diagonal pier
 * wastes most of the frame on empty apron.
 */
function principalAngle(points) {
  const n = points.length;
  if (n < 2) return 0;
  const mx = points.reduce((s, p) => s + p.x, 0) / n;
  const my = points.reduce((s, p) => s + p.y, 0) / n;
  let sxx = 0, syy = 0, sxy = 0;
  for (const p of points) {
    const dx = p.x - mx;
    const dy = p.y - my;
    sxx += dx * dx;
    syy += dy * dy;
    sxy += dx * dy;
  }
  return 0.5 * Math.atan2(2 * sxy, sxx - syy);
}

function makeProjector(lat0, lon0) {
  const k = Math.cos((lat0 * Math.PI) / 180);
  return (lat, lon) => ({ x: (lon - lon0) * k * 111320, y: -(lat - lat0) * 111320 });
}

const rotator = (angle) => {
  const c = Math.cos(-angle);
  const s = Math.sin(-angle);
  return (p) => ({ x: p.x * c - p.y * s, y: p.x * s + p.y * c });
};

// ------------------------------------------------------------------- svg

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function renderSvg({ rooms, walls, target, gates, lounge }) {
  const all = [...rooms.flat(), ...walls.flat(), ...target];
  if (all.length === 0) return null;

  // Frame on the lounge, wide enough to carry the gates either side of it.
  const tx = target.reduce((s, p) => s + p.x, 0) / target.length;
  const ty = target.reduce((s, p) => s + p.y, 0) / target.length;

  const reach = Math.max(
    120,
    ...gates.map((g) => Math.max(Math.abs(g.x - tx), Math.abs(g.y - ty) * 2.2) + 30)
  );
  // Fixed aspect across every plan: the page reserves one box for these, and
  // a plan whose own ratio drifted would get cropped to fit it.
  const halfW = Math.min(Math.max(reach, 150), 320);
  const halfH = halfW * ASPECT_H;

  const minX = tx - halfW;
  const maxX = tx + halfW;
  const minY = ty - halfH;
  const maxY = ty + halfH;
  const W = maxX - minX;
  const H = maxY - minY;

  const inFrame = (p) => p.x >= minX - 40 && p.x <= maxX + 40 && p.y >= minY - 40 && p.y <= maxY + 40;
  const pts = (ring) =>
    ring.map((p) => `${(p.x - minX).toFixed(1)},${(p.y - minY).toFixed(1)}`).join(' ');

  const visibleRooms = rooms.filter((r) => r.some(inFrame));
  const visibleWalls = walls.filter((w) => w.some(inFrame));

  // Dedupe gates by ref, keep the one nearest the lounge, then drop any label
  // that would sit on top of one already placed.
  const byRef = new Map();
  for (const g of gates) {
    if (!g.ref) continue;
    const d = Math.hypot(g.x - tx, g.y - ty);
    const prev = byRef.get(g.ref);
    if (!prev || d < prev.d) byRef.set(g.ref, { ...g, d });
  }
  // Where the lounge's own label will sit, so gate pills can dodge it.
  const labelY = ty - minY < 26 ? ty - minY + 26 : ty - minY - 16;
  const labelHalfW = lounge.name.length * 3.4 + 10;

  const placed = [];
  for (const g of [...byRef.values()].sort((a, b) => a.d - b.d)) {
    if (!inFrame(g)) continue;
    if (placed.some((p) => Math.hypot(p.x - g.x, p.y - g.y) < 26)) continue;
    const gx = g.x - minX;
    const gy = g.y - minY;
    if (Math.abs(gy - labelY) < 11 && Math.abs(gx - (tx - minX)) < labelHalfW) continue;
    placed.push(g);
  }

  const scaleBar = 50; // metres
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W.toFixed(0)} ${H.toFixed(0)}" role="img" aria-label="Floor plan showing ${esc(lounge.name)} and nearby gates">`,
    `<rect width="100%" height="100%" fill="#f7f7f9"/>`,
    `<g>`,
    ...visibleRooms.map((r) => `<polygon points="${pts(r)}" fill="#ffffff" stroke="#e2e2e7" stroke-width="0.7"/>`),
    ...visibleWalls.map((w) => `<polyline points="${pts(w)}" fill="none" stroke="#c7c7cf" stroke-width="1.1" stroke-linecap="round"/>`),
    `</g>`,
    `<polygon points="${pts(target)}" fill="#0071e3" fill-opacity="0.9" stroke="#0071e3" stroke-width="2" stroke-linejoin="round"/>`,
  ];

  for (const g of placed) {
    const x = (g.x - minX).toFixed(1);
    const y = (g.y - minY).toFixed(1);
    const w = Math.max(15, String(g.ref).length * 5.4 + 8);
    parts.push(
      `<g><rect x="${(Number(x) - w / 2).toFixed(1)}" y="${(Number(y) - 6.5).toFixed(1)}" width="${w.toFixed(1)}" height="13" rx="6.5" fill="#ffffff" stroke="#c7c7cf" stroke-width="0.8"/>` +
        `<text x="${x}" y="${(Number(y) + 3.4).toFixed(1)}" font-family="system-ui,-apple-system,sans-serif" font-size="8" font-weight="600" text-anchor="middle" fill="#3a3a3e">${esc(g.ref)}</text></g>`
    );
  }

  parts.push(
    `<text x="${(tx - minX).toFixed(1)}" y="${labelY.toFixed(1)}" font-family="system-ui,-apple-system,sans-serif" font-size="11" font-weight="700" text-anchor="middle" fill="#0071e3" paint-order="stroke" stroke="#f7f7f9" stroke-width="3.5">${esc(lounge.name)}</text>`
  );

  parts.push(
    `<g opacity="0.75"><line x1="12" y1="${(H - 12).toFixed(1)}" x2="${(12 + scaleBar).toFixed(1)}" y2="${(H - 12).toFixed(1)}" stroke="#86868b" stroke-width="1.4"/>` +
      `<text x="12" y="${(H - 16).toFixed(1)}" font-family="system-ui,-apple-system,sans-serif" font-size="7.5" fill="#86868b">${scaleBar} m</text></g>`
  );
  parts.push('</svg>');
  return parts.join('\n');
}

// ------------------------------------------------------------------ main

async function main() {
  const args = process.argv.slice(2);
  const refresh = args.includes('--refresh');
  const only = args.filter((a) => !a.startsWith('--'));
  const codes = only.length > 0 ? only : [...new Set(LOUNGES.map(([c]) => c))];

  // Our lounges, indexed for matching.
  const ours = LOUNGES.map(([code, name, location, brand]) => ({
    code,
    name,
    location,
    brand,
    id: `${code.toLowerCase()}-${slug(name)}-${slug(location)}`,
    gate: location.match(/\bGates?\s+([A-Z]?\d+[A-Z]?)\b/)?.[1] ?? null,
  }));

  mkdirSync(mapsDir, { recursive: true });
  const manifest = {};
  let noAirport = 0;
  let noMatch = 0;
  let sparse = 0;

  for (const code of codes) {
    if (!AIRPORTS[code]) {
      console.log(`${code}: not an airport in the dataset, skipping`);
      continue;
    }

    // One query per airport, not one per lounge. Asking Overpass for a 260m
    // circle of geometry around each lounge separately meant ~250 requests and
    // hours of throttling; the whole airport's indoor layer is a single
    // download that every lounge at that airport then slices locally.
    const query = `[out:json][timeout:180];
nwr["aeroway"="aerodrome"]["iata"="${code}"]->.ap;
.ap map_to_area->.apa;
(
  way["indoor"](area.apa);
  node["aeroway"="gate"](area.apa);
  nwr["name"~"${LOUNGE_NAME_RE}",i](area.apa);
);
out geom tags;`;

    const cached = existsSync(cachePath(query));
    const found = await overpass(query, { refresh });
    if (!cached) await sleep(1500);
    if (!found) {
      console.log(`${code}: Overpass unavailable`);
      noAirport++;
      continue;
    }

    // A way carries `geometry`; its centre has to be derived from that.
    for (const el of found.elements) {
      if (el.type === 'way' && el.geometry && !el.center) {
        const n = el.geometry.length;
        el.center = {
          lat: el.geometry.reduce((s, p) => s + p.lat, 0) / n,
          lon: el.geometry.reduce((s, p) => s + p.lon, 0) / n,
        };
      }
    }

    const pois = found.elements.filter(
      (e) => e.tags?.name && brandOf(e.tags.name) && (e.center || e.lat !== undefined)
    );
    const airportLounges = ours.filter((l) => l.code === code);

    // Pair each OSM POI with one of our lounges: same airport, same brand, and
    // gate references that agree. A pairing we cannot confirm is dropped —
    // an unlabelled lounge is a small gap, a plan of the wrong concourse is a
    // wrong direction.
    const gateNodes = found.elements.filter((e) => e.tags?.aeroway === 'gate' && e.tags?.ref);
    const claimed = new Set();
    const pairs = [];
    let unconfirmed = 0;

    for (const poi of pois) {
      const brand = brandOf(poi.tags.name);
      const candidates = airportLounges.filter((l) => l.brand === brand && !claimed.has(l.id));
      if (candidates.length === 0) continue;

      const c = centre(poi);
      const nearbyRefs = [
        ...new Set(
          gateNodes
            .map((g) => ({ ref: g.tags.ref, d: metres(c, g) }))
            .filter((g) => g.d <= 170)
            .sort((a, b) => a.d - b.d)
            .map((g) => g.ref)
        ),
      ].slice(0, 8);

      // Confirm against the closest gates only. Across a wide terminal the
      // 170m list can reach the foot of a neighbouring pier — that is how a
      // Concourse E lounge got validated against a Concourse B point, on the
      // strength of a single distant "E1".
      const confirmRefs = nearbyRefs.slice(0, 4);
      const verdicts = candidates.map((l) => ({ l, ok: confirmsLocation(l, confirmRefs) }));
      const confirmed = verdicts.filter((v) => v.ok === true);
      const undetermined = verdicts.filter((v) => v.ok === null);

      let chosen = null;
      if (confirmed.length === 1) chosen = confirmed[0].l;
      else if (confirmed.length > 1) chosen = confirmed[0].l; // same pier either way
      else if (undetermined.length === 1 && candidates.length === 1) chosen = undetermined[0].l;

      if (process.env.DEBUG_MATCH) {
        console.log(
          `  POI "${poi.tags.name}" [${brand}] near ${JSON.stringify(nearbyRefs)}\n` +
            verdicts.map((v) => `      ${v.ok === null ? '?' : v.ok ? 'Y' : 'n'} ${v.l.id}`).join('\n') +
            `\n      -> ${chosen ? chosen.id : 'DROPPED'}`
        );
      }

      if (!chosen) {
        unconfirmed++;
        continue;
      }

      claimed.add(chosen.id);
      pairs.push({ poi, lounge: chosen, nearbyRefs });
    }

    if (pairs.length === 0) {
      console.log(`${code}: ${pois.length} OSM POIs, none confirmed against gate references`);
      noMatch++;
      continue;
    }

    let drawn = 0;
    for (const { poi, lounge, nearbyRefs } of pairs) {
      const c = centre(poi);
      const levels = levelsOf(poi.tags);
      const level = levels[0] ?? null;

      // Slice the airport's geometry down to this lounge's neighbourhood.
      const near = (el) => {
        const p = el.center ?? el;
        return p.lat !== undefined && metres(c, p) <= RADIUS_M;
      };
      const geo = { elements: found.elements.filter(near) };

      const project = makeProjector(c.lat, c.lon);

      const onLevel = (tags) => {
        if (level === null) return true; // untagged lounge: draw everything
        const ls = levelsOf(tags);
        return ls.length === 0 ? false : ls.includes(level);
      };

      const ways = geo.elements.filter((e) => e.type === 'way' && e.geometry && onLevel(e.tags ?? {}));
      if (ways.length < 6) continue; // too sparse to read as a plan

      const toPts = (w) => w.geometry.map((n) => project(n.lat, n.lon));
      const angle = principalAngle(ways.flatMap(toPts));
      const rot = rotator(angle);
      const place = (w) => toPts(w).map(rot);

      // The lounge itself: prefer its own mapped outline, else a small box.
      let target;
      if (poi.type === 'way') {
        const self = geo.elements.find((e) => e.type === 'way' && e.id === poi.id && e.geometry);
        if (self) target = place(self);
      }
      if (!target) {
        const p = rot(project(c.lat, c.lon));
        target = [
          { x: p.x - 14, y: p.y - 8 },
          { x: p.x + 14, y: p.y - 8 },
          { x: p.x + 14, y: p.y + 8 },
          { x: p.x - 14, y: p.y + 8 },
        ];
      }

      const isWall = (t) => t.indoor === 'wall';
      const isRoom = (t) => ['room', 'area', 'yes', 'corridor'].includes(t.indoor);

      const tcx = target.reduce((s, p) => s + p.x, 0) / target.length;
      const tcy = target.reduce((s, p) => s + p.y, 0) / target.length;

      const gates = geo.elements
        .filter((e) => e.tags?.aeroway === 'gate' && e.tags?.ref)
        .map((g) => ({ ...rot(project(g.lat, g.lon)), ref: g.tags.ref }));

      // A plan has to say something. Either the room layout around the lounge
      // is mapped, or enough gates are labelled to place it along the
      // concourse — ATL's Concourse B has almost no rooms drawn, but "between
      // B18 and B20, with B6 to B29 running past" is exactly how the airport
      // signposts itself. A lounge with neither is a marker floating in an
      // empty frame, and gets no plan at all.
      const nearbyRooms = ways.filter((w) => {
        if (!isRoom(w.tags)) return false;
        const ring = place(w);
        const cx = ring.reduce((s, p) => s + p.x, 0) / ring.length;
        const cy = ring.reduce((s, p) => s + p.y, 0) / ring.length;
        return Math.hypot(cx - tcx, cy - tcy) < 130;
      });
      const nearbyGates = new Set(
        gates.filter((g) => Math.hypot(g.x - tcx, g.y - tcy) < 260).map((g) => g.ref)
      );
      if (nearbyRooms.length < 12 && nearbyGates.size < 4) {
        sparse++;
        continue;
      }

      const svg = renderSvg({
        rooms: ways.filter((w) => isRoom(w.tags)).map(place),
        walls: ways.filter((w) => isWall(w.tags)).map(place),
        target,
        gates,
        lounge,
      });
      if (!svg) continue;

      writeFileSync(join(mapsDir, `${lounge.id}.svg`), `${svg}\n`);

      manifest[lounge.id] = {
        level,
        gates: nearbyRefs.slice(0, 3),
        osm: `${poi.type}/${poi.id}`,
        lat: Number(c.lat.toFixed(6)),
        lon: Number(c.lon.toFixed(6)),
      };
      drawn++;
    }

    console.log(
      `${code}: ${pois.length} OSM POIs -> ${pairs.length} confirmed -> ${drawn} plans` +
        (unconfirmed ? ` (${unconfirmed} unconfirmed, dropped)` : '')
    );
  }

  // Drop plans for lounges that no longer match, so public/maps cannot drift.
  const keep = new Set(Object.keys(manifest).map((id) => `${id}.svg`));
  if (only.length === 0) {
    for (const file of readdirSync(mapsDir)) {
      if (file.endsWith('.svg') && !keep.has(file)) rmSync(join(mapsDir, file));
    }
  }

  // A run over a subset only knows about that subset. Rewriting the manifest
  // from it alone would silently delete every other airport's entry, so merge
  // the existing file back in and only replace the airports we just rebuilt.
  if (only.length > 0 && existsSync(manifestOut)) {
    const rebuilt = new Set(only.map((c) => `${c.toLowerCase()}-`));
    for (const line of readFileSync(manifestOut, 'utf8').split('\n')) {
      const id = line.match(/^\s*"([a-z0-9-]+)":\s*\{/)?.[1];
      if (!id || manifest[id]) continue;
      if ([...rebuilt].some((prefix) => id.startsWith(prefix))) continue;
      manifest[id] = {
        level: JSON.parse(line.match(/level:\s*(null|"[^"]*")/)?.[1] ?? 'null'),
        gates: JSON.parse(line.match(/gates:\s*(\[[^\]]*\])/)?.[1] ?? '[]'),
        osm: line.match(/osm:\s*"([^"]+)"/)?.[1] ?? '',
        lat: Number(line.match(/lat:\s*(-?[\d.]+)/)?.[1]),
        lon: Number(line.match(/lon:\s*(-?[\d.]+)/)?.[1]),
        interactive: /interactive:\s*true/.test(line) || undefined,
      };
    }
  }

  // The interactive map is simply "a payload exists for this lounge", so read
  // it off disk rather than tracking it in two places that can disagree.
  for (const [id, entry] of Object.entries(manifest)) {
    entry.interactive = existsSync(join(mapsDir, `${id}.json`)) || undefined;
  }

  const entries = Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b));
  writeFileSync(
    manifestOut,
    `// AUTO-GENERATED by scripts/fetch-indoor-maps.mjs — do not edit by hand.
//
// Lounges for which OpenStreetMap has enough indoor mapping to draw a floor
// plan. The plan itself is a static SVG at /maps/<id>.svg; this manifest is
// what the page needs to caption and link it.
//
// ${entries.length} of ${LOUNGES.length} lounges. Coverage depends entirely on
// whether an OSM contributor has mapped that terminal's interior.

export interface IndoorMap {
  /** Building level the lounge sits on, as tagged in OSM. */
  level: string | null;
  /** Nearest gate references, closest first — how airports are signposted. */
  gates: string[];
  /** The OSM element the plan was built around. */
  osm: string;
  lat: number;
  lon: number;
  /** True when public/maps/<id>.json exists, so the page renders the
   *  pan-and-zoom airport map in place of the static plan. */
  interactive?: true;
}

export const indoorMaps: Record<string, IndoorMap> = {
${entries
  .map(
    ([id, m]) =>
      `  ${JSON.stringify(id)}: { level: ${JSON.stringify(m.level)}, gates: ${JSON.stringify(m.gates)}, osm: ${JSON.stringify(m.osm)}, lat: ${m.lat}, lon: ${m.lon}${m.interactive ? ', interactive: true' : ''} },`
  )
  .join('\n')}
};
`
  );

  console.log(
    `\n${entries.length} floor plans written to public/maps/\n` +
      `manifest: ${manifestOut}` +
      (noAirport ? `\n${noAirport} airports failed to fetch` : '') +
      (noMatch ? `\n${noMatch} airports had no matchable lounge POIs` : '') +
      (sparse ? `\n${sparse} lounges skipped — surroundings too sparsely mapped to read` : '')
  );
}

main();

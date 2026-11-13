// Builds the data behind the interactive airport map for one lounge.
//
//   node scripts/build-airport-map.mjs <lounge-id>
//
// Writes public/maps/<lounge-id>.json and flags the lounge as `interactive`
// in src/data/indoor-maps.ts.
//
// The static SVG from fetch-indoor-maps.mjs is a 640m crop of one level —
// enough to say "between B18 and B20", not enough to answer "where am I and
// which way do I walk". This emits the whole airport instead: every concourse
// and terminal outline, the people mover, all gates, and the indoor detail
// around the lounge on every level it is mapped on. The client renders it as a
// pan-and-zoom map and drops the browser's own position on top.
//
// Coordinates are metres east/south of `origin`, rotated so the piers run
// horizontally. The client repeats that projection for the geolocation fix,
// which is why origin and rotation ship with the data.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { AIRPORT_NAMES, LOUNGES } from './lounge-sources.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cacheDir = join(root, '.cache', 'overpass');
const mapsDir = join(root, 'public', 'maps');
const manifestPath = join(root, 'src', 'data', 'indoor-maps.ts');

const MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
const UA = 'lounge-directory-indoor-maps/1.0 (https://github.com/tengdu/lounge)';

/** Indoor detail is only carried this far from the lounge — the rest of the
 *  airport is drawn as outlines, which is all that is legible at that zoom. */
const INDOOR_RADIUS_M = 450;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function overpass(query) {
  const file = join(cacheDir, `${createHash('sha1').update(query).digest('hex')}.json`);
  if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8'));

  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(MIRRORS[attempt % MIRRORS.length], {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
        headers: { 'User-Agent': UA },
        signal: AbortSignal.timeout(180_000),
      });
      const text = await res.text();
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
  throw new Error('Overpass unavailable');
}

// ------------------------------------------------------------------ geometry

function makeProjector(lat0, lon0) {
  const k = Math.cos((lat0 * Math.PI) / 180);
  return (lat, lon) => ({ x: (lon - lon0) * k * 111320, y: -(lat - lat0) * 111320 });
}

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

const rotator = (angle) => {
  const c = Math.cos(-angle);
  const s = Math.sin(-angle);
  return (p) => ({ x: p.x * c - p.y * s, y: p.x * s + p.y * c });
};

/** Ramer–Douglas–Peucker. Concourse outlines carry far more nodes than a
 *  screen can show, and every one of them costs bytes on every page load. */
function simplify(points, tolerance) {
  if (points.length < 3) return points;

  const sqTol = tolerance * tolerance;
  const sqSegDist = (p, a, b) => {
    let x = a.x;
    let y = a.y;
    let dx = b.x - x;
    let dy = b.y - y;
    if (dx !== 0 || dy !== 0) {
      const t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);
      if (t > 1) {
        x = b.x;
        y = b.y;
      } else if (t > 0) {
        x += dx * t;
        y += dy * t;
      }
    }
    dx = p.x - x;
    dy = p.y - y;
    return dx * dx + dy * dy;
  };

  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];

  while (stack.length > 0) {
    const [first, last] = stack.pop();
    let maxSq = 0;
    let index = -1;
    for (let i = first + 1; i < last; i++) {
      const sq = sqSegDist(points[i], points[first], points[last]);
      if (sq > maxSq) {
        maxSq = sq;
        index = i;
      }
    }
    if (maxSq > sqTol && index > 0) {
      keep[index] = 1;
      stack.push([first, index], [index, last]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

/** Shoelace area, used only to pick the smallest polygon containing a point. */
function ringArea(ring) {
  let sum = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    sum += (ring[j].x + ring[i].x) * (ring[j].y - ring[i].y);
  }
  return Math.abs(sum / 2);
}

const round = (v) => Math.round(v * 10) / 10;
const asPairs = (points) => points.map((p) => [round(p.x), round(p.y)]);

function levelsOf(tags) {
  if (tags?.level === undefined) return [];
  return String(tags.level).split(';').map((s) => s.trim()).filter(Boolean);
}

// -------------------------------------------------------------------- manifest

/** The generated manifest is the source of truth for which OSM point backs a
 *  lounge, so read it rather than re-running the whole matcher. */
function manifestEntry(id) {
  const source = readFileSync(manifestPath, 'utf8');
  const line = source
    .split('\n')
    .find((l) => l.trimStart().startsWith(`${JSON.stringify(id)}:`));
  if (!line) throw new Error(`"${id}" has no entry in ${manifestPath} — run fetch-indoor-maps.mjs first`);

  const level = line.match(/level:\s*(null|"[^"]*")/)?.[1];
  return {
    level: level === 'null' ? null : level?.slice(1, -1) ?? null,
    osm: line.match(/osm:\s*"([^"]+)"/)?.[1] ?? null,
    lat: Number(line.match(/lat:\s*(-?[\d.]+)/)?.[1]),
    lon: Number(line.match(/lon:\s*(-?[\d.]+)/)?.[1]),
    gates: JSON.parse(line.match(/gates:\s*(\[[^\]]*\])/)?.[1] ?? '[]'),
  };
}

function flagInteractive(id) {
  const source = readFileSync(manifestPath, 'utf8');
  if (source.includes('interactive: true') && source.includes(`${JSON.stringify(id)}:`)) {
    const already = source
      .split('\n')
      .find((l) => l.trimStart().startsWith(`${JSON.stringify(id)}:`))
      ?.includes('interactive: true');
    if (already) return;
  }

  let next = source;
  if (!next.includes('interactive?: true;')) {
    next = next.replace(
      '  lat: number;\n  lon: number;\n}',
      '  lat: number;\n  lon: number;\n' +
        '  /** True when public/maps/<id>.json exists and the page should render\n' +
        '   *  the pan-and-zoom airport map instead of the static plan. */\n' +
        '  interactive?: true;\n}'
    );
  }
  next = next
    .split('\n')
    .map((line) =>
      line.trimStart().startsWith(`${JSON.stringify(id)}:`) && !line.includes('interactive')
        ? line.replace(/\s*\},\s*$/, ', interactive: true },')
        : line
    )
    .join('\n');

  writeFileSync(manifestPath, next);
}

// ------------------------------------------------------------------------ main

async function main() {
  const id = process.argv[2];
  if (!id) throw new Error('usage: node scripts/build-airport-map.mjs <lounge-id>');

  const slug = (s) =>
    s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const source = LOUNGES.map(([code, name, location, brand]) => ({
    code,
    name,
    location,
    brand,
    id: `${code.toLowerCase()}-${slug(name)}-${slug(location)}`,
  })).find((l) => l.id === id);
  if (!source) throw new Error(`No lounge with id "${id}"`);

  const entry = manifestEntry(id);
  const code = source.code;
  console.log(`${source.name} — ${code} (${source.location})`);
  console.log(`  OSM ${entry.osm} at ${entry.lat},${entry.lon}, level ${entry.level ?? '(untagged)'}`);

  const shell = await overpass(`[out:json][timeout:180];
nwr["aeroway"="aerodrome"]["iata"="${code}"]->.ap; .ap map_to_area->.apa;
(
  way["aeroway"="terminal"](area.apa);
  way["aeroway"="pier"](area.apa);
  way["building"](area.apa);
  way["railway"~"^(subway|monorail|light_rail)$"](area.apa);
  node["aeroway"="gate"](area.apa);
);
out geom tags;`);

  const indoor = await overpass(`[out:json][timeout:180];
(
  way["indoor"](around:${INDOOR_RADIUS_M},${entry.lat},${entry.lon});
  way["highway"="elevator"](around:${INDOOR_RADIUS_M},${entry.lat},${entry.lon});
);
out geom tags;`);

  const project = makeProjector(entry.lat, entry.lon);
  const terminalWays = shell.elements.filter(
    (e) => e.geometry && (e.tags?.aeroway === 'terminal' || e.tags?.aeroway === 'pier')
  );

  const pointInRing = (pt, ring) => {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const a = ring[i];
      const b = ring[j];
      if (a.y > pt.y !== b.y > pt.y && pt.x < ((b.x - a.x) * (pt.y - a.y)) / (b.y - a.y) + a.x) {
        inside = !inside;
      }
    }
    return inside;
  };

  // Which concourse the lounge stands in, decided before any rotation.
  const origin = { x: 0, y: 0 };
  const homeWay =
    terminalWays
      .filter((w) => w.tags?.name)
      .map((w) => ({ way: w, ring: w.geometry.map((n) => project(n.lat, n.lon)) }))
      // Smallest containing polygon wins: at ATL the lounge sits inside both
      // "Concourse T" and the enclosing "Domestic Terminal".
      .filter((c) => pointInRing(origin, c.ring))
      .sort((a, b) => ringArea(a.ring) - ringArea(b.ring))[0] ?? null;

  // Rotate so the lounge's own pier lies horizontally. Taking the principal
  // axis of *all* terminals gets this exactly wrong at an airport like ATL,
  // where seven parallel piers form a blob whose long axis runs across them
  // rather than along any one of them — that put Concourse T on its end.
  const angle = principalAngle(
    homeWay ? homeWay.ring : terminalWays.flatMap((w) => w.geometry.map((n) => project(n.lat, n.lon)))
  );
  const rot = rotator(angle);
  const place = (way) => way.geometry.map((n) => rot(project(n.lat, n.lon)));

  // --- airport shell -------------------------------------------------------
  const areas = [];
  for (const el of shell.elements) {
    if (!el.geometry || el.geometry.length < 3) continue;
    const t = el.tags ?? {};
    const isTerminal = t.aeroway === 'terminal' || t.aeroway === 'pier';
    if (!isTerminal && !t.building) continue;

    const ring = simplify(place(el), isTerminal ? 1.2 : 2.5);
    if (ring.length < 3) continue;

    areas.push({
      kind: isTerminal ? 'terminal' : 'building',
      name: t.name ?? null,
      ring: asPairs(ring),
    });
  }

  const transit = shell.elements
    .filter((e) => e.geometry && e.tags?.railway)
    .map((e) => ({ kind: e.tags.railway, line: asPairs(simplify(place(e), 2)) }))
    .filter((t) => t.line.length >= 2);

  const gates = shell.elements
    .filter((e) => e.tags?.aeroway === 'gate' && e.tags?.ref && e.lat !== undefined)
    .map((g) => {
      const p = rot(project(g.lat, g.lon));
      return { ref: g.tags.ref, x: round(p.x), y: round(p.y) };
    });

  // --- indoor detail, keyed by level --------------------------------------
  const rooms = {};
  const walls = {};
  let loungeRing = null;

  for (const el of indoor.elements) {
    if (!el.geometry || el.geometry.length < 2) continue;
    const t = el.tags ?? {};
    const ring = simplify(place(el), 0.5);
    if (ring.length < 2) continue;
    const pairs = asPairs(ring);

    const target = t.indoor === 'wall' ? walls : rooms;
    const isRoom = ['room', 'area', 'yes', 'corridor'].includes(t.indoor);
    if (t.indoor !== 'wall' && !isRoom) continue;

    for (const level of levelsOf(t).length > 0 ? levelsOf(t) : ['?']) {
      (target[level] ??= []).push(pairs);
    }

    if (entry.osm === `${el.type}/${el.id}`) loungeRing = pairs;
  }

  const centre = rot(project(entry.lat, entry.lon));
  if (!loungeRing) {
    // Node-mapped lounge: no outline exists, so stand in a small footprint.
    loungeRing = [
      [round(centre.x - 15), round(centre.y - 9)],
      [round(centre.x + 15), round(centre.y - 9)],
      [round(centre.x + 15), round(centre.y + 9)],
      [round(centre.x - 15), round(centre.y + 9)],
    ];
  }

  const home = homeWay
    ? { name: homeWay.way.tags.name, ring: asPairs(simplify(homeWay.ring.map(rot), 1.2)) }
    : null;

  const allPoints = [
    ...areas.flatMap((a) => a.ring),
    ...gates.map((g) => [g.x, g.y]),
  ];
  const bounds = allPoints.reduce(
    (b, [x, y]) => ({
      minX: Math.min(b.minX, x),
      minY: Math.min(b.minY, y),
      maxX: Math.max(b.maxX, x),
      maxY: Math.max(b.maxY, y),
    }),
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
  );

  const levels = [...new Set([...Object.keys(rooms), ...Object.keys(walls)])]
    .filter((l) => l !== '?')
    .sort((a, b) => Number(a) - Number(b));

  const payload = {
    id,
    airport: code,
    airportName: AIRPORT_NAMES[code],
    loungeName: source.name,
    location: source.location,
    // The client re-runs this projection on the geolocation fix.
    origin: { lat: entry.lat, lon: entry.lon },
    rotation: angle,
    bounds,
    home: home ? { name: home.name, ring: home.ring } : null,
    lounge: {
      ring: loungeRing,
      center: [round(centre.x), round(centre.y)],
      level: entry.level,
      gates: entry.gates,
    },
    areas,
    transit,
    gates,
    levels,
    rooms,
    walls,
  };

  mkdirSync(mapsDir, { recursive: true });
  const out = join(mapsDir, `${id}.json`);
  writeFileSync(out, JSON.stringify(payload));
  flagInteractive(id);

  const kb = (n) => `${(n / 1024).toFixed(0)}KB`;
  console.log(
    `  areas ${areas.length} (${areas.filter((a) => a.kind === 'terminal').length} terminals), ` +
      `gates ${gates.length}, transit ${transit.length}, levels [${levels.join(', ')}]`
  );
  console.log(`  in ${home?.name ?? 'no named terminal'}`);
  console.log(`  wrote ${out} — ${kb(JSON.stringify(payload).length)}`);
}

main();

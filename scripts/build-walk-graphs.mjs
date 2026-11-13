#!/usr/bin/env node
// Builds a routable graph per airport from OpenStreetMap — walkways, plus the
// airport's own trains — so the lounge map can draw a real route instead of a
// straight line.
//
//   node scripts/build-walk-graphs.mjs            # all airports with a mapped lounge
//   node scripts/build-walk-graphs.mjs atl sfo    # just these
//   node scripts/build-walk-graphs.mjs --refresh  # ignore the cache
//
// Output is public/routes/<airport>.json:
//   { origin: [lon, lat], nodes: [dLon, dLat, ...], edges: [a, b, ...],
//     meta: [legendIndex per edge], legend: [[kind, level, underground, name?], ...] }
// Node offsets are integers in 1e-6 degrees from `origin`; edges index nodes.
//
// Edge kinds:
//   0 walkway   1 stairs   2 escalator
//   3 train track, both directions   4 train track, first node to second only
//   5 station access — between a walkway and a station
//   6 platform — between a station (first node) and a train (second node)
//   7 escalator that runs from the first node to the second
//   8 lift — an elevator: a change of floor at a single point
// `level` is the OSM level tag, which is what lets the map say "escalator up"
// where a route doubles back on itself between floors. `name` is the line on
// a track edge and the station on a station or platform edge.
//
// Routing itself happens in the browser (src/lib/walk-route.ts), so a
// traveller's position never leaves their device.
//
// What this graph does not know: which corridors are behind security. It is
// "ways a person can walk or ride", joined wherever OSM mappers joined them.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cacheDir = join(root, '.cache', 'overpass');
const outDir = join(root, 'public', 'routes');
// Both the lounges placed from floor plans and the ones placed afterwards by
// build-lounge-positions: the network has to reach every pin the map can show.
const manifests = ['indoor-maps.ts', 'lounge-positions.ts'].map((f) => join(root, 'src', 'data', f));

// Tried in order. The main server has the freshest data but is often at
// capacity, and says so at once; the French community mirror runs a few weeks
// behind, which no terminal's corridors will notice.
const MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.openstreetmap.fr/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
const UA = 'airport-walk-graph-builder/1.0';

/** How far past the outermost lounge the graph reaches — enough to cover the
 *  rest of the terminal complex a traveller might start from. */
const PAD_M = 1500;
/** Fragments shorter than this are stray stubs nothing can route through. */
const MIN_COMPONENT_M = 40;

const KIND = { WALK: 0, STAIRS: 1, ESCALATOR: 2, TRACK: 3, TRACK_ONEWAY: 4, STATION: 5, PLATFORM: 6, ESCALATOR_ONEWAY: 7, LIFT: 8 };

/** People movers, however the mapper classed them. Mainline `rail` is left
 *  out: no airport shuttle is tagged that way, and every intercity line is. */
const TRACK_TYPES = /^(light_rail|subway|monorail|tram|narrow_gauge|funicular)$/;
/** A station's hall reaches every walkway this close to it: its platform, and
 *  the concourse above, which mappers rarely join with an escalator. */
const STATION_REACH_M = 30;
/** With nothing that close, the single nearest walkway within this is used. */
const STATION_FALLBACK_M = 60;
/** A station node drawn beside the track rather than on it still belongs to it. */
const STOP_TO_TRACK_M = 60;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function cachePath(query) {
  return join(cacheDir, `${createHash('sha1').update(query).digest('hex')}.json`);
}

async function overpass(query, refresh) {
  const file = cachePath(query);
  if (!refresh && existsSync(file)) return { data: JSON.parse(readFileSync(file, 'utf8')), cached: true };

  for (let attempt = 0; attempt < MIRRORS.length * 2; attempt++) {
    try {
      const res = await fetch(MIRRORS[attempt % MIRRORS.length], {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
        headers: { 'User-Agent': UA },
        signal: AbortSignal.timeout(120_000),
      });
      const text = await res.text();
      // Overpass answers overload with an HTML error page, not a status code.
      if (text.trimStart().startsWith('{')) {
        mkdirSync(cacheDir, { recursive: true });
        writeFileSync(file, text);
        return { data: JSON.parse(text), cached: false };
      }
    } catch {
      // fall through to the backoff
    }
    await sleep(1500 * (attempt + 1));
  }
  return { data: null, cached: false };
}

function metres(a, b) {
  const k = Math.cos((((a.lat + b.lat) / 2) * Math.PI) / 180);
  return Math.hypot((a.lon - b.lon) * k, a.lat - b.lat) * 111320;
}

/** Lounge positions straight from the generated manifest, grouped by airport. */
function loungesByAirport() {
  const text = manifests.filter(existsSync).map((f) => readFileSync(f, 'utf8')).join('\n');
  const byAirport = {};
  for (const m of text.matchAll(/"(([a-z]{3})-[^"]+)": \{[^}]*lat: ([\d.-]+), lon: ([\d.-]+)/g)) {
    (byAirport[m[2]] ??= []).push({ id: m[1], lat: Number(m[3]), lon: Number(m[4]) });
  }
  return byAirport;
}

function unionFind(size) {
  const parent = Array.from({ length: size }, (_, i) => i);
  const find = (i) => {
    while (parent[i] !== i) i = parent[i] = parent[parent[i]];
    return i;
  };
  return { find, join: (a, b) => (parent[find(a)] = find(b)) };
}

// ------------------------------------------------------------------ walkways

/**
 * Can a passenger walk here? `foot` is the specific answer and `access` the
 * general one, so `foot` wins when both are set.
 *
 * That order matters more at an airport than anywhere: airside corridors are
 * routinely tagged `access=no` + `foot=customers` — closed to the public, open
 * to ticketed passengers. Reading `access` alone discards every concourse
 * mapped that way, and leaves only the landside pavements.
 */
function openToWalkers(tags = {}) {
  const rule = tags.foot ?? tags.access;
  return !['no', 'private', 'employees', 'staff'].includes(rule);
}

/**
 * The walkable network: `nodes` as {lat, lon}, `edges` as [a, b, legendIndex].
 * `legendFor` hands out legend indices, so transit can add its own kinds.
 * `elevators` is the set of OSM node ids tagged as one.
 */
function buildWalk(elements, elevators) {
  const coords = new Map();
  for (const el of elements) if (el.type === 'node') coords.set(el.id, { lat: el.lat, lon: el.lon });

  const legend = [];
  const legendIndex = new Map();
  const legendFor = (kind, level = null, under = 0, name = null) => {
    const key = `${kind}|${level}|${under}|${name}`;
    if (!legendIndex.has(key)) {
      legendIndex.set(key, legend.length);
      legend.push(name === null ? [kind, level, under] : [kind, level, under, name]);
    }
    return legendIndex.get(key);
  };
  // `conveying=forward` is an escalator running the way the line is drawn,
  // `backward` one running against it; anything else moving is direction
  // unknown. A moving walkway (conveying on a footway) is just a walkway here.
  const runs = (tags) =>
    tags.highway === 'steps' && tags.conveying === 'forward' ? 1 : tags.highway === 'steps' && tags.conveying === 'backward' ? -1 : 0;
  const metaOf = (tags = {}) => {
    const kind =
      tags.highway !== 'steps'
        ? KIND.WALK
        : runs(tags) !== 0
          ? KIND.ESCALATOR_ONEWAY
          : tags.conveying && tags.conveying !== 'no'
            ? KIND.ESCALATOR
            : KIND.STAIRS;
    const level = tags.level ?? null;
    const under = tags.tunnel === 'yes' || (level !== null && !level.includes(';') && Number(level) < 0) ? 1 : 0;
    return legendFor(kind, level, under);
  };

  const index = new Map(); // OSM node id -> index
  const nodes = [];
  const ids = []; // index -> OSM node id
  const edges = [];
  const seen = new Set();
  const at = (id) => {
    if (!index.has(id)) {
      index.set(id, nodes.length);
      nodes.push(coords.get(id));
      ids.push(id);
    }
    return index.get(id);
  };

  for (const el of elements) {
    if (el.type !== 'way' || !el.nodes || !openToWalkers(el.tags)) continue;
    const meta = metaOf(el.tags);
    const against = runs(el.tags) === -1;
    for (let i = 1; i < el.nodes.length; i++) {
      if (!coords.has(el.nodes[i - 1]) || !coords.has(el.nodes[i])) continue;
      const a = at(el.nodes[i - 1]);
      const b = at(el.nodes[i]);
      const key = a < b ? `${a}:${b}` : `${b}:${a}`;
      if (a === b || seen.has(key)) continue;
      seen.add(key);
      // Stored in the direction of travel, so the router needs no second flag.
      edges.push(against ? [b, a, meta] : [a, b, meta]);
    }
  }

  // An elevator is mapped as a single node where corridors on different floors
  // meet. Left as a plain junction it is a free, instant change of floor: the
  // router takes it over every escalator, and the directions never mention
  // going up. So give each floor its own copy of the node and join them with
  // lift edges, which cost time and are reported as a step.
  //
  // Only nodes tagged as elevators. Floors also "meet" wherever two adjoining
  // buildings were numbered differently by their mappers, and treating those
  // as lifts would invent a change of level on a flat corridor.
  const floorOf = (meta) => {
    const [kind, level] = legend[meta];
    return kind === KIND.WALK && level !== null && /^-?\d+(\.\d+)?$/.test(level) ? level : null;
  };
  const floorsAt = new Map(); // node -> Map(floor -> [edge index])
  edges.forEach(([a, b, meta], edge) => {
    const floor = floorOf(meta);
    if (floor === null) return;
    for (const node of [a, b]) {
      if (!floorsAt.has(node)) floorsAt.set(node, new Map());
      const here = floorsAt.get(node);
      if (!here.has(floor)) here.set(floor, []);
      here.get(floor).push(edge);
    }
  });
  let lifts = 0;
  for (const [node, floors] of floorsAt) {
    if (floors.size < 2 || !elevators.has(ids[node])) continue;
    lifts++;
    const lift = legendFor(KIND.LIFT);
    for (const list of floors.values()) {
      const landing = nodes.length;
      nodes.push(nodes[node]);
      for (const edge of list) {
        if (edges[edge][0] === node) edges[edge][0] = landing;
        if (edges[edge][1] === node) edges[edge][1] = landing;
      }
      edges.push([node, landing, lift]);
    }
  }

  // Drop stray fragments: total length per connected component.
  const sets = unionFind(nodes.length);
  for (const [a, b] of edges) sets.join(a, b);
  const length = new Map();
  for (const [a, b] of edges) {
    const r = sets.find(a);
    length.set(r, (length.get(r) ?? 0) + metres(nodes[a], nodes[b]));
  }

  const remap = new Map();
  const keptNodes = [];
  const keptEdges = [];
  const component = []; // per kept node
  for (const [a, b, m] of edges) {
    if (length.get(sets.find(a)) < MIN_COMPONENT_M) continue;
    for (const n of [a, b]) {
      if (!remap.has(n)) {
        remap.set(n, keptNodes.length);
        keptNodes.push(nodes[n]);
        component.push(sets.find(n));
      }
    }
    keptEdges.push([remap.get(a), remap.get(b), m]);
  }

  return {
    nodes: keptNodes,
    edges: keptEdges,
    component,
    legend,
    legendFor,
    walkNodes: keptNodes.length,
    biggest: Math.max(0, ...length.values()),
    lifts,
  };
}

// -------------------------------------------------------------------- trains

const isStop = (t) => t.railway === 'stop' || t.railway === 'tram_stop' || t.public_transport === 'stop_position';
const isStation = (t) => t.railway === 'station' || t.railway === 'halt' || t.public_transport === 'station';
/** `public_transport=stop_position` is also how bus stops are tagged. */
const onRails = (t) =>
  Boolean(t.railway) || ['light_rail', 'subway', 'monorail', 'tram', 'train', 'funicular'].some((k) => t[k] === 'yes');

const stationKey = (name) =>
  name.toLowerCase().replace(/\b(station|stop)\b/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();

/**
 * Adds the airport's trains to `graph`: tracks as edges a traveller can ride,
 * and each station wired to the walkways around it.
 *
 * A line only counts if at least two of its stations are inside the airport.
 * That is what separates the terminal shuttle from the city's light rail,
 * which stops here once and is no way to get between gates.
 *
 * Returns a description of what was added, for the build log.
 */
function addTransit(graph, elements) {
  const osm = new Map();
  for (const el of elements) {
    if (el.type !== 'node') continue;
    // A node can be listed twice — once with tags, once as bare way geometry.
    const known = osm.get(el.id);
    osm.set(el.id, { id: el.id, lat: el.lat, lon: el.lon, tags: el.tags ?? known?.tags ?? null });
  }

  // --- the track network, in its own index space. A footway crossing a tram
  // line shares an OSM node with it, and that must not become a place to board.
  const trackIndex = new Map();
  const trackNodes = [];
  const trackEdges = []; // [a, b, oneway, wayName]
  const trackAt = (id) => {
    if (!trackIndex.has(id)) {
      trackIndex.set(id, trackNodes.length);
      trackNodes.push(osm.get(id));
    }
    return trackIndex.get(id);
  };
  for (const el of elements) {
    if (el.type !== 'way' || !el.nodes || !TRACK_TYPES.test(el.tags?.railway ?? '')) continue;
    const direction = el.tags.oneway === 'yes' ? 1 : el.tags.oneway === '-1' ? -1 : 0;
    for (let i = 1; i < el.nodes.length; i++) {
      if (!osm.has(el.nodes[i - 1]) || !osm.has(el.nodes[i]) || el.nodes[i - 1] === el.nodes[i]) continue;
      const a = trackAt(el.nodes[i - 1]);
      const b = trackAt(el.nodes[i]);
      trackEdges.push(direction === -1 ? [b, a, 1, el.tags.name ?? null] : [a, b, direction, el.tags.name ?? null]);
    }
  }
  if (trackEdges.length === 0) return [];

  const lines = unionFind(trackNodes.length);
  for (const [a, b] of trackEdges) lines.join(a, b);

  // --- stations: every stop and station node, gathered by name.
  const stops = [...osm.values()].filter((n) => n.tags && (isStop(n.tags) || isStation(n.tags)) && onRails(n.tags));
  const stations = []; // { name, key, members: [node] }
  for (const node of stops.filter((n) => n.tags.name)) {
    const key = stationKey(node.tags.name);
    // Two stations can share a name at opposite ends of an airport.
    let station = stations.find((s) => s.key === key && metres(s.members[0], node) < 400);
    if (!station) stations.push((station = { name: node.tags.name, key, members: [] }));
    station.members.push(node);
  }
  for (const node of stops.filter((n) => !n.tags.name)) {
    // An unnamed stop position usually sits on the track beside its station.
    const near = (s) => Math.min(...s.members.map((m) => metres(m, node)));
    let station = stations.filter((s) => near(s) < 80).sort((p, q) => near(p) - near(q))[0];
    if (!station) stations.push((station = { name: null, key: `@${node.id}`, members: [] }));
    station.members.push(node);
  }

  for (const station of stations) {
    const hall = station.members.find((m) => isStation(m.tags));
    station.at = hall
      ? { lat: hall.lat, lon: hall.lon }
      : {
          lat: station.members.reduce((s, m) => s + m.lat, 0) / station.members.length,
          lon: station.members.reduce((s, m) => s + m.lon, 0) / station.members.length,
        };

    // Where trains stop for it: its own nodes on a track, or failing that the
    // nearest point of each track that passes close by.
    station.stops = new Map(); // line -> [track node]
    for (const member of station.members) {
      if (!trackIndex.has(member.id)) continue;
      const node = trackIndex.get(member.id);
      const line = lines.find(node);
      if (!station.stops.has(line)) station.stops.set(line, []);
      station.stops.get(line).push(node);
    }
    if (station.stops.size === 0) {
      const nearest = new Map(); // line -> { node, d }
      trackNodes.forEach((t, node) => {
        const d = metres(t, station.at);
        const line = lines.find(node);
        if (d <= STOP_TO_TRACK_M && (!nearest.has(line) || d < nearest.get(line).d)) nearest.set(line, { node, d });
      });
      for (const [line, { node }] of nearest) station.stops.set(line, [node]);
    }
  }

  // --- keep the lines worth riding.
  const served = new Map(); // line -> [station]
  for (const station of stations) {
    for (const line of station.stops.keys()) {
      if (!served.has(line)) served.set(line, []);
      served.get(line).push(station);
    }
  }
  const kept = new Set([...served].filter(([, list]) => list.length >= 2).map(([line]) => line));
  if (kept.size === 0) return [];

  const lineName = new Map();
  for (const line of kept) {
    const votes = new Map();
    for (const [a, , , name] of trackEdges) {
      if (name && lines.find(a) === line) votes.set(name, (votes.get(name) ?? 0) + 1);
    }
    lineName.set(line, [...votes].sort((p, q) => q[1] - p[1])[0]?.[0] ?? null);
  }

  // --- into the graph: tracks first.
  const { nodes, edges, legendFor } = graph;
  const graphNode = new Map(); // track node -> graph node
  const onGraph = (t) => {
    if (!graphNode.has(t)) {
      graphNode.set(t, nodes.length);
      nodes.push({ lat: trackNodes[t].lat, lon: trackNodes[t].lon });
    }
    return graphNode.get(t);
  };
  for (const [a, b, oneway] of trackEdges) {
    const line = lines.find(a);
    if (!kept.has(line)) continue;
    edges.push([onGraph(a), onGraph(b), legendFor(oneway ? KIND.TRACK_ONEWAY : KIND.TRACK, null, 0, lineName.get(line))]);
  }

  // --- then each station: a hall node, joined to its trains and its walkways.
  const k = Math.cos((nodes[0].lat * Math.PI) / 180);
  const flat = (p) => [p.lon * k * 111320, p.lat * 111320];
  const isWalkable = (meta) => [KIND.WALK, KIND.STAIRS, KIND.ESCALATOR, KIND.ESCALATOR_ONEWAY].includes(graph.legend[meta][0]);

  /** The nearest point of each walkway component to `point`. */
  const nearestWalkways = (point) => {
    const [px, py] = flat(point);
    const best = new Map();
    edges.forEach(([a, b, meta], edge) => {
      if (!isWalkable(meta)) return;
      const [ax, ay] = flat(nodes[a]);
      const [bx, by] = flat(nodes[b]);
      const len2 = (bx - ax) ** 2 + (by - ay) ** 2;
      const t = len2 === 0 ? 0 : Math.min(1, Math.max(0, ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / len2));
      const d = Math.hypot(px - (ax + t * (bx - ax)), py - (ay + t * (by - ay)));
      const part = graph.component[a];
      if (!best.has(part) || d < best.get(part).d) best.set(part, { edge, t, d });
    });
    return [...best.values()].sort((p, q) => p.d - q.d);
  };

  /** The node at `t` along an edge, cutting the edge in two there if need be. */
  const nodeOn = ({ edge, t }) => {
    const [a, b, meta] = edges[edge];
    const point = {
      lat: nodes[a].lat + t * (nodes[b].lat - nodes[a].lat),
      lon: nodes[a].lon + t * (nodes[b].lon - nodes[a].lon),
    };
    if (metres(point, nodes[a]) < 0.5) return a;
    if (metres(point, nodes[b]) < 0.5) return b;
    const cut = nodes.length;
    nodes.push(point);
    graph.component.push(graph.component[a]);
    edges[edge] = [a, cut, meta];
    edges.push([cut, b, meta]);
    return cut;
  };

  const report = new Map(); // line -> station descriptions
  for (const station of stations) {
    const ridden = [...station.stops].filter(([line]) => kept.has(line));
    if (ridden.length === 0) continue;

    const hall = nodes.length;
    nodes.push(station.at);
    for (const [, trackStops] of ridden) {
      for (const t of new Set(trackStops)) edges.push([hall, onGraph(t), legendFor(KIND.PLATFORM, null, 0, station.name)]);
    }

    const around = nearestWalkways(station.at);
    let joined = around.filter((w) => w.d <= STATION_REACH_M).slice(0, 4);
    if (joined.length === 0) joined = around.filter((w) => w.d <= STATION_FALLBACK_M).slice(0, 1);
    for (const walkway of joined) {
      edges.push([nodeOn(walkway), hall, legendFor(KIND.STATION, null, 0, station.name)]);
    }
    if (joined.length === 0) {
      // No walkway is mapped anywhere near — a satellite whose interior nobody
      // has drawn. Leave a zero-length walkway at the station, so a route can
      // still end "get off here, then follow the signs".
      const door = nodes.length;
      nodes.push(station.at);
      graph.component.push(-1 - hall);
      edges.push([hall, door, legendFor(KIND.WALK)]);
    }

    for (const [line] of ridden) {
      if (!report.has(line)) report.set(line, []);
      report.get(line).push(`${station.name ?? 'unnamed'}${joined.length === 0 ? ' (no walkway mapped)' : ''}`);
    }
  }

  return [...report].map(([line, names]) => `${lineName.get(line) ?? 'unnamed line'}: ${names.join(', ')}`);
}

// ---------------------------------------------------------------------- main

async function main() {
  const args = process.argv.slice(2);
  const refresh = args.includes('--refresh');
  const only = args.filter((a) => !a.startsWith('--')).map((a) => a.toLowerCase());

  const airports = loungesByAirport();
  const codes = Object.keys(airports).filter((c) => only.length === 0 || only.includes(c)).sort();
  mkdirSync(outDir, { recursive: true });

  for (const code of codes) {
    const lounges = airports[code];
    const lats = lounges.map((l) => l.lat);
    const lons = lounges.map((l) => l.lon);
    const padLat = PAD_M / 111320;
    const padLon = padLat / Math.cos((lats[0] * Math.PI) / 180);
    const bbox = [
      Math.min(...lats) - padLat,
      Math.min(...lons) - padLon,
      Math.max(...lats) + padLat,
      Math.max(...lons) + padLon,
    ]
      .map((n) => n.toFixed(5))
      .join(',');

    const walkQuery = `[out:json][timeout:90];
way["highway"~"^(footway|corridor|steps|pedestrian|path)$"](${bbox});
out body;
>;
out skel qt;`;

    const walk = await overpass(walkQuery, refresh);
    if (!walk.data) {
      console.log(`${code.toUpperCase()}  Overpass gave no answer — skipped`);
      continue;
    }

    // A separate, much smaller request: if it fails, the airport still gets
    // its walkways, and a re-run adds the trains and elevators.
    const extrasQuery = `[out:json][timeout:90];
(
  way["railway"~"^(light_rail|subway|monorail|tram|narrow_gauge|funicular)$"](${bbox});
  node["railway"~"^(station|halt|stop|tram_stop)$"](${bbox});
  node["public_transport"~"^(station|stop_position)$"](${bbox});
  node["highway"="elevator"](${bbox});
);
out body;
>;
out skel qt;`;
    const extras = await overpass(extrasQuery, refresh);
    const elevators = new Set(
      (extras.data?.elements ?? []).filter((el) => el.type === 'node' && el.tags?.highway === 'elevator').map((el) => el.id)
    );

    const graph = buildWalk(walk.data.elements, elevators);
    if (graph.edges.length === 0) {
      console.log(`${code.toUpperCase()}  no walkable ways mapped`);
      if (!walk.cached) await sleep(2000);
      continue;
    }
    const trains = extras.data ? addTransit(graph, extras.data.elements) : null;

    const origin = [Math.min(...graph.nodes.map((n) => n.lon)), Math.min(...graph.nodes.map((n) => n.lat))];
    const payload = {
      origin,
      nodes: graph.nodes.flatMap((n) => [Math.round((n.lon - origin[0]) * 1e6), Math.round((n.lat - origin[1]) * 1e6)]),
      edges: graph.edges.flatMap(([a, b]) => [a, b]),
      meta: graph.edges.map(([, , m]) => m),
      legend: graph.legend,
    };
    const json = JSON.stringify(payload);
    writeFileSync(join(outDir, `${code}.json`), json);

    // How close does the walkable network come to each lounge? Node distance
    // is a rough stand-in for the edge snap the browser does.
    const walkable = graph.nodes.slice(0, graph.walkNodes);
    const reach = lounges.map((l) => Math.round(Math.min(...walkable.map((n) => metres(n, l)))));
    console.log(
      `${code.toUpperCase()}  ${graph.nodes.length} nodes, ${graph.edges.length} edges, ` +
        `${(json.length / 1024).toFixed(0)} kB, main network ${(graph.biggest / 1000).toFixed(1)} km; ` +
        `${graph.lifts} elevators; lounge→walkway m: ${reach.join(' ')}`
    );
    if (trains === null) console.log('     trains and elevators: Overpass gave no answer — walkways only, re-run to add them');
    else if (trains.length === 0) console.log('     trains: none');
    else for (const line of trains) console.log(`     train — ${line}`);

    if (!walk.cached || !extras.cached) await sleep(2000);
  }
}

main();

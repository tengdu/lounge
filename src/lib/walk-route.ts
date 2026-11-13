/**
 * Quickest route over the per-airport graph written by
 * scripts/build-walk-graphs.mjs — walkways, and the airport's own trains.
 * Runs entirely in the browser, so a traveller's position is never sent
 * anywhere to get a route.
 */

/** As stored: integer 1e-6° offsets from `origin`, and node-index pairs. */
interface RawGraph {
  origin: [number, number];
  nodes: number[];
  edges: number[];
  /** Per edge, an index into `legend`: [kind, OSM level, underground, name?]. */
  meta?: number[];
  legend?: [number, string | null, number, (string | null)?][];
}

/** What one stretch of a route is. */
export interface Leg {
  /**
   * `lift` is an elevator: a change of floor on the spot. `station` is the way
   * between a walkway and a station hall, `platform` the way between the hall
   * and a train. `gap` is ground no one has mapped, crossed in a straight
   * line — only ever the first or last stretch.
   */
  kind: "walk" | "stairs" | "escalator" | "lift" | "train" | "station" | "platform" | "gap";
  /** A single floor number, or null when unknown or spanning floors. */
  level: number | null;
  underground: boolean;
  /** The line, on a train leg; the station, on a station or platform leg. */
  name: string | null;
}

const UNKNOWN_LEG: Leg = { kind: "walk", level: null, underground: false, name: null };
const GAP_LEG: Leg = { kind: "gap", level: null, underground: false, name: null };

/**
 * Edge kinds as numbered by the build script. 4 is a track ridden one way
 * only, 7 an escalator that runs from the edge's first node to its second.
 */
const KINDS: Leg["kind"][] = ["walk", "stairs", "escalator", "train", "train", "station", "platform", "escalator", "lift"];
const ONE_WAY_TRACK = 4;
const ONE_WAY_ESCALATOR = 7;

const isWalkable = (leg: Leg) => leg.kind === "walk" || leg.kind === "stairs" || leg.kind === "escalator";

export interface WalkGraph {
  /** Node positions in metres on a local flat projection. */
  x: Float64Array;
  y: Float64Array;
  lon: Float64Array;
  lat: Float64Array;
  edges: Int32Array;
  /** Outgoing connections per node, costed in seconds. */
  adjacency: { to: number; seconds: number; edge: number }[][];
  /** One per edge, in the order of `edges` pairs. */
  legs: Leg[];
  /** Per node, an id shared by everything it can reach on foot or by train. */
  component: Int32Array;
  project: (lon: number, lat: number) => [number, number];
}

export interface WalkRoute {
  /** [lon, lat] pairs from the start to the destination. */
  coordinates: [number, number][];
  /** One per segment: `legs[i]` describes coordinates[i] → coordinates[i + 1]. */
  legs: Leg[];
  /** Estimated time door to door, waiting for trains included. */
  seconds: number;
  /** Distance covered on foot, mapped or not. */
  walkMetres: number;
}

// ------------------------------------------------------------------- timing

/** An unhurried walk with a bag: 80 metres a minute. */
const WALK_MPS = 80 / 60;
/**
 * Stairs and escalators are drawn by their footprint, a few metres long, but
 * take far longer than that to climb. Slow enough here to cost what a flight
 * really does — and stairs slower still, so an escalator is taken when one
 * runs the right way.
 */
const ESCALATOR_MPS = 0.5;
const STAIRS_MPS = 0.35;
/**
 * Against an escalator's direction. Not walked, of course: its twin beside it
 * runs the other way and is often not mapped, so the pair is costed as one
 * with a detour.
 */
const WRONG_WAY = 2.5;
/** Terminal trains spend most of a short hop accelerating and braking. */
const TRAIN_MPS = 8;
/**
 * Each half of an elevator ride: the build script puts a lift edge on either
 * side of the shaft, so floor to floor costs two of these — the wait included.
 */
const LIFT_S = 25;
/** Between a walkway and a station hall — an escalator's worth. */
const STATION_S = 30;
/** Onto the platform, plus the average wait for a train every few minutes. */
const BOARD_S = 120;
const ALIGHT_S = 15;
/** Unmapped ground is crossed as the crow flies; the real way is longer. */
const GAP_FACTOR = 1.4;

/** A lounge further than this from anything mapped cannot be routed to. */
const DESTINATION_REACH_M = 150;
/** Likewise a traveller — looser, because an indoor GPS fix drifts. */
const START_REACH_M = 220;

export function parseGraph(raw: RawGraph): WalkGraph {
  const count = raw.nodes.length / 2;
  const [lon0, lat0] = raw.origin;
  const k = Math.cos((lat0 * Math.PI) / 180);
  const project = (lon: number, lat: number): [number, number] => [
    (lon - lon0) * k * 111320,
    (lat - lat0) * 111320,
  ];

  const lon = new Float64Array(count);
  const lat = new Float64Array(count);
  const x = new Float64Array(count);
  const y = new Float64Array(count);
  for (let i = 0; i < count; i++) {
    lon[i] = lon0 + raw.nodes[2 * i] / 1e6;
    lat[i] = lat0 + raw.nodes[2 * i + 1] / 1e6;
    [x[i], y[i]] = project(lon[i], lat[i]);
  }

  const legend: Leg[] = (raw.legend ?? []).map(([kind, level, under, name]) => ({
    kind: KINDS[kind] ?? "walk",
    level: level !== null && !level.includes(";") && Number.isFinite(Number(level)) ? Number(level) : null,
    underground: under === 1,
    name: name ?? null,
  }));

  const edges = Int32Array.from(raw.edges);
  const legs: Leg[] = [];
  const adjacency: WalkGraph["adjacency"] = Array.from({ length: count }, () => []);

  // Union-find rather than a walk of `adjacency`: a one-way track still joins
  // its two ends into one network.
  const parent = Int32Array.from({ length: count }, (_, i) => i);
  const find = (i: number): number => {
    while (parent[i] !== i) i = parent[i] = parent[parent[i]];
    return i;
  };

  for (let e = 0; e < edges.length; e += 2) {
    const a = edges[e];
    const b = edges[e + 1];
    const edge = e / 2;
    const code = raw.legend?.[raw.meta?.[edge] ?? -1]?.[0] ?? 0;
    const leg = legend[raw.meta?.[edge] ?? -1] ?? UNKNOWN_LEG;
    const metres = Math.hypot(x[a] - x[b], y[a] - y[b]);
    legs.push(leg);
    parent[find(a)] = find(b);

    if (leg.kind === "train") {
      adjacency[a].push({ to: b, seconds: metres / TRAIN_MPS, edge });
      if (code !== ONE_WAY_TRACK) adjacency[b].push({ to: a, seconds: metres / TRAIN_MPS, edge });
    } else if (leg.kind === "platform") {
      // Stored hall first, train second: stepping on costs the wait.
      adjacency[a].push({ to: b, seconds: BOARD_S, edge });
      adjacency[b].push({ to: a, seconds: ALIGHT_S, edge });
    } else if (leg.kind === "escalator") {
      const seconds = metres / ESCALATOR_MPS;
      adjacency[a].push({ to: b, seconds, edge });
      adjacency[b].push({ to: a, seconds: code === ONE_WAY_ESCALATOR ? seconds * WRONG_WAY : seconds, edge });
    } else {
      const seconds =
        leg.kind === "station"
          ? STATION_S
          : leg.kind === "lift"
            ? LIFT_S
            : leg.kind === "stairs"
              ? metres / STAIRS_MPS
              : metres / WALK_MPS;
      adjacency[a].push({ to: b, seconds, edge });
      adjacency[b].push({ to: a, seconds, edge });
    }
  }

  const component = new Int32Array(count);
  for (let i = 0; i < count; i++) component[i] = find(i);

  return { x, y, lon, lat, edges, adjacency, legs, component, project };
}

// ------------------------------------------------------------------ routing

/** Where a point lands on the network: an edge, and how far along it. */
interface Snap {
  a: number;
  b: number;
  edge: number;
  /** 0 at `a`, 1 at `b`. */
  t: number;
  x: number;
  y: number;
  distance: number;
}

/**
 * The nearest walkable point of each separate network within `limit`.
 *
 * Per network, because the nearest walkway is often a stray fragment — a
 * mapped stair, a jet bridge — that leads nowhere. Which network to use can
 * only be decided once both ends of the journey are known.
 */
function nearestByNetwork(graph: WalkGraph, px: number, py: number, limit: number): Map<number, Snap> {
  const { x, y, edges, component, legs } = graph;
  const best = new Map<number, Snap>();
  for (let e = 0; e < edges.length; e += 2) {
    // Never onto a track: nobody joins a train between stations.
    if (!isWalkable(legs[e / 2])) continue;
    const a = edges[e];
    const b = edges[e + 1];
    const dx = x[b] - x[a];
    const dy = y[b] - y[a];
    const len2 = dx * dx + dy * dy;
    const t = len2 === 0 ? 0 : Math.min(1, Math.max(0, ((px - x[a]) * dx + (py - y[a]) * dy) / len2));
    const sx = x[a] + t * dx;
    const sy = y[a] + t * dy;
    const distance = Math.hypot(px - sx, py - sy);
    if (distance > limit) continue;
    const known = best.get(component[a]);
    if (!known || distance < known.distance) {
      best.set(component[a], { a, b, edge: e / 2, t, x: sx, y: sy, distance });
    }
  }
  return best;
}

/**
 * The quickest way from `from` to `to`, or null when the mapped network does
 * not join them — the caller should then fall back to a straight line and say
 * so, rather than draw a route that is not one.
 *
 * A route may begin and end with a `gap`: a straight line across ground nobody
 * has mapped, from the traveller to the nearest useful walkway or from the
 * last one to the lounge. Those are returned as what they are, so the map can
 * draw them differently from corridors that exist.
 */
export function findRoute(
  graph: WalkGraph,
  from: { lat: number; lon: number },
  to: { lat: number; lon: number }
): WalkRoute | null {
  const [fx, fy] = graph.project(from.lon, from.lat);
  const [tx, ty] = graph.project(to.lon, to.lat);
  const starts = nearestByNetwork(graph, fx, fy, START_REACH_M);
  const ends = nearestByNetwork(graph, tx, ty, DESTINATION_REACH_M);

  // Every network that reaches both ends is a candidate. Prefer the one that
  // leaves the least unmapped ground to cross: a fragment by the lounge door
  // is no use if the traveller is nowhere near it, and the main concourse a
  // little further off is.
  const options = [...ends]
    .filter(([network]) => starts.has(network))
    .map(([network, end]) => ({ start: starts.get(network)!, end }))
    .sort((p, q) => p.start.distance + p.end.distance - (q.start.distance + q.end.distance));

  const direct = Math.hypot(fx - tx, fy - ty);
  for (const { start, end } of options) {
    // If getting on and off the network is as far as the whole journey, the
    // network adds nothing — and the options only get worse from here.
    if (start.distance + end.distance >= direct) break;
    const found = search(graph, start, end);
    if (found) return assemble(graph, from, to, start, end, found);
  }
  return null;
}

interface Found {
  seconds: number;
  /** Graph nodes passed through, in order; empty when both ends share an edge. */
  nodes: number[];
  /** The edge taken to reach each of `nodes` after the first. */
  edges: number[];
}

/** Dijkstra between two points that each sit part-way along an edge. */
function search(graph: WalkGraph, start: Snap, end: Snap): Found | null {
  const along = (s: Snap, node: number) =>
    Math.hypot(graph.x[node] - s.x, graph.y[node] - s.y) / WALK_MPS;

  // Both ends on the same segment: no search needed.
  const sameEdge =
    (start.a === end.a && start.b === end.b) || (start.a === end.b && start.b === end.a);
  const direct = sameEdge ? Math.hypot(start.x - end.x, start.y - end.y) / WALK_MPS : Infinity;

  const count = graph.x.length;
  const best = new Float64Array(count).fill(Infinity);
  const prev = new Int32Array(count).fill(-1);
  const prevEdge = new Int32Array(count).fill(-1);
  const heap = new MinHeap();
  for (const node of [start.a, start.b]) {
    const seconds = along(start, node);
    if (seconds < best[node]) {
      best[node] = seconds;
      heap.push(node, seconds);
    }
  }

  const settled = new Uint8Array(count);
  let remaining = end.a === end.b ? 1 : 2;
  while (heap.size > 0 && remaining > 0) {
    const [node, seconds] = heap.pop();
    if (settled[node]) continue;
    settled[node] = 1;
    if (node === end.a || node === end.b) remaining--;
    for (const { to: next, seconds: cost, edge } of graph.adjacency[node]) {
      const total = seconds + cost;
      if (total < best[next]) {
        best[next] = total;
        prev[next] = node;
        prevEdge[next] = edge;
        heap.push(next, total);
      }
    }
  }

  const viaA = best[end.a] + along(end, end.a);
  const viaB = best[end.b] + along(end, end.b);
  const seconds = Math.min(viaA, viaB, direct);
  if (!Number.isFinite(seconds)) return null;
  if (seconds === direct) return { seconds, nodes: [], edges: [] };

  // Walk the predecessor chain back from whichever end of the destination
  // segment was quicker.
  const nodes: number[] = [];
  const edges: number[] = [];
  for (let node = viaA <= viaB ? end.a : end.b; node !== -1; node = prev[node]) {
    nodes.push(node);
    if (prevEdge[node] !== -1) edges.push(prevEdge[node]);
  }
  return { seconds, nodes: nodes.reverse(), edges: edges.reverse() };
}

function assemble(
  graph: WalkGraph,
  from: { lat: number; lon: number },
  to: { lat: number; lon: number },
  start: Snap,
  end: Snap,
  found: Found
): WalkRoute {
  const point = (s: Snap): [number, number] => [
    graph.lon[s.a] + s.t * (graph.lon[s.b] - graph.lon[s.a]),
    graph.lat[s.a] + s.t * (graph.lat[s.b] - graph.lat[s.a]),
  ];

  const coordinates: [number, number][] = [
    [from.lon, from.lat],
    point(start),
    ...found.nodes.map((n): [number, number] => [graph.lon[n], graph.lat[n]]),
    point(end),
    [to.lon, to.lat],
  ];
  const legs: Leg[] =
    found.nodes.length === 0
      ? [GAP_LEG, graph.legs[start.edge], GAP_LEG]
      : [GAP_LEG, graph.legs[start.edge], ...found.edges.map((e) => graph.legs[e]), graph.legs[end.edge], GAP_LEG];

  let walkMetres = 0;
  legs.forEach((leg, i) => {
    if (isWalkable(leg) || leg.kind === "gap") walkMetres += metresBetween(coordinates[i], coordinates[i + 1]);
  });

  return {
    coordinates,
    legs,
    seconds: found.seconds + ((start.distance + end.distance) * GAP_FACTOR) / WALK_MPS,
    walkMetres,
  };
}

function metresBetween(a: [number, number], b: [number, number]): number {
  const k = Math.cos((a[1] * Math.PI) / 180);
  return Math.hypot((a[0] - b[0]) * k, a[1] - b[1]) * 111320;
}

// --------------------------------------------------------------- directions

/** One instruction in a route. */
export type RouteStep =
  | {
      type: "walk";
      metres: number;
      underground: boolean;
      /** False for a stretch nobody has mapped, crossed in a straight line. */
      mapped: boolean;
    }
  | {
      type: "change";
      kind: "stairs" | "escalator" | "elevator";
      /** Floors moved, positive for up; null when the levels are not mapped. */
      floors: number | null;
      at: [number, number];
    }
  | {
      type: "train";
      line: string | null;
      from: string | null;
      to: string | null;
      board: [number, number];
      alight: [number, number];
    };

/** Walks shorter than this between two flights are a landing, not a leg. */
const LANDING_M = 30;
/** An unmapped hop shorter than this is just the step from corridor to door. */
const UNMAPPED_NOTE_M = 30;

/**
 * Boils a route down to what a person would be told: walk, change floor, take
 * the train, walk. This is also what explains a line that folds back on
 * itself — an escalator bank is drawn flat, so two floors of it look like a
 * U-turn on the map.
 */
export function describeRoute(route: WalkRoute): RouteStep[] {
  type Walk = { type: "walk"; metres: number; level: number | null; underground: boolean; mapped: boolean };
  type Change = { type: "change"; kind: Extract<RouteStep, { type: "change" }>["kind"]; at: [number, number] };
  // When several ways up are chained into one step, name it by the one a
  // traveller would remember.
  const rank = { stairs: 1, elevator: 2, escalator: 3 };
  const change = (kind: Change["kind"], at: [number, number]) => {
    const last = raw[raw.length - 1];
    if (last?.type !== "change") raw.push({ type: "change", kind, at });
    else if (rank[kind] > rank[last.kind]) last.kind = kind;
  };
  type Train = Extract<RouteStep, { type: "train" }> & { riding: boolean };
  const raw: (Walk | Change | Train)[] = [];

  const walk = (metres: number, level: number | null, underground: boolean) => {
    const last = raw[raw.length - 1];
    if (last?.type === "walk" && last.mapped && last.level === level) {
      last.metres += metres;
      last.underground ||= underground;
    } else {
      raw.push({ type: "walk", metres, level, underground, mapped: true });
    }
  };

  route.legs.forEach((leg, i) => {
    const [a, b] = [route.coordinates[i], route.coordinates[i + 1]];
    const metres = metresBetween(a, b);
    const last = raw[raw.length - 1];

    switch (leg.kind) {
      case "gap":
        if (metres >= UNMAPPED_NOTE_M) raw.push({ type: "walk", metres, level: null, underground: false, mapped: false });
        else walk(metres, null, false);
        break;
      case "walk":
        walk(metres, leg.level, leg.underground);
        break;
      case "stairs":
      case "escalator":
        change(leg.kind, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);
        break;
      case "lift":
        change("elevator", a);
        break;
      case "platform":
        // The same edge serves both directions: it ends a ride in progress,
        // and otherwise begins one.
        if (last?.type === "train" && last.riding) {
          last.to = leg.name;
          last.alight = b;
          last.riding = false;
        } else {
          raw.push({ type: "train", line: null, from: leg.name, to: null, board: a, alight: a, riding: true });
        }
        break;
      case "train":
        if (last?.type === "train" && last.riding) last.line ??= leg.name;
        break;
      case "station":
        // Through the station hall: no distance worth counting, nothing to say.
        break;
    }
  });

  // Fold flight – landing – flight into a single change of several floors.
  const merged: (Walk | Change | Train)[] = [];
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    const before = merged[merged.length - 1];
    const after = raw[i + 1];
    if (
      item.type === "walk" &&
      item.mapped &&
      item.metres < LANDING_M &&
      before?.type === "change" &&
      after?.type === "change"
    ) {
      if (rank[after.kind] > rank[before.kind]) before.kind = after.kind;
      i++; // the landing and the second flight are absorbed into `before`
      continue;
    }
    merged.push(item);
  }

  // The floor on each side of a change: the stretch right beside it, stepping
  // over only a short untagged stub. Looking further afield finds a level
  // eventually, but from another building — and terminals do not number their
  // floors alike, so that produced "down two levels" three times in a row.
  const levelBeside = (index: number, direction: 1 | -1): number | null => {
    for (let i = index + direction; i >= 0 && i < merged.length; i += direction) {
      const item = merged[i];
      if (item.type !== "walk" || !item.mapped) return null;
      if (item.level !== null) return item.level;
      if (item.metres >= LANDING_M) return null;
    }
    return null;
  };

  const steps: RouteStep[] = [];
  let underMetres = 0; // of the walk currently being accumulated
  merged.forEach((item, i) => {
    if (item.type === "change") {
      const from = levelBeside(i, -1);
      const to = levelBeside(i, 1);
      const floors = from !== null && to !== null && to !== from ? to - from : null;
      steps.push({ type: "change", kind: item.kind, floors, at: item.at });
      return;
    }
    if (item.type === "train") {
      steps.push({ type: "train", line: item.line, from: item.from, to: item.to, board: item.board, alight: item.alight });
      return;
    }
    if (!item.mapped) {
      steps.push({ type: "walk", metres: item.metres, underground: false, mapped: false });
      return;
    }
    // Stretches split only because their level tags differ are one walk to
    // the person doing it.
    const last = steps[steps.length - 1];
    if (last?.type === "walk" && last.mapped) {
      last.metres += item.metres;
    } else {
      steps.push({ type: "walk", metres: item.metres, underground: false, mapped: true });
      underMetres = 0;
    }
    if (item.underground) underMetres += item.metres;
    const current = steps[steps.length - 1] as Extract<RouteStep, { type: "walk" }>;
    current.underground = underMetres > current.metres / 2;
  });

  // Stepping off a train straight onto unmapped ground leaves a walk of no
  // length at all behind; it is not an instruction.
  const told = steps.filter((step) => step.type !== "walk" || step.metres >= 2);
  return told.length > 0 ? told : steps;
}

class MinHeap {
  private nodes: number[] = [];
  private keys: number[] = [];

  get size() {
    return this.nodes.length;
  }

  push(node: number, key: number) {
    let i = this.nodes.length;
    this.nodes.push(node);
    this.keys.push(key);
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.keys[parent] <= key) break;
      this.swap(i, parent);
      i = parent;
    }
  }

  pop(): [number, number] {
    const top: [number, number] = [this.nodes[0], this.keys[0]];
    const node = this.nodes.pop()!;
    const key = this.keys.pop()!;
    if (this.nodes.length > 0) {
      this.nodes[0] = node;
      this.keys[0] = key;
      let i = 0;
      for (;;) {
        const left = 2 * i + 1;
        const right = left + 1;
        let smallest = i;
        if (left < this.keys.length && this.keys[left] < this.keys[smallest]) smallest = left;
        if (right < this.keys.length && this.keys[right] < this.keys[smallest]) smallest = right;
        if (smallest === i) break;
        this.swap(i, smallest);
        i = smallest;
      }
    }
    return top;
  }

  private swap(i: number, j: number) {
    [this.nodes[i], this.nodes[j]] = [this.nodes[j], this.nodes[i]];
    [this.keys[i], this.keys[j]] = [this.keys[j], this.keys[i]];
  }
}

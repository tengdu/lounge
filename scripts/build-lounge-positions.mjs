#!/usr/bin/env node
// Gives every lounge it can a position on the map.
//
//   node scripts/build-lounge-positions.mjs            # every airport
//   node scripts/build-lounge-positions.mjs dfw jfk    # just these
//   node scripts/build-lounge-positions.mjs --refresh  # ignore the cache
//   node scripts/build-lounge-positions.mjs --todo     # list what is still unplaced
//
// scripts/fetch-indoor-maps.mjs places a lounge only when OpenStreetMap has
// enough of its surroundings to draw a floor plan, which is a third of them.
// The map that replaced the floor plan needs far less — one coordinate — so
// this fills in the rest, best evidence first:
//
//   1. The lounge itself, where OSM has it as a named point or room. Exact.
//   2. The gate its location names ("Terminal D, near Gate D24"). Gates are
//      mapped almost everywhere. Approximate: the pin is the gate, and the
//      lounge is near it.
//   3. An anchor recorded by hand in scripts/lounge-anchors.mjs, for lounges
//      whose description names no gate ("Central Terminal, mezzanine level").
//      Each was looked up on the web and carries its source: either the gate
//      the source names, or an OSM element — the lounge itself where the
//      name matching missed it, or a landmark the source places it beside
//      ("to the right of the Earl of Sandwich").
//
// A gate pin is flagged `pin: "gate"` and a landmark pin `pin: "landmark"`,
// and the map says what the pin is on. Lounges an anchor marks
// `unplaceable` — closed, or not where the catalogue says — are listed with
// the reason rather than placed.
// Lounges already placed by fetch-indoor-maps are left alone.
// Output: src/data/lounge-positions.ts.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { LOUNGES } from './lounge-sources.mjs';
import { ANCHORS } from './lounge-anchors.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cacheDir = join(root, '.cache', 'overpass');
const exactManifest = join(root, 'src', 'data', 'indoor-maps.ts');
const out = join(root, 'src', 'data', 'lounge-positions.ts');

const MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.openstreetmap.fr/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
const UA = 'airport-lounge-position-builder/1.0';

/** Deliberately the same request fetch-indoor-maps makes, so the two scripts
 *  share one cached download per airport. */
const LOUNGE_NAME_RE =
  'Sky Club|United Club|Admirals Club|Centurion|Polaris|Capital One|Sapphire Lounge|' +
  'Alaska Lounge|Escape Lounge|Flagship|Plaza Premium|The Club|USO|Maple Leaf|Clubhouse|' +
  'Galleries|Crown Lounge|Sakura|Prestige|Bluehouse|Provisions|Lounge';
const airportQuery = (code) => `[out:json][timeout:180];
nwr["aeroway"="aerodrome"]["iata"="${code}"]->.ap;
.ap map_to_area->.apa;
(
  way["indoor"](area.apa);
  node["aeroway"="gate"](area.apa);
  nwr["name"~"${LOUNGE_NAME_RE}",i](area.apa);
);
out geom tags;`;

/** Named terminal buildings — only asked for when a gate number is reused. */
const terminalQuery = (code) => `[out:json][timeout:60];
nwr["aeroway"="aerodrome"]["iata"="${code}"]->.ap;
.ap map_to_area->.apa;
nwr["aeroway"="terminal"]["name"](area.apa);
out tags center;`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const slug = (s) =>
  s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function overpass(query, refresh) {
  const file = join(cacheDir, `${createHash('sha1').update(query).digest('hex')}.json`);
  if (!refresh && existsSync(file)) return JSON.parse(readFileSync(file, 'utf8'));
  for (let attempt = 0; attempt < MIRRORS.length * 2; attempt++) {
    try {
      const res = await fetch(MIRRORS[attempt % MIRRORS.length], {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
        headers: { 'User-Agent': UA },
        signal: AbortSignal.timeout(200_000),
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
    await sleep(1500 * (attempt + 1));
  }
  return null;
}

function metres(a, b) {
  const k = Math.cos((((a.lat + b.lat) / 2) * Math.PI) / 180);
  return Math.hypot((a.lon - b.lon) * k, a.lat - b.lat) * 111320;
}

// ----------------------------------------------------------- is it the same lounge?

/** What OSM contributors call each chain, matched against a point's name. */
const BRAND_PATTERNS = [
  ['delta-one', /\bdelta\s*one\s+lounge\b/i],
  ['delta-sky-club', /\bsky\s*club\b|\bdelta\s+sky\s+lounge\b/i],
  ['united-polaris', /\bpolaris\b/i],
  ['united-club-fly', /\bunited\s+club\s+fly\b/i],
  ['united-club', /\bunited\s+club\b/i],
  ['flagship', /\bflagship\b/i],
  ['provisions', /\bprovisions\b/i],
  ['admirals', /\badmirals\b/i],
  ['alaska', /\balaska(\s+airlines?)?\s+(lounge|board\s*room)\b/i],
  ['centurion', /\bcenturion\b/i],
  ['capital-one-landing', /\bcapital\s+one\s+landing\b/i],
  ['capital-one-lounge', /\bcapital\s+one\b/i],
  ['chase-sapphire-terrace', /\bsapphire\s+terrace\b/i],
  ['chase-sapphire', /\bsapphire\b/i],
  ['escape', /\bescape\s+lounges?\b/i],
  ['plaza-premium-first', /\bplaza\s+premium\s+first\b/i],
  ['plaza-premium', /\bplaza\s+premium\b/i],
  ['the-club', /\bthe\s+club\b/i],
  ['uso', /\buso\b/i],
  ['jetblue', /\b(jetblue|bluehouse)\b/i],
];
const brandOf = (name) => BRAND_PATTERNS.find(([, re]) => re.test(name))?.[0] ?? null;

/**
 * Chains where the brand alone names the lounge: any "Sky Club" at an airport
 * is a Delta Sky Club. Every other group in the catalogue ("foreign-business",
 * "independent", …) is a bucket of unrelated lounges, and for those the names
 * themselves have to agree.
 */
const CHAINS = new Set([
  'delta-one', 'delta-sky-club', 'united-polaris', 'united-club-fly', 'united-club', 'provisions', 'admirals',
  'alaska', 'centurion', 'capital-one-landing', 'capital-one-lounge', 'chase-sapphire-terrace', 'escape',
  'plaza-premium-first', 'plaza-premium', 'the-club', 'uso', 'jetblue',
]);

const FILLER = new Set([
  'the', 'a', 'an', 'of', 'by', 'at', 'in', 'and', 'with', 'lounge', 'lounges', 'airlines', 'airline', 'air',
  'airways', 'international', 'terminal', 'collaboration',
]);
const words = (name) =>
  new Set(name.toLowerCase().replace(/[’']/g, '').split(/[^a-z0-9]+/).filter((w) => w.length > 1 && !FILLER.has(w)));

/** Words too common among lounge names to identify one on their own. */
const VAGUE = new Set([
  'sky', 'club', 'first', 'business', 'class', 'premium', 'one', 'vip', 'executive', 'airport', 'center', 'centre',
  'hospitality', 'service', 'services', 'member', 'members', 'elite', 'star', 'gold', 'golden', 'gate',
]);

/**
 * One name's telling words all appear in the other's: "Maple Leaf Lounge" is
 * the "Air Canada Maple Leaf Lounge". At least one of the shared words has to
 * mean something — a hotel bar called "Sky Lounge" shares "sky" with every
 * Delta Sky Club and is none of them.
 */
function namesAgree(a, b) {
  const [small, large] = [words(a), words(b)].sort((p, q) => p.size - q.size);
  return small.size > 0 && [...small].every((w) => large.has(w)) && [...small].some((w) => !VAGUE.has(w));
}

function sameLounge(pointName, lounge) {
  // "To Centurion Lounge" is a signpost, not the lounge.
  if (/^to\s/i.test(pointName)) return false;
  const brand = brandOf(pointName);
  // A chain is recognised by its brand pattern and nothing looser.
  if (CHAINS.has(lounge.brand)) return brand === lounge.brand;
  if (brand !== null && CHAINS.has(brand)) return false;
  return namesAgree(pointName, lounge.name);
}

/** The pier a location names — "Concourse B", "Airside E", "the C gates". */
function pierLetter(location) {
  return (
    location.match(/\bConcourse\s+([A-Z])\b/)?.[1] ??
    location.match(/\bAirside\s+([A-Z])\b/)?.[1] ??
    location.match(/\bTerminal\s+([A-Z])\b/)?.[1] ??
    location.match(/\bthe\s+([A-Z])\s+gates\b/)?.[1] ??
    null
  );
}

/**
 * The ways a gate may be written on the map. Catalogue and mappers do not
 * always agree: Tampa's "Airside E, near Gate 68" is mapped as E68, and
 * LaGuardia's "C90" as plain 90.
 */
function spellings(gate, location, lettersInUse) {
  const list = [gate];
  const m = gate.match(/^([A-Z]?)(\d+[A-Z]?)$/);
  if (m) {
    const [, letter, number] = m;
    const pier = pierLetter(location);
    if (!letter && pier && lettersInUse.has(pier)) list.push(pier + number);
    if (letter && !lettersInUse.has(letter)) list.push(number);
  }
  return list;
}

/**
 * Does this OSM point sit where our catalogue says the lounge is? Same test
 * as fetch-indoor-maps: gate references are how airports are laid out, so they
 * are what tells one United Club from the next. True, false, or null when the
 * description gives nothing to check against.
 */
function confirmsLocation(lounge, nearbyRefs, lettersInUse) {
  const refs = nearbyRefs.flatMap((r) => [...refsOf(r)]);
  if (refs.length === 0) return null;
  if (lounge.gate) {
    for (const gate of spellings(lounge.gate, lounge.location, lettersInUse)) {
      if (refs.includes(gate)) return true;
      const m = gate.match(/^([A-Z]*)(\d+)/);
      for (const ref of refs) {
        const rm = ref.match(/^([A-Z]*)(\d+)/);
        if (m && rm && rm[1] === m[1] && Math.abs(Number(rm[2]) - Number(m[2])) <= 8) return true;
      }
    }
    return false;
  }
  // "Terminal B" says nothing about gates numbered 40 to 59: the letter is
  // only a test where this airport puts it on its gates.
  const letter = pierLetter(lounge.location);
  if (letter && lettersInUse.has(letter)) return refs.some((r) => r.startsWith(letter));
  return null;
}

// ----------------------------------------------------------------------- gates

/** "C19 / C20" and "E29 A/B" are one node serving several gates. */
function refsOf(ref) {
  // Anchorage writes its gates "B-3".
  const tokens = ref.toUpperCase().replace(/([A-Z])-(\d)/g, '$1$2').split(/[\s/;,]+/).filter(Boolean);
  const found = new Set();
  let stem = null;
  for (const token of tokens) {
    if (/^[A-Z]*\d+[A-Z]?$/.test(token)) {
      found.add(token);
      stem = token.replace(/[A-Z]$/, '');
      found.add(stem); // E22A also answers to E22
    } else if (stem && /^[A-Z]$/.test(token)) {
      found.add(stem + token); // the "B" of "E29 A/B"
    }
  }
  return found;
}

const split = (gate) => {
  const m = gate.match(/^([A-Z]*)(\d+)/);
  return m ? { pier: m[1], n: Number(m[2]) } : null;
};

/**
 * Where is this gate? The mapped node if there is one; otherwise halfway
 * between its numbered neighbours on the same pier, which is where a missing
 * gate has to be. Never a guess from one side only.
 *
 * Returns `{ ambiguous: true }` when the airport uses the number twice — JFK's
 * terminals each start again from 1 — because averaging those would put the
 * pin on a taxiway between two buildings.
 */
function locate(gate, nodes) {
  const exact = nodes.filter((g) => g.refs.has(gate));
  if (exact.length > 0) {
    const spread = Math.max(...exact.map((a) => Math.max(...exact.map((b) => metres(a, b)))));
    if (spread > 150) return { ambiguous: true, places: exact };
    return {
      lat: exact.reduce((s, g) => s + g.lat, 0) / exact.length,
      lon: exact.reduce((s, g) => s + g.lon, 0) / exact.length,
      osm: `node/${exact[0].id}`,
      how: 'gate',
    };
  }

  const want = split(gate);
  if (!want) return null;
  const samePier = nodes
    .flatMap((g) => [...g.refs].map((r) => ({ g, at: split(r) })))
    .filter((x) => x.at && x.at.pier === want.pier);
  const below = samePier.filter((x) => x.at.n < want.n).sort((a, b) => b.at.n - a.at.n)[0];
  const above = samePier.filter((x) => x.at.n > want.n).sort((a, b) => a.at.n - b.at.n)[0];
  if (!below || !above || above.at.n - below.at.n > 6 || metres(below.g, above.g) > 400) return null;

  const t = (want.n - below.at.n) / (above.at.n - below.at.n);
  return {
    lat: below.g.lat + t * (above.g.lat - below.g.lat),
    lon: below.g.lon + t * (above.g.lon - below.g.lon),
    osm: `node/${below.g.id}`,
    how: `between ${below.g.ref} and ${above.g.ref}`,
  };
}

// ------------------------------------------------------------------------ main

async function main() {
  const args = process.argv.slice(2);
  const refresh = args.includes('--refresh');
  const todo = args.includes('--todo');
  const only = args.filter((a) => !a.startsWith('--')).map((a) => a.toUpperCase());
  const codes = [...new Set(LOUNGES.map(([c]) => c))].filter((c) => only.length === 0 || only.includes(c));

  // What fetch-indoor-maps placed: those lounges are done, and the OSM points
  // they used are spoken for.
  const placed = new Map(); // lounge id -> osm ref
  for (const m of readFileSync(exactManifest, 'utf8').matchAll(/^\s*"([a-z0-9-]+)":\s*\{[^}]*osm:\s*"([^"]+)"/gm)) {
    placed.set(m[1], m[2]);
  }

  // Keep other airports' entries: a run only knows about the ones it was given.
  const entries = {};
  if (only.length > 0 && existsSync(out)) {
    for (const line of readFileSync(out, 'utf8').split('\n')) {
      const id = line.match(/^\s*"([a-z0-9-]+)":\s*\{/)?.[1];
      if (id && !only.some((c) => id.startsWith(`${c.toLowerCase()}-`))) entries[id] = line.trim();
    }
  }

  const tally = { lounge: 0, gate: 0, search: 0 };
  const unplaced = [];

  for (const code of codes) {
    const ours = LOUNGES.filter(([c]) => c === code).map(([c, name, location, brand]) => ({
      id: `${c.toLowerCase()}-${slug(name)}-${slug(location)}`,
      name,
      location,
      brand,
      gate: location.match(/\bGates?\s+([A-Z]?\d+[A-Z]?)\b/)?.[1]?.toUpperCase() ?? null,
    }));
    for (const lounge of ours) {
      const reason = ANCHORS[lounge.id]?.unplaceable;
      if (reason && !placed.has(lounge.id)) unplaced.push({ code, ...lounge, why: reason });
    }
    const open = ours.filter((l) => !placed.has(l.id) && !ANCHORS[l.id]?.unplaceable);
    if (open.length === 0) continue;

    const data = await overpass(airportQuery(code), refresh);
    if (!data) {
      console.log(`${code}: Overpass unavailable`);
      for (const l of open) unplaced.push({ code, ...l, why: 'no airport data' });
      continue;
    }

    const gates = data.elements
      .filter((e) => e.type === 'node' && e.tags?.aeroway === 'gate' && e.tags?.ref)
      .map((g) => ({ id: g.id, lat: g.lat, lon: g.lon, ref: g.tags.ref, refs: refsOf(g.tags.ref) }));
    const gatesNear = (point, reach) =>
      [...new Set(gates.map((g) => ({ ref: g.ref, d: metres(point, g) })).filter((g) => g.d <= reach).sort((a, b) => a.d - b.d).map((g) => g.ref))];
    /** Pier letters this airport actually writes on its gates. */
    const lettersInUse = new Set(gates.flatMap((g) => [...g.refs].map((r) => r.match(/^[A-Z]/)?.[0]).filter(Boolean)));

    // --- 1. the lounge itself
    const used = new Set(ours.filter((l) => placed.has(l.id)).map((l) => placed.get(l.id)));
    const allPoints = data.elements
      .filter((e) => e.tags?.name)
      .map((e) => {
        const at = e.center
          ? e.center
          : e.geometry
            ? {
                lat: e.geometry.reduce((s, p) => s + p.lat, 0) / e.geometry.length,
                lon: e.geometry.reduce((s, p) => s + p.lon, 0) / e.geometry.length,
              }
            : e.lat !== undefined
              ? { lat: e.lat, lon: e.lon }
              : null;
        return at && { ref: `${e.type}/${e.id}`, name: e.tags.name, level: e.tags.level?.split(';')[0] ?? null, ...at };
      })
      .filter(Boolean);

    const found = new Map(); // lounge id -> point
    const spoken = new Set(used);

    // Landmarks an anchor names — a café, a food court — are not in the
    // airport download, which asks only for lounges, gates and floor plans.
    const missing = [...new Set(open.map((l) => ANCHORS[l.id]?.osm).filter((ref) => ref && !allPoints.some((p) => p.ref === ref)))];
    if (missing.length > 0) {
      const ids = missing.map((ref) => ref.replace(/^(node|way|relation)\/(\d+)$/, '$1($2);')).join('');
      const extra = await overpass(`[out:json][timeout:60];\n(${ids});\nout tags center;`, refresh);
      for (const e of extra?.elements ?? []) {
        const at = e.center ?? (e.lat !== undefined ? { lat: e.lat, lon: e.lon } : null);
        if (!at) continue;
        allPoints.push({ ref: `${e.type}/${e.id}`, name: e.tags?.name ?? `${e.type}/${e.id}`, level: e.tags?.level?.split(';')[0] ?? null, ...at });
      }
    }

    // A lookup that settled which mapped point a lounge is outranks any guess.
    for (const lounge of open) {
      const ref = ANCHORS[lounge.id]?.osm;
      if (!ref) continue;
      const point = allPoints.find((p) => p.ref === ref);
      if (!point) {
        console.log(`  ${lounge.id}: anchor ${ref} could not be fetched from OSM — ignored`);
        continue;
      }
      found.set(lounge.id, point);
      spoken.add(ref);
    }

    const links = []; // every plausible (point, lounge), with whether the gates agree
    for (const point of allPoints) {
      if (spoken.has(point.ref)) continue;
      const near = gatesNear(point, 170);
      for (const lounge of open) {
        if (found.has(lounge.id) || !sameLounge(point.name, lounge)) continue;
        links.push({ point, lounge, ok: confirmsLocation(lounge, near.slice(0, 4), lettersInUse) });
      }
    }
    if (process.env.DEBUG_MATCH) {
      for (const { point, lounge, ok } of links) {
        console.log(`  ${code} ${ok === null ? '?' : ok ? 'Y' : 'n'} "${point.name}" ${point.ref} near[${gatesNear(point, 170).slice(0, 4)}]  ~  ${lounge.name} — ${lounge.location}`);
      }
    }
    // Gates agree: take it. Where several points confirm one lounge they are
    // the same room mapped twice, and either will do.
    for (const { point, lounge, ok } of links) {
      if (ok !== true || found.has(lounge.id) || spoken.has(point.ref)) continue;
      found.set(lounge.id, point);
      spoken.add(point.ref);
    }
    // Nothing to check against: only when there is no one else it could be.
    for (const { point, lounge, ok } of links) {
      if (ok !== null || found.has(lounge.id) || spoken.has(point.ref)) continue;
      const rivals = links.filter((x) => x.ok !== false && !found.has(x.lounge.id) && !spoken.has(x.point.ref));
      const sameRoom = (a, b) => metres(a, b) < 60;
      const otherLounges = rivals.filter((x) => x.point.ref === point.ref && x.lounge.id !== lounge.id);
      const otherPoints = rivals.filter((x) => x.lounge.id === lounge.id && !sameRoom(x.point, point));
      if (otherLounges.length > 0 || otherPoints.length > 0) continue;
      found.set(lounge.id, point);
      spoken.add(point.ref);
    }

    // --- 2 and 3. a gate: the one the location names, else one looked up
    let terminals = null; // fetched only if a gate number turns out to be reused
    const placeGate = async (lounge, gate) => {
      let ambiguous = null;
      for (const spelling of spellings(gate, lounge.location, lettersInUse)) {
        const spot = locate(spelling, gates);
        if (spot && !spot.ambiguous) return spot;
        if (spot?.ambiguous) ambiguous = spot.places;
      }
      if (!ambiguous) return null;

      // The number exists in several terminals. Take the one in the terminal
      // the location names — if the map knows that terminal, and one of the
      // candidates is plainly the nearest to it.
      const wanted = lounge.location.match(/\bTerminal\s+([A-Z0-9]+)\b/i)?.[1];
      if (!wanted) return { ambiguous: ambiguous.length };
      terminals ??= (await overpass(terminalQuery(code), refresh))?.elements ?? [];
      const here = terminals
        .filter((t) => new RegExp(`\\bterminal\\s+${wanted}\\b`, 'i').test(t.tags.name))
        .map((t) => t.center ?? t)
        .filter((t) => t.lat !== undefined);
      if (here.length === 0) return { ambiguous: ambiguous.length };
      const ranked = ambiguous
        .map((g) => ({ g, d: Math.min(...here.map((t) => metres(t, g))) }))
        .sort((a, b) => a.d - b.d);
      if (ranked[0].d > 600 || (ranked[1] && ranked[1].d < ranked[0].d * 1.5)) return { ambiguous: ambiguous.length };
      return { lat: ranked[0].g.lat, lon: ranked[0].g.lon, osm: `node/${ranked[0].g.id}`, how: `gate, in Terminal ${wanted}` };
    };

    for (const lounge of open) {
      const point = found.get(lounge.id);
      if (point) {
        const near = gatesNear(point, 400).slice(0, 3);
        const anchor = ANCHORS[lounge.id];
        // A landmark anchor puts the pin beside the lounge, not on it.
        const pin = anchor?.landmark ? 'landmark' : 'lounge';
        const extra =
          (anchor?.osm ? ', via: "search"' : '') + (anchor?.landmark ? `, landmark: ${JSON.stringify(anchor.landmark)}` : '');
        entries[lounge.id] =
          // A looked-up element can be shared — one mapped point for Korean
          // Air's three lounges on two floors — so its level tag is not
          // repeated as this lounge's own unless the anchor says so.
          `${JSON.stringify(lounge.id)}: { pin: "${pin}", gates: ${JSON.stringify(near)}, level: ${JSON.stringify(anchor?.osm ? (anchor.level ?? null) : point.level)}, ` +
          `osm: ${JSON.stringify(point.ref)}, lat: ${point.lat.toFixed(6)}, lon: ${point.lon.toFixed(6)}${extra} },`;
        tally[anchor?.osm ? 'search' : 'lounge']++;
        continue;
      }

      // The catalogue's own gate first; a looked-up one where it names none,
      // or names one the map does not have.
      const lookedUp = ANCHORS[lounge.id]?.gate?.toUpperCase() ?? null;
      let gate = lounge.gate;
      let spot = gate ? await placeGate(lounge, gate) : null;
      if ((!spot || spot.ambiguous) && lookedUp) {
        gate = lookedUp;
        spot = await placeGate(lounge, gate);
      }
      if (spot && !spot.ambiguous) {
        const searched = gate !== lounge.gate;
        entries[lounge.id] =
          `${JSON.stringify(lounge.id)}: { pin: "gate", gates: ${JSON.stringify([gate])}, level: null, ` +
          `osm: ${JSON.stringify(spot.osm)}, lat: ${spot.lat.toFixed(6)}, lon: ${spot.lon.toFixed(6)}${searched ? ', via: "search"' : ''} },`;
        tally[searched ? 'search' : 'gate']++;
        continue;
      }

      unplaced.push({
        code,
        ...lounge,
        why: !gate
          ? 'names no gate'
          : spot?.ambiguous
            ? `gate ${gate} exists in ${spot.ambiguous} places`
            : `gate ${gate} not in OSM`,
      });
    }
  }

  const sorted = Object.keys(entries).sort();
  writeFileSync(
    out,
    `// AUTO-GENERATED by scripts/build-lounge-positions.mjs — do not edit by hand.
//
// Map positions for the lounges scripts/fetch-indoor-maps.mjs could not place.
// \`pin: "lounge"\` is the lounge itself as mapped in OpenStreetMap. \`pin: "gate"\`
// is the gate it is described by, and \`pin: "landmark"\` a shop or hall it is
// described as beside — the lounge is near the pin, not on it. \`via: "search"\`
// marks a position looked up on the web and recorded, with its source, in
// scripts/lounge-anchors.mjs.

export interface PlacedLounge {
  pin: "lounge" | "gate" | "landmark";
  /** For a gate pin, the gate it sits on; for a lounge pin, the nearest gates. */
  gates: string[];
  /** Building level as tagged in OSM, when the lounge itself is mapped. */
  level: string | null;
  /** The OSM element the position was taken from. */
  osm: string;
  lat: number;
  lon: number;
  /** Set when the position came from a web lookup rather than the catalogue. */
  via?: "search";
  /** For a landmark pin, what the pin is on. */
  landmark?: string;
}

export const loungePositions: Record<string, PlacedLounge> = {
${sorted.map((id) => `  ${entries[id]}`).join('\n')}
};
`
  );

  console.log(
    `${sorted.length} positions written (this run: ${tally.lounge} found in OSM by name, ${tally.gate} pinned to the gate named, ` +
      `${tally.search} placed from a web lookup); ${placed.size} more come from indoor-maps.ts`
  );
  console.log(`${unplaced.length} lounges still without a position`);
  if (todo) for (const u of unplaced) console.log(`  ${u.id}\n      ${u.name} — ${u.location}   [${u.why}]`);
}

main();

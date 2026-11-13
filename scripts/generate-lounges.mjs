// Regenerates src/data/lounges.ts from scripts/lounge-sources.mjs.
//
//   node scripts/generate-lounges.mjs
//
// Everything about an entry is derived deterministically from the source
// tuple, so re-running produces byte-identical output.

import { existsSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  AIRPORTS,
  AIRPORT_NAMES,
  ALLIANCE_STATUS,
  AMENITY_CATALOG,
  BRANDS,
  BRAND_AMENITIES,
  BRAND_IMAGES,
  CARRIER_ALLIANCES,
  CREDENTIALS,
  CREDENTIAL_GROUPS,
  LOUNGES,
  LOUNGE_PHOTOS,
} from './lounge-sources.mjs';

const AMENITY_ORDER = new Map(AMENITY_CATALOG.map((a, i) => [a.id, i]));
const CREDENTIAL_IDS = new Set(CREDENTIALS.map((c) => c.id));
const CREDENTIAL_BY_ID = new Map(CREDENTIALS.map((c) => [c.id, c]));
const VIA_ORDER = new Map(CREDENTIAL_GROUPS.map((g, i) => [g.id, i]));

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'lounges.ts');

/**
 * Which image file backs a lounge. Real photo if we have one for this exact
 * lounge, else the brand's generic art. Hero variants are produced by
 * scripts/optimize-images.mjs; the matching `-card.webp` is derived at render
 * time by src/lib/images.ts.
 */
function imageBase(id, brandKey) {
  const real = LOUNGE_PHOTOS[id];
  if (real) return real.file;

  const generic = BRAND_IMAGES[brandKey];
  if (!generic) throw new Error(`No BRAND_IMAGES entry for brand "${brandKey}"`);
  return generic;
}

/** Stable 32-bit hash so image choice and rating jitter never move between runs. */
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const slug = (str) =>
  str
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/**
 * A carrier-operated lounge admits that carrier's alliance elites, but the
 * brand entry cannot say which alliance — it is shared by every foreign
 * carrier. Resolve it from the lounge name so the route becomes something the
 * access checker can actually match, instead of untyped prose.
 */
function allianceRoutesFor(name, brandKey) {
  if (!['foreign-business', 'foreign-first', 'alliance'].includes(brandKey)) return [];

  const hit = Object.keys(CARRIER_ALLIANCES).find((carrier) => name.includes(carrier));
  const alliance = hit ? CARRIER_ALLIANCES[hit] : undefined;

  if (hit === undefined) {
    // Unmapped carrier: better to say nothing than to guess an alliance.
    console.warn(`  note: no CARRIER_ALLIANCES entry for "${name}" — no status route added`);
    return [];
  }
  if (alliance === null) return []; // genuinely unaligned carrier

  const tier = brandKey === 'foreign-first' ? 'first' : 'business';
  const credential = ALLIANCE_STATUS[alliance][tier];
  const label = CREDENTIAL_BY_ID.get(credential).label;

  return [['status', credential, label, `On a same-day ${hit} or partner flight.`]];
}

/**
 * Break a location string into the parts a traveller navigates by. The first
 * comma-separated clause is always the zone (terminal, concourse or
 * satellite); the rest describes where inside it.
 *
 * Nothing here is invented. We do not have turn-by-turn walking directions for
 * 330 lounges, and guessing them would send people the wrong way, so the page
 * shows the terminal, concourse, gate, level and security side we actually
 * know, and hands off to a maps app for the rest.
 */
function wayfinding(location, code) {
  const [zone, ...rest] = location.split(',').map((s) => s.trim());
  const detail = rest.join(', ');

  const gate = location.match(/\bGates?\s+([A-Z]?\d+[A-Z]?)\b/)?.[1] ?? null;
  const concourse = location.match(/\bConcourse\s+([A-Z0-9-]+)\b/)?.[1] ?? null;

  const terminalMatch =
    location.match(/\b([A-Z][A-Za-z.'’\-]*(?:\s+[A-Z][A-Za-z.'’\-]*)*)\s+Terminal\b/) ??
    location.match(/\bTerminal\s+([A-Z0-9][A-Za-z0-9-]*)\b/);
  const terminal = terminalMatch
    ? terminalMatch[0].replace(/\s+/g, ' ')
    : /Satellite/i.test(zone)
      ? zone
      : null;

  const level =
    location.match(
      /\b(mezzanine|upper level|lower level|level \d+|\d+(?:st|nd|rd|th) floor|(?:first|second|third|fourth|fifth|ground) (?:floor|level))\b/i
    )?.[0] ?? null;

  const security = /\bpre-security|landside\b/i.test(location)
    ? 'landside'
    : /\bafter security|airside|beyond the|past security\b/i.test(location)
      ? 'airside'
      : null;

  // Maps apps resolve airports and named terminals; they do not resolve
  // "Concourse B, near Gate B18". Only send them what they can find.
  const airportName = AIRPORT_NAMES[code];
  if (!airportName) throw new Error(`No AIRPORT_NAMES entry for ${code}`);
  const mapsQuery = terminal && /terminal/i.test(terminal) ? `${airportName} ${terminal}` : airportName;

  return { zone, detail, terminal, concourse, gate, level, security, mapsQuery };
}

function main() {
  const seen = new Map();
  const lounges = [];

  for (const [code, name, location, brandKey, note] of LOUNGES) {
    const city = AIRPORTS[code];
    if (!city) throw new Error(`Unknown airport code: ${code}`);
    const brand = BRANDS[brandKey];
    if (!brand) throw new Error(`Unknown brand "${brandKey}" for ${code} ${name}`);

    // IDs are airport + lounge + location, so two clubs of the same brand at
    // one airport stay distinct without a positional counter.
    let id = `${code.toLowerCase()}-${slug(name)}-${slug(location)}`;
    if (seen.has(id)) {
      throw new Error(`Duplicate lounge id "${id}" — ${code} ${name} at ${location}`);
    }
    seen.set(id, true);

    const closed = note === 'closed';
    const description =
      `${brand.blurb} Located at ${code} (${city}) in ${location}.` +
      (closed ? ' Currently closed for renovation — check before you travel.' : '');

    // Editorial tier rating with a small deterministic offset so identically
    // branded lounges do not all render the same number. Not a user score.
    const jitter = ((hash(id) % 5) - 2) / 10;
    const rating = Math.min(5, Math.max(3.4, Math.round((brand.tier + jitter) * 10) / 10));

    const rawAmenities = BRAND_AMENITIES[brandKey];
    if (!rawAmenities) throw new Error(`No amenities defined for brand "${brandKey}"`);

    for (const a of rawAmenities) {
      if (!AMENITY_ORDER.has(a)) {
        throw new Error(`Brand "${brandKey}" lists unknown amenity "${a}" — add it to AMENITY_CATALOG`);
      }
    }
    // Present amenities in catalog order regardless of how they were authored.
    const amenities = [...rawAmenities].sort((a, b) => AMENITY_ORDER.get(a) - AMENITY_ORDER.get(b));

    if (!brand.routes?.length) throw new Error(`Brand "${brandKey}" has no access routes`);

    const routeTuples = [...brand.routes, ...allianceRoutesFor(name, brandKey)];
    const routes = routeTuples
      .map(([via, credential, label, routeNote]) => {
        if (!VIA_ORDER.has(via)) throw new Error(`Brand "${brandKey}" uses unknown route group "${via}"`);
        if (credential !== null && !CREDENTIAL_IDS.has(credential)) {
          throw new Error(`Brand "${brandKey}" references unknown credential "${credential}"`);
        }
        if (credential !== null && CREDENTIAL_BY_ID.get(credential).group !== via) {
          throw new Error(
            `Brand "${brandKey}": credential "${credential}" is in group ` +
              `"${CREDENTIAL_BY_ID.get(credential).group}" but the route says "${via}"`
          );
        }
        return { via, credential, label, note: routeNote ?? '' };
      })
      // Present routes grouped the same way everywhere, and drop a duplicate
      // credential if a carrier route repeats one the brand already listed.
      .filter((r, i, all) => r.credential === null || all.findIndex((o) => o.credential === r.credential) === i)
      .sort((a, b) => VIA_ORDER.get(a.via) - VIA_ORDER.get(b.via));

    const photoSource = LOUNGE_PHOTOS[id];
    const photo = photoSource
      ? {
          scope: photoSource.scope,
          kind: photoSource.kind,
          credit: photoSource.credit,
          license: photoSource.license,
          licenseUrl: photoSource.licenseUrl,
          source: photoSource.source,
        }
      : null;

    lounges.push({
      id,
      name,
      airportCode: code,
      airportCity: city,
      airportName: AIRPORT_NAMES[code],
      location,
      description,
      rating,
      access: {
        summary: brand.summary,
        routes,
        guests: brand.guests,
        arrival: brand.arrival,
        dayPass: brand.dayPass ?? null,
        dayPassNote: brand.dayPassNote ?? null,
      },
      amenities,
      wayfinding: wayfinding(location, code),
      // A real photograph of this exact lounge when we have one, otherwise
      // the brand's generic art.
      imageUrl: `/images/lounges/${imageBase(id, brandKey)}.webp`,
      photo,
      closed,
    });
  }

  // A typo in LOUNGE_PHOTOS would silently fall back to brand art, so verify
  // every key matched a real lounge and every file actually exists.
  const ids = new Set(lounges.map((l) => l.id));
  for (const key of Object.keys(LOUNGE_PHOTOS)) {
    if (!ids.has(key)) throw new Error(`LOUNGE_PHOTOS key does not match any lounge id: "${key}"`);
    const entry = LOUNGE_PHOTOS[key];
    for (const field of ['file', 'scope', 'kind', 'credit', 'license', 'licenseUrl', 'source']) {
      if (!entry[field]) throw new Error(`LOUNGE_PHOTOS["${key}"] is missing "${field}"`);
    }
    if (!['exact', 'airport'].includes(entry.scope)) {
      throw new Error(`LOUNGE_PHOTOS["${key}"] has invalid scope "${entry.scope}"`);
    }
    if (!['interior', 'entrance'].includes(entry.kind)) {
      throw new Error(`LOUNGE_PHOTOS["${key}"] has invalid kind "${entry.kind}"`);
    }
  }
  for (const lounge of lounges) {
    const file = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', lounge.imageUrl);
    if (!existsSync(file)) {
      throw new Error(`Missing image ${lounge.imageUrl} for ${lounge.id} — run scripts/optimize-images.mjs`);
    }
  }

  lounges.sort((a, b) => a.airportCode.localeCompare(b.airportCode) || a.name.localeCompare(b.name));

  const airportCount = new Set(lounges.map((l) => l.airportCode)).size;
  const realPhotos = lounges.filter((l) => l.photo).length;

  const json = (v) => JSON.stringify(v);

  const body = lounges
    .map((l) => {
      const field = (k) => `    ${k}: ${json(l[k])},`;
      const routes = l.access.routes
        .map(
          (r) =>
            `        { via: ${json(r.via)}, credential: ${json(r.credential)}, ` +
            `label: ${json(r.label)}, note: ${json(r.note)} },`
        )
        .join('\n');
      const w = l.wayfinding;
      return [
        '  {',
        field('id'),
        field('name'),
        field('airportCode'),
        field('airportCity'),
        field('airportName'),
        field('location'),
        field('description'),
        `    rating: ${l.rating},`,
        `    closed: ${l.closed},`,
        '    access: {',
        `      summary: ${json(l.access.summary)},`,
        '      routes: [',
        routes,
        '      ],',
        `      guests: ${json(l.access.guests)},`,
        `      arrival: ${json(l.access.arrival)},`,
        `      dayPass: ${json(l.access.dayPass)},`,
        `      dayPassNote: ${json(l.access.dayPassNote)},`,
        '    },',
        `    amenities: ${json(l.amenities)},`,
        '    wayfinding: {',
        `      zone: ${json(w.zone)},`,
        `      detail: ${json(w.detail)},`,
        `      terminal: ${json(w.terminal)},`,
        `      concourse: ${json(w.concourse)},`,
        `      gate: ${json(w.gate)},`,
        `      level: ${json(w.level)},`,
        `      security: ${json(w.security)},`,
        `      mapsQuery: ${json(w.mapsQuery)},`,
        '    },',
        field('imageUrl'),
        l.photo
          ? [
              '    photo: {',
              `      scope: ${json(l.photo.scope)},`,
              `      kind: ${json(l.photo.kind)},`,
              `      credit: ${json(l.photo.credit)},`,
              `      license: ${json(l.photo.license)},`,
              `      licenseUrl: ${json(l.photo.licenseUrl)},`,
              `      source: ${json(l.photo.source)},`,
              '    },',
            ].join('\n')
          : '    photo: null,',
        '  },',
      ].join('\n');
    })
    .join('\n');

  const file = `// AUTO-GENERATED — do not edit by hand.
// Run \`node scripts/generate-lounges.mjs\` after editing scripts/lounge-sources.mjs.
//
// ${lounges.length} lounges across ${airportCount} US airports.
// ${realPhotos} carry a real, freely-licensed photograph; the rest use brand art.
//
// Note on \`rating\`: these are editorial tier estimates derived from the lounge
// brand (flagship international lounges rank above standard airline clubs, and
// so on). They are not aggregated user reviews.

export type Amenity =
${AMENITY_CATALOG.map((a) => `  | ${json(a.id)}`).join('\n')};

/** Display order and labels for every amenity, straight from the catalog. */
export const AMENITY_CATALOG: { id: Amenity; label: string }[] = [
${AMENITY_CATALOG.map((a) => `  { id: ${json(a.id)}, label: ${json(a.label)} },`).join('\n')}
];

/**
 * Something a traveller holds year-round that opens a lounge door. Entry that
 * depends on today's ticket is described on each lounge but is deliberately
 * not a credential — nobody can answer it in advance.
 */
export type Credential =
${CREDENTIALS.map((c) => `  | ${json(c.id)}`).join('\n')};

export type AccessVia =
${CREDENTIAL_GROUPS.map((g) => `  | ${json(g.id)}`).join('\n')};

export const CREDENTIALS: { id: Credential; group: AccessVia; label: string }[] = [
${CREDENTIALS.map((c) => `  { id: ${json(c.id)}, group: ${json(c.group)}, label: ${json(c.label)} },`).join('\n')}
];

export const CREDENTIAL_GROUPS: { id: AccessVia; label: string }[] = [
${CREDENTIAL_GROUPS.map((g) => `  { id: ${json(g.id)}, label: ${json(g.label)} },`).join('\n')}
];

/** One way through the door. \`credential\` is null when entry turns on today's ticket. */
export interface AccessRoute {
  via: AccessVia;
  credential: Credential | null;
  label: string;
  note: string;
}

export interface Access {
  summary: string;
  routes: AccessRoute[];
  guests: string;
  arrival: string;
  /** How to buy in, or null when the lounge does not sell entry. */
  dayPass: string | null;
  /** Why not, when \`dayPass\` is null — or a caveat when it is not. */
  dayPassNote: string | null;
}

/** Parsed out of \`location\`; every field is null when the string does not say. */
export interface Wayfinding {
  zone: string;
  detail: string;
  terminal: string | null;
  concourse: string | null;
  gate: string | null;
  level: string | null;
  security: "airside" | "landside" | null;
  /** Airport, plus terminal when named — what a maps app can actually find. */
  mapsQuery: string;
}

/**
 * A real photograph of this lounge, under a license that permits
 * redistribution. \`scope: "airport"\` means the operator and airport are right
 * but the room may be a sibling location.
 */
export interface LoungePhoto {
  scope: "exact" | "airport";
  kind: "interior" | "entrance";
  credit: string;
  license: string;
  licenseUrl: string;
  source: string;
}

export interface Lounge {
  id: string;
  name: string;
  airportCode: string;
  airportCity: string;
  airportName: string;
  location: string;
  description: string;
  rating: number;
  closed: boolean;
  access: Access;
  amenities: Amenity[];
  wayfinding: Wayfinding;
  imageUrl: string;
  /** null when the image is brand art rather than a photo of this lounge. */
  photo: LoungePhoto | null;
}

export const lounges: Lounge[] = [
${body}
];
`;

  writeFileSync(OUT, file);
  console.log(
    `Wrote ${lounges.length} lounges across ${airportCount} airports ` +
      `(${realPhotos} with real photos) to ${OUT}`
  );
}

main();

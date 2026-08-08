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
  AMENITY_CATALOG,
  BRANDS,
  BRAND_AMENITIES,
  BRAND_IMAGES,
  LOUNGES,
  LOUNGE_PHOTOS,
} from './lounge-sources.mjs';

const AMENITY_ORDER = new Map(AMENITY_CATALOG.map((a, i) => [a.id, i]));

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'lounges.ts');

/**
 * Which image file backs a lounge. Real photo if we have one for this exact
 * lounge, else the brand's generic art. Hero variants are produced by
 * scripts/optimize-images.mjs; the matching `-card.webp` is derived at render
 * time by src/lib/images.ts.
 */
function imageBase(id, brandKey) {
  const real = LOUNGE_PHOTOS[id];
  if (real) return real;

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

    lounges.push({
      id,
      name,
      airportCode: code,
      airportCity: city,
      location,
      description,
      rating,
      accessInstructions: brand.access,
      amenities,
      // A real photograph of this exact lounge when we have one, otherwise
      // the brand's generic art.
      imageUrl: `/images/lounges/${imageBase(id, brandKey)}.webp`,
      hasRealPhoto: Boolean(LOUNGE_PHOTOS[id]),
    });
  }

  // A typo in LOUNGE_PHOTOS would silently fall back to brand art, so verify
  // every key matched a real lounge and every file actually exists.
  const ids = new Set(lounges.map((l) => l.id));
  for (const key of Object.keys(LOUNGE_PHOTOS)) {
    if (!ids.has(key)) throw new Error(`LOUNGE_PHOTOS key does not match any lounge id: "${key}"`);
  }
  for (const lounge of lounges) {
    const file = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', lounge.imageUrl);
    if (!existsSync(file)) {
      throw new Error(`Missing image ${lounge.imageUrl} for ${lounge.id} — run scripts/optimize-images.mjs`);
    }
  }

  lounges.sort((a, b) => a.airportCode.localeCompare(b.airportCode) || a.name.localeCompare(b.name));

  const airportCount = new Set(lounges.map((l) => l.airportCode)).size;

  const body = lounges
    .map((l) => {
      const field = (k) => `    ${k}: ${JSON.stringify(l[k])},`;
      return [
        '  {',
        field('id'),
        field('name'),
        field('airportCode'),
        field('airportCity'),
        field('location'),
        field('description'),
        `    rating: ${l.rating},`,
        field('accessInstructions'),
        `    amenities: ${JSON.stringify(l.amenities)},`,
        field('imageUrl'),
        `    hasRealPhoto: ${l.hasRealPhoto},`,
        '  },',
      ].join('\n');
    })
    .join('\n');

  const file = `// AUTO-GENERATED — do not edit by hand.
// Run \`node scripts/generate-lounges.mjs\` after editing scripts/lounge-sources.mjs.
//
// ${lounges.length} lounges across ${airportCount} US airports.
//
// Note on \`rating\`: these are editorial tier estimates derived from the lounge
// brand (flagship international lounges rank above standard airline clubs, and
// so on). They are not aggregated user reviews.

export type Amenity =
${AMENITY_CATALOG.map((a) => `  | ${JSON.stringify(a.id)}`).join('\n')};

/** Display order and labels for every amenity, straight from the catalog. */
export const AMENITY_CATALOG: { id: Amenity; label: string }[] = [
${AMENITY_CATALOG.map((a) => `  { id: ${JSON.stringify(a.id)}, label: ${JSON.stringify(a.label)} },`).join('\n')}
];

export interface Lounge {
  id: string;
  name: string;
  airportCode: string;
  airportCity: string;
  location: string;
  description: string;
  rating: number;
  accessInstructions: string;
  amenities: Amenity[];
  imageUrl: string;
  /** True when imageUrl is a photograph of this exact lounge, not brand art. */
  hasRealPhoto: boolean;
}

export const lounges: Lounge[] = [
${body}
];
`;

  writeFileSync(OUT, file);
  console.log(`Wrote ${lounges.length} lounges across ${airportCount} airports to ${OUT}`);
}

main();

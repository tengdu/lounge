// Regenerates src/data/lounges.ts from scripts/lounge-sources.mjs.
//
//   node scripts/generate-lounges.mjs
//
// Everything about an entry is derived deterministically from the source
// tuple, so re-running produces byte-identical output.

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { AIRPORTS, BRANDS, LOUNGES } from './lounge-sources.mjs';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'lounges.ts');

const IMAGES = [
  'lounge_bright.jpg',
  'lounge_classic.jpg',
  'lounge_cozy.jpg',
  'lounge_express.jpg',
  'lounge_family.jpg',
  'lounge_firstclass.jpg',
  'lounge_midwest.jpg',
  'lounge_minimalist.jpg',
  'lounge_modern.jpg',
  'lounge_premium.jpg',
  'lounge_terrace.jpg',
  'lounge_tropical.jpg',
  'lounge_view.jpg',
  'lounge_vintage.jpg',
  'lounge_zen.jpg',
];

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

    lounges.push({
      id,
      name,
      airportCode: code,
      airportCity: city,
      location,
      description,
      rating,
      accessInstructions: brand.access,
      imageUrl: `/images/lounges/${IMAGES[hash(id) % IMAGES.length]}`,
    });
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
        field('imageUrl'),
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

export interface Lounge {
  id: string;
  name: string;
  airportCode: string;
  airportCity: string;
  location: string;
  description: string;
  rating: number;
  accessInstructions: string;
  imageUrl: string;
}

export const lounges: Lounge[] = [
${body}
];
`;

  writeFileSync(OUT, file);
  console.log(`Wrote ${lounges.length} lounges across ${airportCount} airports to ${OUT}`);
}

main();

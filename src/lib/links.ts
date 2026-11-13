import type { Lounge } from "@/data/lounges";

/** Where this site lives, for links that have to come back from GitHub. */
export const REPO_URL = "https://github.com/tengdu/lounge";

/** A point OSM has for the lounge itself, when we have one. */
export interface MapPoint {
  lat: number;
  lon: number;
}

/**
 * Maps deep links. Apple's scheme opens the native app on Apple devices and
 * falls back to a web map elsewhere; Google's documented URL API does the same
 * on Android.
 *
 * With a coordinate we drop the pin on the lounge itself, and both apps show
 * their own indoor floor plan around it at that zoom. Without one we can only
 * name the terminal — no maps provider resolves "Concourse B, near Gate B18"
 * from text.
 */
export function appleMapsUrl(query: string, point?: MapPoint): string {
  if (point) {
    return `https://maps.apple.com/?ll=${point.lat},${point.lon}&q=${encodeURIComponent(query)}&z=19`;
  }
  return `https://maps.apple.com/?q=${encodeURIComponent(query)}`;
}

export function googleMapsUrl(query: string, point?: MapPoint): string {
  if (point) {
    return `https://www.google.com/maps/search/?api=1&query=${point.lat}%2C${point.lon}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/**
 * Airports that publish their own wayfinding map. None of them can be embedded
 * — they sit behind bot challenges or refuse framing outright — so they are
 * offered as a link rather than a silently blank panel.
 */
const OFFICIAL_AIRPORT_MAPS: Record<string, string> = {
  ATL: "https://www.atl.com/maps/",
  DEN: "https://www.flydenver.com/maps/",
  DFW: "https://www.dfwairport.com/maps/",
  JFK: "https://www.jfkairport.com/at-airport/terminal-maps",
  LAX: "https://www.flylax.com/terminals",
  MSP: "https://www.mspairport.com/airport/maps",
  ORD: "https://www.flychicago.com/ohare/maps/",
  SEA: "https://www.portseattle.org/sea-tac/maps-directions",
  SFO: "https://www.flysfo.com/maps",
};

export function officialAirportMapUrl(code: string): string | undefined {
  return OFFICIAL_AIRPORT_MAPS[code];
}

/** The lounge on openstreetmap.org, where the plan's data came from. */
export function osmUrl(osmRef: string): string {
  return `https://www.openstreetmap.org/${osmRef}`;
}

/**
 * A pre-filled GitHub issue for contributing a photo.
 *
 * There is no server here to receive an upload, and putting one in front of an
 * anonymous image form invites everything that comes with that. GitHub already
 * has the upload widget, an account behind every submission, and a review step
 * — the issue form just arrives with the lounge already identified so the
 * contributor cannot mislabel it.
 */
export function photoContributionUrl(lounge: Lounge): string {
  const params = new URLSearchParams({
    template: "lounge-photo.yml",
    title: `Photo: ${lounge.name} — ${lounge.airportCode}`,
    labels: "photo-submission",
    lounge_id: lounge.id,
    lounge_name: `${lounge.name} — ${lounge.airportCode} (${lounge.location})`,
  });
  return `${REPO_URL}/issues/new?${params.toString()}`;
}

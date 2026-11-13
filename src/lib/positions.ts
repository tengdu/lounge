import { indoorMaps } from "@/data/indoor-maps";
import { loungePositions } from "@/data/lounge-positions";

/** Where to put a lounge's pin, and how much to trust it. */
export interface LoungePosition {
  lat: number;
  lon: number;
  /** Building level as tagged in OSM, when the lounge itself is mapped. */
  level: string | null;
  /** Nearest gate references, closest first; for a gate pin, that gate. */
  gates: string[];
  /** True when the pin is beside the lounge — on its gate or a landmark — not on it. */
  approximate: boolean;
  /** For a landmark pin, what the pin is on ("Earl of Sandwich"). */
  landmark: string | null;
}

/**
 * Best position known for a lounge: its own mapped room or point where there
 * is one, otherwise the gate or landmark it is described by (see
 * scripts/build-lounge-positions.mjs). Undefined means nothing is known and
 * there is nothing to put on a map.
 */
export function positionFor(loungeId: string): LoungePosition | undefined {
  const exact = indoorMaps[loungeId];
  if (exact) {
    return { lat: exact.lat, lon: exact.lon, level: exact.level, gates: exact.gates, approximate: false, landmark: null };
  }
  const placed = loungePositions[loungeId];
  if (placed) {
    return {
      lat: placed.lat,
      lon: placed.lon,
      level: placed.level,
      gates: placed.gates,
      approximate: placed.pin !== "lounge",
      landmark: placed.landmark ?? null,
    };
  }
  return undefined;
}

/** Whether a lounge can be shown on the map at all. */
export function hasMap(loungeId: string): boolean {
  return loungeId in indoorMaps || loungeId in loungePositions;
}

import Image from "next/image";
import type { IndoorMap } from "@/data/indoor-maps";
import { withBasePath } from "@/lib/images";
import { osmUrl } from "@/lib/links";
import MapSwitcher from "./MapSwitcher";

/**
 * An actual floor plan of the concourse, with the lounge highlighted and the
 * surrounding gates labelled — built at deploy time from OpenStreetMap indoor
 * data by scripts/fetch-indoor-maps.mjs.
 *
 * Airports are navigated by gate number, so "between B12 and B14, on level 2"
 * is the instruction that works; a pin on a road map of the airport is not.
 * This stops short of turn-by-turn routing, which would need a walkable indoor
 * graph and your live position — neither of which a static site has.
 */
export default function FloorPlan({
  map,
  loungeId,
  loungeName,
  airportName,
}: {
  map: IndoorMap;
  loungeId: string;
  loungeName: string;
  airportName: string;
}) {
  const alt = `Floor plan of the concourse around the ${loungeName}, with the lounge marked and nearby gates labelled`;

  // Where a full airport payload has been built, offer the pan-and-zoom map
  // alongside the third-party indoor maps instead of the static crop.
  if (map.interactive) {
    return (
      <MapSwitcher
        map={map}
        loungeId={loungeId}
        loungeName={loungeName}
        airportName={airportName}
        staticPlanAlt={alt}
      />
    );
  }

  const gates = map.gates.slice(0, 3);

  const facts = [
    map.level !== null && `Level ${map.level}`,
    gates.length >= 2
      ? `Between gates ${gates[0]} and ${gates[1]}`
      : gates.length === 1 && `Nearest gate ${gates[0]}`,
  ].filter((f): f is string => Boolean(f));

  return (
    <figure className="overflow-hidden rounded-[14px] bg-surface ring-1 ring-hairline">
      {/* Matches ASPECT_H in scripts/fetch-indoor-maps.mjs — every plan is
          emitted at this ratio so none of them get cropped here. */}
      <div className="relative aspect-[1/0.3] w-full bg-surface-sunken">
        <Image
          src={withBasePath(`/maps/${loungeId}.svg`)}
          alt={`Floor plan of the concourse around the ${loungeName}, with the lounge marked and nearby gates labelled`}
          fill
          unoptimized
          sizes="(max-width: 1024px) 100vw, 640px"
          className="object-cover"
        />
      </div>

      <figcaption className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-hairline px-5 py-3.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {facts.map((fact, i) => (
            <span key={fact} className="flex items-center gap-2">
              {i > 0 && (
                <span aria-hidden="true" className="text-ink-tertiary">
                  ·
                </span>
              )}
              <span className="text-[13.5px] font-medium text-ink">{fact}</span>
            </span>
          ))}
        </div>

        <a
          href={osmUrl(map.osm)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[12px] text-ink-tertiary underline decoration-hairline-strong underline-offset-2 transition-colors hover:text-ink-secondary"
        >
          Plan from OpenStreetMap
        </a>
      </figcaption>
    </figure>
  );
}

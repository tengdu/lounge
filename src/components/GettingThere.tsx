import { ArrowUpRight, ExternalLink, MapPin } from "lucide-react";
import type { Wayfinding } from "@/data/lounges";
import type { LoungePosition } from "@/lib/positions";
import { appleMapsUrl, googleMapsUrl, officialAirportMapUrl } from "@/lib/links";
import LoungeMapLazy from "./LoungeMapLazy";

const SECURITY_LABEL = {
  airside: "After security",
  landside: "Before security",
} as const;

export default function GettingThere({
  wayfinding,
  airportName,
  airportCode,
  location,
  position,
  loungeId,
  loungeName,
}: {
  wayfinding: Wayfinding;
  airportName: string;
  airportCode: string;
  location: string;
  position: LoungePosition | undefined;
  loungeId: string;
  loungeName: string;
}) {
  // Only the parts the source location actually named. A missing concourse is
  // a gap in the data, not a reason to invent one.
  const chips = [
    wayfinding.terminal,
    wayfinding.concourse && `Concourse ${wayfinding.concourse}`,
    wayfinding.level && sentenceCase(wayfinding.level),
    wayfinding.gate && `Gate ${wayfinding.gate}`,
    wayfinding.security && SECURITY_LABEL[wayfinding.security],
  ].filter((chip): chip is string => Boolean(chip));

  // With a mapped position we can pin the lounge itself; both maps apps show
  // their own indoor plan at that zoom. Otherwise all we can name is a terminal.
  const officialMap = officialAirportMapUrl(airportCode);
  const point = position ? { lat: position.lat, lon: position.lon } : undefined;
  const mapsLabel = point
    ? `${loungeName}, ${airportName}`
    : wayfinding.mapsQuery;

  return (
    <section>
      <h2 className="text-title mb-5 text-[22px] text-ink">Getting there</h2>

      {position && (
        <div className="mb-4">
          <LoungeMapLazy
            variant="embed"
            loungeId={loungeId}
            loungeName={loungeName}
            airportCode={airportCode}
            location={location}
            lat={position.lat}
            lon={position.lon}
            gate={wayfinding.gate ?? position.gates[0] ?? null}
            level={position.level}
            approximate={position.approximate}
            landmark={position.landmark}
            appleMapsHref={appleMapsUrl(mapsLabel, point)}
            googleMapsHref={googleMapsUrl(mapsLabel, point)}
          />
        </div>
      )}

      <div className="overflow-hidden rounded-[14px] bg-surface ring-1 ring-hairline">
        <div className="px-5 py-5">
          <div className="flex items-start gap-2.5">
            <MapPin
              size={17}
              strokeWidth={1.7}
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-accent"
            />
            <div className="min-w-0">
              <p className="text-[15px] leading-snug text-ink">{location}</p>
              <p className="mt-1 text-[13px] text-ink-tertiary">{airportName}</p>
            </div>
          </div>

          {chips.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {chips.map((chip) => (
                <li
                  key={chip}
                  className="rounded-full bg-surface-sunken px-2.5 py-1 text-[12.5px] font-medium text-ink-secondary"
                >
                  {chip}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t border-hairline px-5 py-4 sm:flex-row">
          <MapLink href={appleMapsUrl(mapsLabel, point)} label="Apple Maps" />
          <MapLink href={googleMapsUrl(mapsLabel, point)} label="Google Maps" />
        </div>

        {/* Airports publish their own wayfinding maps, which none of them let
            us embed — a link is the most we can honestly offer. */}
        {officialMap && (
          <div className="border-t border-hairline px-5 py-3">
            <a
              href={officialMap}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink-secondary transition-colors hover:text-ink"
            >
              <ExternalLink size={12.5} strokeWidth={2} aria-hidden="true" />
              {airportCode}&rsquo;s own wayfinding map
            </a>
          </div>
        )}
      </div>

      <p className="mt-3 text-[12.5px] leading-relaxed text-ink-tertiary">
        {point ? (
          position?.approximate ? (
            `The lounge’s own spot is not mapped yet, so the pin marks ${
              position.landmark ? `${position.landmark}, which it is next to` : "its gate — the lounge is close by"
            }. The route follows walkways and airport trains mapped in OpenStreetMap; it does not know where the security checkpoints are.`
          ) : (
            "The route follows walkways and airport trains mapped in OpenStreetMap; it does not know where the security checkpoints are. Apple and Google Maps open on the lounge itself; for the last stretch, follow the gate numbers on the airport’s signage."
          )
        ) : (
          <>
            {/* Say why the plan is absent. Silently omitting it reads as a
                broken page rather than a gap in the underlying map data. */}
            No indoor plan for this lounge yet — nobody has mapped this
            terminal&rsquo;s interior in OpenStreetMap. Maps will route you to{" "}
            {wayfinding.terminal && /terminal/i.test(wayfinding.terminal)
              ? "the terminal"
              : "the airport"}
            ; follow the airport&rsquo;s own signage from there.
          </>
        )}
      </p>
    </section>
  );
}

function MapLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex flex-1 items-center justify-center gap-1.5 rounded-[10px] bg-surface-sunken px-4 py-2.5 text-[14px] font-medium text-ink transition-colors hover:bg-hairline"
    >
      Open in {label}
      <ArrowUpRight
        size={14}
        strokeWidth={2}
        aria-hidden="true"
        className="text-ink-tertiary transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
      />
    </a>
  );
}

function sentenceCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

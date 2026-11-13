"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Map as MapIcon } from "lucide-react";
import type { IndoorMap } from "@/data/indoor-maps";
import AirportMap from "./AirportMap";

type Source = "lounge" | "google" | "osm";

const TABS: { id: Source; label: string; thirdParty: boolean }[] = [
  { id: "lounge", label: "Lounge map", thirdParty: false },
  { id: "google", label: "Google", thirdParty: true },
  { id: "osm", label: "OpenLevelUp", thirdParty: true },
];

/**
 * Three views of the same place, because no single one is best at everything.
 *
 * - "Lounge map" is ours, built from OSM at deploy time. It is the only one
 *   that knows which room is the lounge, and it loads nothing third-party.
 * - Google carries its own indoor floor plans, which at a big US hub are far
 *   more complete than OSM's — shops, security, the lot — but it cannot mark
 *   the lounge.
 * - OpenLevelUp renders OSM's indoor tagging properly, with a level picker.
 *
 * Third-party frames are only mounted once their tab is chosen, so opening a
 * lounge page makes no request to Google or anyone else.
 */
export default function MapSwitcher({
  map,
  loungeId,
  loungeName,
  airportName,
  staticPlanAlt,
}: {
  map: IndoorMap;
  loungeId: string;
  loungeName: string;
  airportName: string;
  staticPlanAlt: string;
}) {
  const [source, setSource] = useState<Source>("lounge");

  const { lat, lon } = map;
  const googleSrc = `https://maps.google.com/maps?q=${lat},${lon}&z=19&hl=en&output=embed`;
  const googleOut = `https://www.google.com/maps/@${lat},${lon},19z`;
  const levelParam = map.level ? `?l=${encodeURIComponent(map.level)}` : "";
  const osmSrc = `https://openlevelup.net/${levelParam}#20/${lat}/${lon}`;

  return (
    <div>
      <div
        role="tablist"
        aria-label="Map source"
        className="mb-2.5 inline-flex items-center gap-1 rounded-full bg-surface-sunken p-1 ring-1 ring-hairline"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={source === tab.id}
            onClick={() => setSource(tab.id)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors ${
              source === tab.id
                ? "bg-surface text-ink shadow-sm ring-1 ring-hairline"
                : "text-ink-secondary hover:text-ink"
            }`}
          >
            {tab.id === "lounge" && <MapIcon size={13} strokeWidth={2} aria-hidden="true" />}
            {tab.label}
          </button>
        ))}
      </div>

      {source === "lounge" && (
        <AirportMap loungeId={loungeId} staticPlanAlt={staticPlanAlt} />
      )}

      {source === "google" && (
        <EmbeddedMap
          key={googleSrc}
          title={`Google Maps showing ${loungeName} at ${airportName}`}
          src={googleSrc}
          provider="Google Maps"
          href={googleOut}
          note="Google's own indoor plans, usually the most complete at a big hub — use the floor picker on the right. It cannot show which room is the lounge, so cross-check the gate numbers."
        />
      )}

      {source === "osm" && (
        <EmbeddedMap
          key={osmSrc}
          title={`OpenLevelUp indoor map near ${loungeName}`}
          src={osmSrc}
          provider="OpenLevelUp"
          href={osmSrc}
          note="OpenStreetMap's indoor tagging rendered level by level. As complete as whoever mapped that terminal made it — at some airports that is very complete, at others nearly empty."
        />
      )}
    </div>
  );
}

function EmbeddedMap({
  title,
  src,
  provider,
  href,
  note,
}: {
  title: string;
  src: string;
  provider: string;
  href: string;
  note: string;
}) {
  // A frame that a content blocker has neutered still fires `load` and still
  // reports a 200, so there is no way to detect it from here. Rather than
  // leave a grey rectangle unexplained, say what a blank panel means.
  // Keyed on `src` by the caller, so switching provider remounts this and the
  // timer starts over — no need to reset state on the way in.
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <figure className="overflow-hidden rounded-[14px] bg-surface ring-1 ring-hairline">
      <div className="relative w-full bg-surface-sunken" style={{ aspectRatio: "1 / 0.62" }}>
        <iframe
          key={src}
          title={title}
          src={src}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0 h-full w-full border-0"
        />
        {slow && (
          <p className="pointer-events-none absolute inset-x-3 bottom-3 rounded-[10px] bg-white/90 px-3 py-2 text-[11.5px] leading-relaxed text-ink-tertiary ring-1 ring-hairline">
            Blank? Either {provider} is blocked in this browser, or it has nothing mapped inside
            this terminal. The link below opens it directly.
          </p>
        )}
      </div>

      <figcaption className="border-t border-hairline px-5 py-3.5">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <p className="text-[13.5px] font-medium text-ink">{provider}</p>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-1 text-[12px] text-ink-tertiary underline decoration-hairline-strong underline-offset-2 transition-colors hover:text-ink-secondary"
          >
            Open in {provider}
            <ArrowUpRight
              size={12}
              strokeWidth={2}
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </a>
        </div>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-tertiary">
          {note} Loaded from {provider}, so this panel talks to them rather than to us.
        </p>
      </figcaption>
    </figure>
  );
}


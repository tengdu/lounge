"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import * as maplibregl from "maplibre-gl";
import type { GeoJSONSource } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { withBasePath } from "@/lib/images";
import { describeRoute, findRoute, parseGraph, type RouteStep, type WalkGraph, type WalkRoute } from "@/lib/walk-route";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ArrowUpRight,
  Crosshair,
  Footprints,
  Locate,
  Maximize2,
  Minus,
  MoveVertical,
  Plus,
  TrainFront,
} from "lucide-react";

/** Free vector tiles built from OpenStreetMap; no key, no per-user tracking. */
const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

const ACCENT = "#0071e3";
/** Train legs: a second colour, so riding never reads as more walking. */
const TRAIN = "#5e5ce6";

/** Drawn on a map marker, which MapLibre owns and React does not render into. */
const TRAIN_GLYPH =
  '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.4" ' +
  'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 10h14"/><path d="M9 14h.01M15 14h.01"/>' +
  '<path d="M8 17l-2 4M16 17l2 4"/></svg>';

/** Past this, the traveller is not at the airport and a line to the lounge
 *  would just be a stripe across a continent. */
const NEAR_M = 8000;

const COMPASS = ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"];

export interface LoungeMapProps {
  /** "full" fills its parent with a side panel; "embed" is a card for the detail page. */
  variant: "full" | "embed";
  loungeId: string;
  loungeName: string;
  airportCode: string;
  location: string;
  lat: number;
  lon: number;
  /** Gate the lounge is signposted by, highlighted among the gate labels. */
  gate: string | null;
  level: string | null;
  /** The pin marks the lounge's gate rather than the lounge itself. */
  approximate?: boolean;
  /** For a pin placed beside a landmark rather than a gate, what it is on. */
  landmark?: string | null;
  appleMapsHref: string;
  googleMapsHref: string;
}

interface Fix {
  lat: number;
  lon: number;
  accuracy: number;
}

type GeoState = "idle" | "locating" | "tracking" | "denied" | "error" | "unsupported";

export default function LoungeMap(props: LoungeMapProps) {
  const { variant, loungeId, loungeName, airportCode, location, lat, lon, gate, level, approximate, landmark } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const youMarkerRef = useRef<maplibregl.Marker | null>(null);
  const changeMarkersRef = useRef<maplibregl.Marker[]>([]);
  /** 0 nothing framed yet, 1 the traveller and the lounge, 2 the whole route. */
  const framedRef = useRef(0);
  /** Set once the traveller moves the map themselves; framing then stops. */
  const movedRef = useRef(false);
  const watchRef = useRef<number | null>(null);

  // `?from=lat,lon` stands in for a GPS fix, so the "you are here" side can be
  // worked on from a desk rather than from the concourse.
  const [simulated] = useState<Fix | null>(readSimulatedFix);
  const [fix, setFix] = useState<Fix | null>(simulated);
  const [geo, setGeo] = useState<GeoState>(simulated ? "tracking" : "idle");
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [graph, setGraph] = useState<WalkGraph | null>(null);

  // The airport's walkway network, when one has been built. Without it the
  // map still works; it just cannot do better than a straight line.
  useEffect(() => {
    let live = true;
    fetch(withBasePath(`/routes/${airportCode.toLowerCase()}.json`))
      .then((r) => (r.ok ? r.json() : null))
      .then((raw) => live && raw && setGraph(parseGraph(raw)))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [airportCode]);

  // ------------------------------------------------------------------- map

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container,
        style: STYLE_URL,
        center: [lon, lat],
        zoom: 16.4,
        minZoom: 3,
        maxZoom: 19.5,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
        // Embedded in a long page, one-finger drags and plain scrolls must
        // keep scrolling the page rather than getting trapped in the map.
        cooperativeGestures: variant === "embed",
        attributionControl: { compact: true },
      });
    } catch {
      // No WebGL (old device, locked-down browser): fall back to the links.
      queueMicrotask(() => setFailed(true));
      return;
    }
    mapRef.current = map;
    map.touchZoomRotate.disableRotation();
    map.keyboard.disableRotation();
    // Only gestures carry an originating event; our own camera moves do not.
    map.on("movestart", (event) => {
      if ((event as { originalEvent?: unknown }).originalEvent) movedRef.current = true;
    });

    const pin = document.createElement("div");
    pin.className = "lounge-pin";
    const label = document.createElement("span");
    label.className = "lounge-pin__label";
    label.textContent = loungeName;
    const tip = document.createElement("span");
    tip.className = "lounge-pin__tip";
    pin.append(label, tip);
    new maplibregl.Marker({ element: pin, anchor: "bottom" }).setLngLat([lon, lat]).addTo(map);

    map.on("load", () => {
      // Extruded buildings read as dark slabs from straight overhead and bury
      // the gate numbers; the flat footprint layer underneath is enough.
      if (map.getLayer("building-3d")) map.removeLayer("building-3d");

      // The stock style is tuned for streets, where a terminal is one beige
      // block among many. Here the terminal is the subject: lift it to white
      // with a firm edge so the concourses read as figure against the apron.
      if (map.getLayer("building")) {
        // The flat layer normally hands over to the extruded one at z14.
        map.setLayerZoomRange("building", 13, 24);
        map.setPaintProperty("building", "fill-color", "#ffffff");
        map.setPaintProperty("building", "fill-outline-color", "#a3abb8");
      }

      // Indoor corridors and jet bridges arrive as chunky white dashes, which
      // vanish on a white building. Draw them as quiet solid walkways instead.
      for (const id of ["road_path_pedestrian", "tunnel_path_pedestrian", "bridge_path_pedestrian"]) {
        if (!map.getLayer(id)) continue;
        map.setPaintProperty(id, "line-color", "#cdd4df");
        map.setPaintProperty(id, "line-dasharray", null);
        map.setPaintProperty(id, "line-width", ["interpolate", ["exponential", 1.2], ["zoom"], 14, 0.6, 20, 7]);
      }

      // Jet bridges carry their gate number as a road ref, so the style stamps
      // a highway shield on each one — a second, boxed copy of every gate.
      if (map.getLayer("highway-shield-non-us")) {
        const existing = map.getFilter("highway-shield-non-us");
        map.setFilter(
          "highway-shield-non-us",
          existing
            ? ["all", existing as maplibregl.ExpressionSpecification, ["!=", ["get", "class"], "path"]]
            : ["!=", ["get", "class"], "path"]
        );
      }

      map.addSource("you-accuracy", { type: "geojson", data: EMPTY });
      map.addSource("you-line", { type: "geojson", data: EMPTY });

      map.addLayer({
        id: "you-accuracy",
        type: "fill",
        source: "you-accuracy",
        paint: { "fill-color": ACCENT, "fill-opacity": 0.12 },
      });
      map.addLayer({
        id: "you-line-casing",
        type: "line",
        source: "you-line",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#ffffff", "line-width": 7.5, "line-opacity": 0.9 },
      });
      map.addLayer({
        id: "you-line",
        type: "line",
        source: "you-line",
        layout: { "line-cap": "round" },
        // Dots mean "as the crow flies": the whole line when there is no
        // route, or just the stretches of one that nobody has mapped.
        filter: ["in", ["get", "kind"], ["literal", ["straight", "gap"]]],
        paint: { "line-color": ACCENT, "line-width": 3, "line-dasharray": [0.1, 2] },
      });
      map.addLayer({
        id: "you-route",
        type: "line",
        source: "you-line",
        layout: { "line-cap": "round", "line-join": "round" },
        filter: ["==", ["get", "kind"], "route"],
        // Underground stretches are drawn fainter: they pass beneath whatever
        // the map shows at that spot, not through it.
        paint: { "line-color": ACCENT, "line-width": 4.5, "line-opacity": ["case", ["get", "underground"], 0.45, 1] },
      });
      map.addLayer({
        id: "you-train",
        type: "line",
        source: "you-line",
        layout: { "line-join": "round" },
        filter: ["==", ["get", "kind"], "train"],
        paint: { "line-color": TRAIN, "line-width": 4.5, "line-dasharray": [2, 1] },
      });

      // Gate numbers are how an airport is actually navigated, and the base
      // style does not draw them. They are in the tiles, so add them here.
      const isTarget = ["==", ["get", "ref"], gate ?? ""] as maplibregl.ExpressionSpecification;
      map.addLayer({
        id: "gates",
        type: "symbol",
        source: "openmaptiles",
        "source-layer": "aeroway",
        minzoom: 14.5,
        filter: ["all", ["==", ["geometry-type"], "Point"], ["==", ["get", "class"], "gate"]],
        layout: {
          "text-field": ["get", "ref"],
          "text-font": ["Noto Sans Bold"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 15, ["case", isTarget, 12, 9.5], 18, ["case", isTarget, 16, 13]],
          "symbol-sort-key": ["case", isTarget, 0, 1],
          "text-padding": 3,
        },
        paint: {
          "text-color": ["case", isTarget, ACCENT, "#3a3a3c"],
          "text-halo-color": "#ffffff",
          "text-halo-width": 1.8,
        },
      });

      setReady(true);
    });

    // The container changes size with the layout, not just with the window.
    const observer = new ResizeObserver(() => map.resize());
    observer.observe(container);

    return () => {
      observer.disconnect();
      youMarkerRef.current = null;
      changeMarkersRef.current = [];
      framedRef.current = 0;
      movedRef.current = false;
      mapRef.current = null;
      setReady(false);
      map.remove();
    };
  }, [lat, lon, loungeName, gate, variant]);

  // ----------------------------------------------------------- geolocation

  const startWatching = useCallback(() => {
    if (watchRef.current !== null) return;
    if (!("geolocation" in navigator)) {
      setGeo("unsupported");
      return;
    }
    setGeo((g) => (g === "tracking" ? g : "locating"));
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setGeo("tracking");
        setFix({ lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGeo("denied");
          if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
          watchRef.current = null;
        } else {
          // Timeouts are routine indoors; keep the last fix if there is one.
          setGeo((g) => (g === "tracking" ? g : "error"));
        }
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 10_000 }
    );
  }, []);

  useEffect(() => {
    // Someone who already allowed location should not have to ask twice;
    // everyone else gets the prompt only when they tap the button.
    if (!simulated && navigator.permissions) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((status) => status.state === "granted" && startWatching())
        .catch(() => {});
    }
    return () => {
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    };
  }, [simulated, startWatching]);

  const distance = fix ? haversine(fix.lat, fix.lon, lat, lon) : null;
  const near = distance !== null && distance < NEAR_M;

  // A real path along mapped corridors where the network reaches both ends;
  // null means "draw the straight line and say that is what it is".
  const route = useMemo(
    () => (graph && fix && near ? findRoute(graph, fix, { lat, lon }) : null),
    [graph, fix, near, lat, lon]
  );
  const steps = useMemo(() => (route ? describeRoute(route) : []), [route]);

  const frameBoth = useCallback(() => {
    const map = mapRef.current;
    if (!map || !fix) return;
    const bounds = new maplibregl.LngLatBounds([lon, lat], [lon, lat]).extend([fix.lon, fix.lat]);
    // A route can swing well outside the box its two ends make — out to a
    // train station and back — and should not run off the edge of the view.
    for (const point of route?.coordinates ?? []) bounds.extend(point);
    // Extra room on the right keeps the pair clear of the control column.
    const pad = variant === "full" ? 90 : 56;
    map.fitBounds(bounds, {
      padding: { top: pad + 20, bottom: pad, left: pad, right: pad + 50 },
      maxZoom: 18,
      duration: 900,
    });
  }, [fix, lat, lon, variant, route]);

  // Draw the traveller: dot, accuracy disc, and a line to the lounge.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !fix) return;

    if (!youMarkerRef.current) {
      const dot = document.createElement("div");
      dot.className = "you-dot";
      dot.title = "Your position";
      youMarkerRef.current = new maplibregl.Marker({ element: dot }).setLngLat([fix.lon, fix.lat]).addTo(map);
    } else {
      youMarkerRef.current.setLngLat([fix.lon, fix.lat]);
    }

    (map.getSource("you-accuracy") as GeoJSONSource).setData(circle(fix.lat, fix.lon, fix.accuracy));
    (map.getSource("you-line") as GeoJSONSource).setData(
      !near
        ? EMPTY
        : route
          ? { type: "FeatureCollection", features: routeFeatures(route) }
          : {
              type: "Feature",
              properties: { kind: "straight" },
              geometry: { type: "LineString", coordinates: [[fix.lon, fix.lat], [lon, lat]] },
            }
    );

    // A badge wherever the route changes floor. Without it, an escalator bank
    // looks like the line doubling back on itself for no reason. And one at
    // each station, so it is plain where the train is boarded and left.
    for (const marker of changeMarkersRef.current) marker.remove();
    changeMarkersRef.current = steps.flatMap((step) => {
      if (step.type === "walk") return [];
      const badge = (at: [number, number], title: string) => {
        const chip = document.createElement("div");
        chip.title = title;
        if (step.type === "train") {
          chip.className = "level-chip level-chip--train";
          chip.innerHTML = TRAIN_GLYPH;
        } else {
          chip.className = "level-chip";
          chip.textContent = step.floors === null ? "↕" : step.floors > 0 ? "↑" : "↓";
        }
        return new maplibregl.Marker({ element: chip }).setLngLat(at).addTo(map);
      };
      return step.type === "train"
        ? [badge(step.board, `Board at ${step.from ?? "the station"}`), badge(step.alight, `Get off at ${step.to ?? "the station"}`)]
        : [badge(step.at, changeText(step))];
    });

    // Frame on the first fix, and once more when a route first arrives — the
    // walkway data loads a moment later, and the route may reach beyond the
    // pair. After that the view is the traveller's to move without it
    // snapping back every few seconds.
    const stage = route ? 2 : 1;
    if (framedRef.current < stage) {
      const first = framedRef.current === 0;
      framedRef.current = stage;
      if (near && (first || !movedRef.current)) frameBoth();
    }
  }, [fix, ready, near, route, steps, lat, lon, frameBoth]);

  // -------------------------------------------------------------- controls

  const onLocate = () => {
    if (!fix) {
      startWatching();
      return;
    }
    if (near) frameBoth();
    else mapRef.current?.flyTo({ center: [fix.lon, fix.lat], zoom: 15, duration: 1200 });
  };

  // The buttons are the traveller choosing a view, just as a drag is.
  const move = (act: (map: maplibregl.Map) => void) => {
    movedRef.current = true;
    if (mapRef.current) act(mapRef.current);
  };
  const toLounge = () => move((map) => map.flyTo({ center: [lon, lat], zoom: 17.2, duration: 900 }));
  const toAirport = () => move((map) => map.flyTo({ center: [lon, lat], zoom: 13.6, duration: 900 }));

  // ---------------------------------------------------------------- status

  let headline: string;
  let detail: string | null = null;

  if (fix && distance !== null) {
    if (near) {
      const compass = COMPASS[Math.round(bearing(fix.lat, fix.lon, lat, lon) / 45) % 8];
      const rides = steps.filter((step) => step.type === "train").length;
      // ~80 m a minute is an unhurried walk with a bag. Without a route,
      // pad the straight line for the corners it cannot see.
      const minutes = Math.max(1, Math.round(route ? route.seconds / 60 : (distance * 1.35) / 80));
      headline =
        distance < 40
          ? "You are right by the lounge"
          : rides > 0
            ? `About ${minutes} min, with a train ride`
            : `About ${minutes} min walk`;
      detail = !route
        ? `${formatDistance(distance)} to the ${compass} of you, in a straight line. No mapped route joins here to the lounge, so follow the airport’s signs.`
        : rides > 0
          ? `${formatDistance(route.walkMetres)} on foot plus ${rides === 1 ? "the airport train" : `${rides} train rides`}, with a few minutes allowed for the wait.`
          : `${formatDistance(route.walkMetres)} along the mapped walkways, heading ${compass}.`;
      if (steps.some((step) => step.type === "walk" && !step.mapped)) {
        detail += " Dotted stretches are not mapped; they are drawn as straight lines.";
      }
      if (fix.accuracy > 40) {
        detail += ` GPS is rough indoors (±${formatDistance(fix.accuracy)})${gate ? ` — follow the signs for gate ${gate}` : ""}.`;
      }
    } else {
      headline = `You are ${formatDistance(distance)} from ${airportCode}`;
      detail = "Your position will appear on the map once you are at the airport.";
    }
  } else if (geo === "locating") {
    headline = "Finding you…";
  } else if (geo === "denied") {
    headline = "Location is blocked for this site";
    detail = "Allow location in your browser’s site settings to see yourself on the map.";
  } else if (geo === "unsupported") {
    headline = "This browser cannot share a location";
  } else if (geo === "error") {
    headline = "Could not get a location fix";
    detail = "That is common deep inside a terminal. Try again nearer a window.";
  } else {
    headline = "See where you are";
    detail = "Share your location to place yourself on the map next to the lounge.";
  }

  const facts = [gate && `Gate ${gate}`, level !== null && `Level ${level}`].filter(
    (f): f is string => Boolean(f)
  );

  const canvas = (
    <div className="relative h-full w-full bg-[#eef0f3]">
      <div ref={containerRef} className="h-full w-full" aria-label={`Map showing the ${loungeName} at ${airportCode}`} />

      {failed && (
        <p className="absolute inset-0 flex items-center justify-center px-8 text-center text-[13.5px] text-ink-tertiary">
          The map could not start in this browser. The links to Apple and Google Maps still work.
        </p>
      )}

      <div className="absolute top-3 right-3 flex flex-col gap-1.5">
        <ControlButton
          label={fix ? "Show me and the lounge" : "Find my position"}
          onClick={onLocate}
          busy={geo === "locating"}
          active={geo === "tracking"}
        >
          <Locate size={16} strokeWidth={2} />
        </ControlButton>
        <ControlButton label="Go to the lounge" onClick={toLounge}>
          <Crosshair size={16} strokeWidth={2} />
        </ControlButton>
        <ControlButton label="Whole airport" onClick={toAirport}>
          <Maximize2 size={15} strokeWidth={2} />
        </ControlButton>
        <ControlButton label="Zoom in" onClick={() => move((map) => map.zoomIn())}>
          <Plus size={16} strokeWidth={2.2} />
        </ControlButton>
        <ControlButton label="Zoom out" onClick={() => move((map) => map.zoomOut())}>
          <Minus size={16} strokeWidth={2.2} />
        </ControlButton>
      </div>
    </div>
  );

  const status = (
    <div aria-live="polite">
      <p className="text-[15px] font-semibold text-ink">{headline}</p>
      {detail && <p className="mt-1 text-[13px] leading-relaxed text-ink-secondary">{detail}</p>}
      {approximate && (landmark || gate) && (
        <p className="mt-1 text-[12.5px] leading-relaxed text-ink-tertiary">
          {landmark
            ? `The pin marks ${landmark}; the lounge is right by it, but its own spot is not mapped yet.`
            : `The pin marks gate ${gate}; the lounge is close by, but its own spot is not mapped yet.`}
        </p>
      )}
      {steps.length > 1 && (
        <ol className="mt-3 space-y-2 border-t border-hairline pt-3">
          {steps.map((step, i) => {
            const Icon =
              step.type === "train"
                ? TrainFront
                : step.type === "walk"
                  ? Footprints
                  : step.floors === null
                    ? MoveVertical
                    : step.floors > 0
                      ? ArrowUp
                      : ArrowDown;
            const tone =
              step.type === "train"
                ? "bg-[#5e5ce6] text-white"
                : step.type === "walk"
                  ? "bg-hairline text-ink-secondary"
                  : "bg-accent text-white";
            return (
              <li key={i} className="flex items-start gap-2.5 text-[13px] leading-snug text-ink">
                <span className={`mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${tone}`}>
                  <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
                </span>
                <span>
                  {stepText(
                    step,
                    i === steps.length - 1 &&
                      (approximate && landmark
                        ? `${landmark}, by the ${loungeName}`
                        : approximate && gate
                          ? `gate ${gate}, by the ${loungeName}`
                          : `the ${loungeName}`)
                  )}
                </span>
              </li>
            );
          })}
        </ol>
      )}
      {!fix && geo !== "locating" && geo !== "denied" && geo !== "unsupported" && (
        <button
          type="button"
          onClick={startWatching}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-accent-hover"
        >
          <Locate size={14} strokeWidth={2.2} aria-hidden="true" />
          Use my location
        </button>
      )}
    </div>
  );

  if (variant === "embed") {
    return (
      <figure className="overflow-hidden rounded-[14px] bg-surface ring-1 ring-hairline">
        <div className="h-[340px] sm:h-[420px]">{canvas}</div>
        <figcaption className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 border-t border-hairline px-5 py-4">
          <div className="min-w-0 flex-1 basis-64">{status}</div>
          <Link
            href={`/map/${loungeId}`}
            className="group inline-flex shrink-0 items-center gap-1 text-[13px] font-medium text-accent"
          >
            Open full map
            <ArrowUpRight
              size={14}
              strokeWidth={2}
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </Link>
        </figcaption>
      </figure>
    );
  }

  return (
    <div className="flex h-full w-full flex-col md:flex-row-reverse">
      <div className="relative min-h-0 flex-1">{canvas}</div>

      <aside className="shrink-0 border-t border-hairline bg-surface px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:w-[360px] md:border-t-0 md:border-r md:px-6 md:pt-5">
        <Link
          href={`/lounge/${loungeId}`}
          className="group mb-4 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-ink-secondary transition-colors hover:text-ink md:mb-8"
        >
          <ArrowLeft size={15} className="transition-transform duration-300 group-hover:-translate-x-0.5" />
          Lounge details
        </Link>

        <p className="text-[12px] font-medium tracking-[0.04em] text-accent uppercase">{airportCode}</p>
        <h1 className="text-title mt-1 text-[24px] text-ink md:text-[28px]">{loungeName}</h1>
        <p className="mt-1.5 text-[14.5px] leading-snug text-ink-secondary">{location}</p>

        {facts.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {facts.map((fact) => (
              <li
                key={fact}
                className="rounded-full bg-surface-sunken px-2.5 py-1 text-[12.5px] font-medium text-ink-secondary"
              >
                {fact}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 rounded-[12px] bg-surface-sunken px-4 py-3.5 md:mt-6">{status}</div>

        <div className="mt-3 flex gap-2 md:mt-6 md:flex-col">
          <OutLink href={props.appleMapsHref} label="Apple Maps" />
          <OutLink href={props.googleMapsHref} label="Google Maps" />
        </div>
      </aside>
    </div>
  );
}

function ControlButton({
  label,
  onClick,
  busy,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  busy?: boolean;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-sm ring-1 ring-hairline backdrop-blur transition-colors hover:text-ink ${
        active ? "text-accent" : "text-ink-secondary"
      } ${busy ? "animate-pulse" : ""}`}
    >
      {children}
    </button>
  );
}

function OutLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex flex-1 items-center justify-center gap-1.5 rounded-[10px] px-3 py-2.5 text-[13.5px] font-medium text-ink ring-1 ring-hairline transition-colors hover:bg-surface-sunken"
    >
      {label}
      <ArrowUpRight
        size={14}
        strokeWidth={2}
        aria-hidden="true"
        className="text-ink-tertiary transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
      />
    </a>
  );
}

// ------------------------------------------------------------------ geometry

function changeText(step: Extract<RouteStep, { type: "change" }>): string {
  const how = { escalator: "Escalator", stairs: "Stairs", elevator: "Elevator" }[step.kind];
  if (step.floors === null) return `${how} to another level`;
  const n = Math.max(1, Math.round(Math.abs(step.floors)));
  return `${how} ${step.floors > 0 ? "up" : "down"} ${n === 1 ? "one level" : `${n} levels`}`;
}

/** One line of the directions. `destination` is set on the last step only. */
function stepText(step: RouteStep, destination: string | false): string {
  if (step.type === "change") return changeText(step);

  if (step.type === "train") {
    // Line names arrive as mapped — "The Plane Train", "North Train Loop".
    const line = step.line?.replace(/^the\s+/i, "");
    const ride = line ? `Take the ${line}` : "Take the train";
    return step.from && step.to ? `${ride} from ${step.from} to ${step.to}` : step.to ? `${ride} to ${step.to}` : ride;
  }

  let text = `Walk ${step.mapped ? "" : "about "}${formatDistance(step.metres)}`;
  if (step.underground) text += " through the underground walkway";
  if (destination) text += ` to ${destination}`;
  if (!step.mapped) text += " — not mapped, so follow the signs";
  return text;
}

/**
 * The route as line features, one per run of like stretches: walked, ridden,
 * or unmapped, and for walking whether it is underground.
 */
function routeFeatures(route: WalkRoute): GeoJSON.Feature[] {
  const style = (i: number) => {
    const leg = route.legs[i];
    const kind = leg.kind === "train" ? "train" : leg.kind === "gap" ? "gap" : "route";
    return { kind, underground: kind === "route" && leg.underground };
  };

  const features: GeoJSON.Feature[] = [];
  let run: [number, number][] = [route.coordinates[0]];
  for (let i = 0; i < route.legs.length; i++) {
    run.push(route.coordinates[i + 1]);
    const here = style(i);
    const next = i + 1 < route.legs.length ? style(i + 1) : null;
    if (!next || next.kind !== here.kind || next.underground !== here.underground) {
      features.push({ type: "Feature", properties: here, geometry: { type: "LineString", coordinates: run } });
      run = [route.coordinates[i + 1]];
    }
  }
  return features;
}

const EMPTY: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

function readSimulatedFix(): Fix | null {
  if (typeof window === "undefined") return null;
  const raw = new URLSearchParams(window.location.search).get("from");
  if (!raw) return null;
  const [lat, lon, accuracy] = raw.split(",").map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lon, accuracy: Number.isFinite(accuracy) ? accuracy : 25 };
}

const toRad = (deg: number) => (deg * Math.PI) / 180;

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const a =
    Math.sin(toRad(lat2 - lat1) / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(toRad(lon2 - lon1) / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(a));
}

/** Initial compass bearing from point 1 to point 2, 0–360 clockwise from north. */
function bearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** A ground circle as a polygon, so the accuracy disc scales with the map. */
function circle(lat: number, lon: number, radiusM: number): GeoJSON.Feature {
  const ring: [number, number][] = [];
  const dLat = radiusM / 111320;
  const dLon = dLat / Math.cos(toRad(lat));
  for (let i = 0; i <= 48; i++) {
    const t = (i / 48) * 2 * Math.PI;
    ring.push([lon + dLon * Math.cos(t), lat + dLat * Math.sin(t)]);
  }
  return { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [ring] } };
}

function formatDistance(metres: number): string {
  const feet = metres * 3.28084;
  if (feet < 1000) return `${Math.max(10, Math.round(feet / 10) * 10)} ft`;
  const miles = metres / 1609.344;
  return miles < 10 ? `${miles.toFixed(1)} mi` : `${Math.round(miles).toLocaleString("en-US")} mi`;
}

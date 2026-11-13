"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Crosshair, Layers, Locate, Maximize2, Minus, Plus } from "lucide-react";
import { withBasePath } from "@/lib/images";

/** Payload written by scripts/build-airport-map.mjs. Coordinates are metres
 *  east/south of `origin`, rotated by `rotation` so the piers lie flat. */
interface MapData {
  id: string;
  airport: string;
  airportName: string;
  loungeName: string;
  location: string;
  origin: { lat: number; lon: number };
  rotation: number;
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  home: { name: string; ring: [number, number][] } | null;
  lounge: {
    ring: [number, number][];
    center: [number, number];
    level: string | null;
    gates: string[];
  };
  areas: { kind: "terminal" | "building"; name: string | null; ring: [number, number][] }[];
  transit: { kind: string; line: [number, number][] }[];
  gates: { ref: string; x: number; y: number }[];
  levels: string[];
  rooms: Record<string, [number, number][][]>;
  walls: Record<string, [number, number][][]>;
}

/** Top-left corner and width of the visible window, in map metres. */
interface View {
  x: number;
  y: number;
  w: number;
}

const ASPECT = 0.62; // height / width of the map frame

/**
 * Metres per pixel at which each layer becomes readable. Gates stay on well
 * past the point where they would all fit, because the collision pass thins
 * them out — and a gate number is the single most useful thing on the map, so
 * hiding it until you are almost on top of the lounge defeats the purpose.
 */
const SHOW_INDOOR_MPP = 0.65;
const SHOW_GATES_MPP = 2.2;
const SHOW_AREA_NAMES_MPP = 0.12;

/** Default framing around the lounge — wide enough to show the pier and its
 *  neighbours, tight enough that the gate numbers are legible. */
const DEFAULT_SPAN_M = 620;

const COMPASS = ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"];

export default function AirportMap({ loungeId, staticPlanAlt }: { loungeId: string; staticPlanAlt: string }) {
  const [data, setData] = useState<MapData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    fetch(withBasePath(`/maps/${loungeId}.json`))
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((json: MapData) => live && setData(json))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [loungeId]);

  if (failed) return null;
  if (!data) {
    return (
      <div
        className="w-full animate-pulse rounded-[14px] bg-surface-sunken ring-1 ring-hairline"
        style={{ aspectRatio: `1 / ${ASPECT}` }}
        aria-label="Loading airport map"
      />
    );
  }
  return <Canvas data={data} staticPlanAlt={staticPlanAlt} />;
}

function Canvas({ data, staticPlanAlt }: { data: MapData; staticPlanAlt: string }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 800 * ASPECT });

  // How much indoor detail each level actually carries around the lounge.
  // Most terminals are mapped on one floor at best, so this drives both the
  // default level and whether the floor-plan hint is worth showing at all.
  const detailByLevel = useMemo(() => {
    const [cx, cy] = data.lounge.center;
    const counts: Record<string, number> = {};
    for (const level of data.levels) {
      counts[level] = (data.rooms[level] ?? []).filter((ring) =>
        ring.some(([x, y]) => Math.hypot(x - cx, y - cy) < 150)
      ).length;
    }
    return counts;
  }, [data]);

  const defaultLevel = useMemo(() => {
    const richest = data.levels.reduce<string | null>(
      (best, level) => (best === null || detailByLevel[level] > detailByLevel[best] ? level : best),
      null
    );
    // Prefer the tagged level, but not when nothing is mapped on it.
    if (data.lounge.level && (detailByLevel[data.lounge.level] ?? 0) > 0) return data.lounge.level;
    return richest;
  }, [data.levels, data.lounge.level, detailByLevel]);

  const [level, setLevel] = useState<string | null>(defaultLevel);

  const fitTo = useCallback(
    (box: { minX: number; minY: number; maxX: number; maxY: number }, pad = 1.18): View => {
      const w = Math.max((box.maxX - box.minX) * pad, 60);
      const h = Math.max((box.maxY - box.minY) * pad, 60 * ASPECT);
      // Widen if the box is taller than the frame allows, so nothing is cut off.
      const width = Math.max(w, h / ASPECT);
      return {
        x: (box.minX + box.maxX) / 2 - width / 2,
        y: (box.minY + box.maxY) / 2 - (width * ASPECT) / 2,
        w: width,
      };
    },
    []
  );

  const homeBox = useMemo(() => {
    const ring = data.home?.ring;
    if (!ring) {
      const [cx, cy] = data.lounge.center;
      return { minX: cx - 220, minY: cy - 140, maxX: cx + 220, maxY: cy + 140 };
    }
    return ring.reduce(
      (b, [x, y]) => ({
        minX: Math.min(b.minX, x),
        minY: Math.min(b.minY, y),
        maxX: Math.max(b.maxX, x),
        maxY: Math.max(b.maxY, y),
      }),
      { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
    );
  }, [data]);

  // Open centred on the lounge at concourse scale. Fitting the whole pier
  // instead shrinks the marker to a speck and pads the frame with apron,
  // because a concourse is far longer than it is deep.
  const initialView = useMemo(() => {
    const fitted = fitTo(homeBox);
    const span = Math.min(fitted.w, DEFAULT_SPAN_M);
    const [cx, cy] = data.lounge.center;
    return { x: cx - span / 2, y: cy - (span * ASPECT) / 2, w: span };
  }, [fitTo, homeBox, data.lounge.center]);

  const [view, setView] = useState<View>(initialView);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      setSize({ w, h: w * ASPECT });
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  const mpp = view.w / size.w; // metres per pixel
  const toPx = useCallback(
    (x: number, y: number) => ({ left: (x - view.x) / mpp, top: (y - view.y) / mpp }),
    [view, mpp]
  );

  // ---------------------------------------------------------------- zoom/pan

  const clampView = useCallback(
    (next: View): View => {
      const span = Math.max(data.bounds.maxX - data.bounds.minX, 400);
      const w = Math.min(Math.max(next.w, 45), span * 1.8);
      return { ...next, w };
    },
    [data.bounds]
  );

  const zoomAbout = useCallback(
    (factor: number, px: number, py: number) => {
      setView((v) => {
        const next = clampView({ ...v, w: v.w * factor });
        const k = next.w / v.w;
        // Keep the map point under the cursor pinned to the cursor.
        const mx = v.x + px * (v.w / size.w);
        const my = v.y + py * (v.w / size.w);
        return { x: mx - (mx - v.x) * k, y: my - (my - v.y) * k, w: next.w };
      });
    },
    [clampView, size.w]
  );

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    // React attaches wheel passively, which cannot preventDefault, so the page
    // would scroll instead of the map zooming.
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = frame.getBoundingClientRect();
      zoomAbout(Math.exp(e.deltaY * 0.0016), e.clientX - rect.left, e.clientY - rect.top);
    };
    frame.addEventListener("wheel", onWheel, { passive: false });
    return () => frame.removeEventListener("wheel", onWheel);
  }, [zoomAbout]);

  const drag = useRef<{ id: number; x: number; y: number } | null>(null);
  const pinch = useRef<Map<number, { x: number; y: number }>>(new Map());

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pinch.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch.current.size === 1) drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pinch.current.has(e.pointerId)) return;
    const previous = pinch.current.get(e.pointerId)!;
    pinch.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pinch.current.size >= 2) {
      const [a, b] = [...pinch.current.values()];
      const spread = Math.hypot(a.x - b.x, a.y - b.y);
      const lastSpread = pinch.current.get(-1)?.x ?? spread;
      pinch.current.set(-1, { x: spread, y: 0 });
      if (lastSpread > 0 && spread > 0) {
        const rect = frameRef.current!.getBoundingClientRect();
        zoomAbout(lastSpread / spread, (a.x + b.x) / 2 - rect.left, (a.y + b.y) / 2 - rect.top);
      }
      return;
    }

    if (drag.current?.id !== e.pointerId) return;
    const dx = e.clientX - previous.x;
    const dy = e.clientY - previous.y;
    setView((v) => ({ ...v, x: v.x - dx * (v.w / size.w), y: v.y - dy * (v.w / size.w) }));
  };

  const endPointer = (e: React.PointerEvent) => {
    pinch.current.delete(e.pointerId);
    pinch.current.delete(-1);
    if (drag.current?.id === e.pointerId) drag.current = null;
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = view.w * 0.12;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    if (moves[e.key]) {
      e.preventDefault();
      const [dx, dy] = moves[e.key];
      setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
    } else if (e.key === "+" || e.key === "=") {
      e.preventDefault();
      zoomAbout(1 / 1.4, size.w / 2, size.h / 2);
    } else if (e.key === "-") {
      e.preventDefault();
      zoomAbout(1.4, size.w / 2, size.h / 2);
    }
  };

  // -------------------------------------------------------------- geolocation

  const [fix, setFix] = useState<{ lat: number; lon: number; accuracy: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const locate = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setGeoError("This browser cannot share a location.");
      return;
    }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setFix({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        setLocating(false);
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission was declined."
            : "Could not get a location fix."
        );
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 30_000 }
    );
  }, []);

  // Same projection the builder used, so the fix lands in the map's frame.
  const project = useCallback(
    (lat: number, lon: number) => {
      const k = Math.cos((data.origin.lat * Math.PI) / 180);
      const x = (lon - data.origin.lon) * k * 111320;
      const y = -(lat - data.origin.lat) * 111320;
      const c = Math.cos(-data.rotation);
      const s = Math.sin(-data.rotation);
      return { x: x * c - y * s, y: x * s + y * c };
    },
    [data.origin, data.rotation]
  );

  const you = useMemo(() => {
    if (!fix) return null;
    const p = project(fix.lat, fix.lon);
    const [cx, cy] = data.lounge.center;
    const distance = Math.hypot(p.x - cx, p.y - cy);

    // Bearing is computed from true coordinates, not the rotated frame, so the
    // wording stays right however the map is turned on screen.
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLon = toRad(data.origin.lon - fix.lon);
    const y1 = Math.sin(dLon) * Math.cos(toRad(data.origin.lat));
    const x1 =
      Math.cos(toRad(fix.lat)) * Math.sin(toRad(data.origin.lat)) -
      Math.sin(toRad(fix.lat)) * Math.cos(toRad(data.origin.lat)) * Math.cos(dLon);
    const bearing = (Math.atan2(y1, x1) * 180) / Math.PI;
    const compass = COMPASS[Math.round(((bearing + 360) % 360) / 45) % 8];

    return { ...p, distance, compass, accuracy: fix.accuracy };
  }, [fix, project, data.lounge.center, data.origin]);

  // ------------------------------------------------------------------ render

  const showIndoor = mpp < SHOW_INDOOR_MPP && level !== null;
  const showGates = mpp < SHOW_GATES_MPP;
  const showAreaNames = mpp > SHOW_AREA_NAMES_MPP;

  const viewBox = `${view.x} ${view.y} ${view.w} ${view.w * ASPECT}`;
  const path = (ring: [number, number][], close = true) =>
    `M${ring.map(([x, y]) => `${x},${y}`).join("L")}${close ? "Z" : ""}`;

  const inView = useCallback(
    (x: number, y: number, margin = 0) =>
      x >= view.x - margin &&
      x <= view.x + view.w + margin &&
      y >= view.y - margin &&
      y <= view.y + view.w * ASPECT + margin,
    [view]
  );

  // Gate pills are HTML, so cull them before they hit the DOM and drop any that
  // would collide — 201 gates at ATL is a wall of text otherwise.
  const gateLabels = useMemo(() => {
    if (!showGates) return [];
    const placed: { left: number; top: number; ref: string }[] = [];
    for (const gate of data.gates) {
      if (!inView(gate.x, gate.y, view.w * 0.05)) continue;
      const { left, top } = toPx(gate.x, gate.y);
      if (placed.some((p) => Math.abs(p.left - left) < 34 && Math.abs(p.top - top) < 18)) continue;
      placed.push({ left, top, ref: gate.ref });
      if (placed.length > 90) break;
    }
    return placed;
  }, [showGates, data.gates, inView, toPx, view.w]);

  const areaLabels = useMemo(() => {
    if (!showAreaNames) return [];
    const candidates = data.areas
      // Passenger buildings only. OSM tags cargo sheds and FBOs as terminals
      // too, and "DELTA CARGO" is not a thing a traveller navigates by.
      .filter((a) => a.kind === "terminal" && a.name && /concourse|terminal/i.test(a.name))
      .filter((a) => !/cargo|freight|fedex|\bups\b|maintenance/i.test(a.name!))
      .map((a) => {
        const cx = a.ring.reduce((s, [x]) => s + x, 0) / a.ring.length;
        const cy = a.ring.reduce((s, [, y]) => s + y, 0) / a.ring.length;
        return { name: a.name!, area: polygonArea(a.ring), ...toPx(cx, cy) };
      })
      .filter((l) => l.left > 8 && l.left < size.w - 8 && l.top > 8 && l.top < size.h - 8)
      // Biggest first, so where several overlap the concourse wins over a
      // kiosk — ATL stacks North, South and Domestic Terminal on one spot.
      .sort((a, b) => b.area - a.area);

    // The lounge's own label is placed first and never yields, so a concourse
    // name cannot end up printed across it.
    const loungePoint = toPx(data.lounge.center[0], data.lounge.center[1]);
    const placed: typeof candidates = [
      { name: data.loungeName, area: Infinity, left: loungePoint.left, top: loungePoint.top - 26 },
    ];
    const result: typeof candidates = [];

    for (const label of candidates) {
      const halfWidth = label.name.length * 3.2 + 8;
      if (
        placed.some(
          (p) =>
            Math.abs(p.top - label.top) < 16 &&
            Math.abs(p.left - label.left) < halfWidth + p.name.length * 3.2 + 8
        )
      ) {
        continue;
      }
      placed.push(label);
      result.push(label);
    }
    return result;
  }, [showAreaNames, data.areas, data.lounge.center, data.loungeName, toPx, size]);

  const detailHere = level === null ? 0 : (detailByLevel[level] ?? 0);
  const anyDetail = Object.values(detailByLevel).some((n) => n > 0);
  const hint = !anyDetail
    ? "No floor plan mapped here yet"
    : !showIndoor
      ? "Zoom in for the floor plan"
      : detailHere === 0
        ? `Level ${level} is not mapped indoors`
        : null;

  const loungePx = toPx(data.lounge.center[0], data.lounge.center[1]);
  const scaleBarM = niceScale(view.w / 5);
  const northDeg = (-data.rotation * 180) / Math.PI;

  return (
    <figure className="overflow-hidden rounded-[14px] bg-surface ring-1 ring-hairline">
      <div
        ref={frameRef}
        role="application"
        aria-label={staticPlanAlt}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onKeyDown={onKeyDown}
        className="relative w-full cursor-grab touch-none overflow-hidden bg-[#e4e8ee] select-none focus-visible:outline-none active:cursor-grabbing"
        style={{ aspectRatio: `1 / ${ASPECT}` }}
      >
        <svg viewBox={viewBox} className="absolute inset-0 h-full w-full" aria-hidden="true">
          {/* Apron / non-terminal structures, so the terminals read as figure. */}
          {data.areas
            .filter((a) => a.kind === "building")
            .map((a, i) => (
              <path key={`b${i}`} d={path(a.ring)} fill="#d7dce4" />
            ))}

          {data.transit.map((t, i) => (
            <path
              key={`t${i}`}
              d={path(t.line, false)}
              fill="none"
              stroke="#b6bcc6"
              strokeWidth={3}
              strokeDasharray="10 7"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {data.areas
            .filter((a) => a.kind === "terminal")
            .map((a, i) => (
              <path
                key={`a${i}`}
                d={path(a.ring)}
                fill="#ffffff"
                stroke="#98a1b0"
                // Piers are ~40m wide, which is 5px at airport zoom — without a
                // firm outline they dissolve into the apron.
                strokeWidth={1.3}
                vectorEffect="non-scaling-stroke"
              />
            ))}

          {showIndoor && (
            <g>
              {(data.rooms[level!] ?? []).map((ring, i) => (
                <path
                  key={`r${i}`}
                  d={path(ring)}
                  fill="#f4f6f8"
                  stroke="#c9cfd9"
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              {(data.walls[level!] ?? []).map((line, i) => (
                <path
                  key={`w${i}`}
                  d={path(line, false)}
                  fill="none"
                  stroke="#aeb4be"
                  strokeWidth={1.4}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </g>
          )}

          <path
            d={path(data.lounge.ring)}
            fill="#0071e3"
            fillOpacity={0.92}
            stroke="#0071e3"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
          />

          {you && (
            <>
              <circle
                cx={you.x}
                cy={you.y}
                r={Math.max(you.accuracy, 8)}
                fill="#0071e3"
                fillOpacity={0.1}
                stroke="#0071e3"
                strokeOpacity={0.3}
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
              {/* A straight line, not a route: no indoor walking graph exists. */}
              <line
                x1={you.x}
                y1={you.y}
                x2={data.lounge.center[0]}
                y2={data.lounge.center[1]}
                stroke="#0071e3"
                strokeWidth={2}
                strokeDasharray="6 6"
                strokeOpacity={0.55}
                vectorEffect="non-scaling-stroke"
              />
            </>
          )}
        </svg>

        {/* Labels live in HTML so they stay crisp and a constant size at any zoom. */}
        <div className="pointer-events-none absolute inset-0">
          {areaLabels.map((l) => (
            <span
              // Name alone is not unique — ATL maps "Concourse E" twice.
              key={`${l.name}-${l.left.toFixed(0)}-${l.top.toFixed(0)}`}
              style={{ left: l.left, top: l.top }}
              className="absolute -translate-x-1/2 -translate-y-1/2 text-[11px] font-semibold tracking-wide text-ink-tertiary uppercase"
            >
              {l.name}
            </span>
          ))}

          {gateLabels.map((g) => (
            <span
              key={`${g.ref}-${g.left.toFixed(0)}`}
              style={{ left: g.left, top: g.top }}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90 px-1.5 py-px text-[10px] font-semibold text-ink-secondary ring-1 ring-hairline"
            >
              {g.ref}
            </span>
          ))}

          <span
            style={{ left: loungePx.left, top: loungePx.top - 18 }}
            className="absolute -translate-x-1/2 -translate-y-full rounded-[8px] bg-accent px-2 py-1 text-[11px] font-semibold whitespace-nowrap text-white shadow-sm"
          >
            {data.loungeName}
          </span>

          {you && (
            <span
              style={{ left: toPx(you.x, you.y).left, top: toPx(you.x, you.y).top }}
              className="absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-accent shadow"
              title="Your position"
            />
          )}
        </div>

        {/* Controls */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
          <ControlButton label="Zoom in" onClick={() => zoomAbout(1 / 1.5, size.w / 2, size.h / 2)}>
            <Plus size={15} strokeWidth={2.2} />
          </ControlButton>
          <ControlButton label="Zoom out" onClick={() => zoomAbout(1.5, size.w / 2, size.h / 2)}>
            <Minus size={15} strokeWidth={2.2} />
          </ControlButton>
          <ControlButton label="Zoom to the lounge" onClick={() => setView(fitTo(ringBox(data.lounge.ring), 5))}>
            <Crosshair size={15} strokeWidth={2} />
          </ControlButton>
          <ControlButton label="Whole airport" onClick={() => setView(fitTo(data.bounds, 1.05))}>
            <Maximize2 size={15} strokeWidth={2} />
          </ControlButton>
          <ControlButton label="Find my position" onClick={locate} busy={locating}>
            <Locate size={15} strokeWidth={2} />
          </ControlButton>
        </div>

        {data.levels.length > 1 && (
          <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-white/92 p-1 shadow-sm ring-1 ring-hairline backdrop-blur">
            <Layers size={13} strokeWidth={2} aria-hidden="true" className="ml-1.5 text-ink-tertiary" />
            {data.levels.map((l) => {
              const mapped = (detailByLevel[l] ?? 0) > 0;
              return (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLevel(l)}
                  aria-pressed={level === l}
                  title={mapped ? `Level ${l}` : `Level ${l} — not mapped near this lounge`}
                  className={`h-6 min-w-6 rounded-full px-1.5 text-[11px] font-semibold tabular-nums transition-colors ${
                    level === l
                      ? "bg-ink text-white"
                      : mapped
                        ? "text-ink-secondary hover:text-ink"
                        : "text-ink-tertiary/45 hover:text-ink-tertiary"
                  }`}
                >
                  {l}
                </button>
              );
            })}
          </div>
        )}

        {/* North arrow and scale bar */}
        <div className="pointer-events-none absolute bottom-3 left-3 flex items-end gap-3">
          <div className="flex flex-col items-center">
            <svg width="20" height="20" viewBox="0 0 20 20" style={{ transform: `rotate(${northDeg}deg)` }}>
              <path d="M10 2 L13.4 17 L10 13.6 L6.6 17 Z" fill="#6e6e73" />
            </svg>
            <span className="text-[9px] font-semibold text-ink-tertiary">N</span>
          </div>
          <div>
            <div className="h-[3px] rounded-full bg-ink-tertiary/60" style={{ width: scaleBarM / mpp }} />
            <span className="text-[10px] text-ink-tertiary">{scaleBarM} m</span>
          </div>
        </div>

        {/* Only promise a floor plan that exists. Most terminals have a single
            partially-mapped level, and some have none around the lounge. */}
        {hint && (
          <p className="pointer-events-none absolute right-3 bottom-3 rounded-full bg-white/85 px-2.5 py-1 text-[10.5px] text-ink-tertiary ring-1 ring-hairline">
            {hint}
          </p>
        )}
      </div>

      <figcaption className="border-t border-hairline px-5 py-3.5">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <p className="text-[13.5px] text-ink">
            {data.home && <span className="font-medium">{data.home.name}</span>}
            {data.lounge.level !== null && <> · Level {data.lounge.level}</>}
            {data.lounge.gates.length >= 2 && (
              <>
                {" "}
                · <span className="font-medium">Between gates {data.lounge.gates[0]} and {data.lounge.gates[1]}</span>
              </>
            )}
          </p>
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] text-ink-tertiary underline decoration-hairline-strong underline-offset-2 transition-colors hover:text-ink-secondary"
          >
            © OpenStreetMap contributors
          </a>
        </div>

        <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-tertiary">
          {geoError ??
            (you
              ? you.distance > 4000
                ? `You are ${(you.distance / 1000).toFixed(0)} km away — not at ${data.airport} yet.`
                : // Phrased from the traveller outwards: "to the west" has to
                  // attach to the lounge, not to them.
                  `The lounge is about ${Math.round(you.distance)} m from you, to the ${you.compass}. Indoors a GPS fix is only accurate to ${Math.round(you.accuracy)} m, so treat the dot as a hint and follow the gate numbers.`
              : "Drag to pan, scroll to zoom. Tap the locate button to place yourself on the map.")}
        </p>
      </figcaption>
    </figure>
  );
}

function ControlButton({
  label,
  onClick,
  busy,
  children,
}: {
  label: string;
  onClick: () => void;
  busy?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-8 w-8 items-center justify-center rounded-full bg-white/92 text-ink-secondary shadow-sm ring-1 ring-hairline backdrop-blur transition-colors hover:text-ink ${
        busy ? "animate-pulse" : ""
      }`}
    >
      {children}
    </button>
  );
}

function ringBox(ring: [number, number][]) {
  return ring.reduce(
    (b, [x, y]) => ({
      minX: Math.min(b.minX, x),
      minY: Math.min(b.minY, y),
      maxX: Math.max(b.maxX, x),
      maxY: Math.max(b.maxY, y),
    }),
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
  );
}

function polygonArea(ring: [number, number][]) {
  let sum = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    sum += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]);
  }
  return Math.abs(sum / 2);
}

/** 1, 2 or 5 times a power of ten — the usual scale-bar steps. */
function niceScale(target: number): number {
  const pow = 10 ** Math.floor(Math.log10(target));
  const n = target / pow;
  return (n >= 5 ? 5 : n >= 2 ? 2 : 1) * pow;
}

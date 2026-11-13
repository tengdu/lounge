import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { lounges } from "@/data/lounges";
import { positionFor } from "@/lib/positions";
import { appleMapsUrl, googleMapsUrl } from "@/lib/links";
import LoungeMapLazy from "@/components/LoungeMapLazy";

// Only lounges with a mapped position get a page — without coordinates there
// is nothing to put a pin on.
export async function generateStaticParams() {
  return lounges.filter((l) => positionFor(l.id)).map((l) => ({ id: l.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const lounge = lounges.find((l) => l.id === id);
  if (!lounge) return {};
  return {
    title: `Map — ${lounge.name}, ${lounge.airportCode} | Lounge`,
    description: `Find the ${lounge.name} at ${lounge.airportName}: ${lounge.location}.`,
  };
}

export default async function LoungeMapPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lounge = lounges.find((l) => l.id === id);
  const position = positionFor(id);
  if (!lounge || !position) notFound();

  const point = { lat: position.lat, lon: position.lon };
  const label = `${lounge.name}, ${lounge.airportName}`;

  return (
    <main className="h-dvh w-full overflow-hidden">
      <LoungeMapLazy
        variant="full"
        loungeId={lounge.id}
        loungeName={lounge.name}
        airportCode={lounge.airportCode}
        location={lounge.location}
        lat={position.lat}
        lon={position.lon}
        gate={lounge.wayfinding.gate ?? position.gates[0] ?? null}
        level={position.level}
        approximate={position.approximate}
        landmark={position.landmark}
        appleMapsHref={appleMapsUrl(label, point)}
        googleMapsHref={googleMapsUrl(label, point)}
      />
    </main>
  );
}

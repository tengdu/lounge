import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Baby,
  BedDouble,
  ChefHat,
  Coffee,
  Dumbbell,
  Laptop,
  Luggage,
  Moon,
  Plane,
  Plug,
  Presentation,
  ShowerHead,
  Sparkles,
  Sun,
  Ticket,
  Utensils,
  Wifi,
  Wine,
  type LucideIcon,
} from "lucide-react";
import { AMENITY_CATALOG, lounges, type Amenity } from "@/data/lounges";
import { positionFor } from "@/lib/positions";
import { blurFor, heroSrc, withBasePath } from "@/lib/images";
import AccessPanel from "@/components/AccessPanel";
import AccountButton from "@/components/AccountButton";
import BackToList from "@/components/BackToList";
import CommunitySection from "@/components/CommunitySection";
import GettingThere from "@/components/GettingThere";
import PhotoNotice from "@/components/PhotoNotice";

export async function generateStaticParams() {
  return lounges.map((lounge) => ({ id: lounge.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const lounge = lounges.find((l) => l.id === id);
  if (!lounge) return {};

  const title = `${lounge.name} — ${lounge.airportCode} | Lounge`;
  return {
    title,
    description: lounge.description,
    openGraph: { title, description: lounge.description },
  };
}

const AMENITY_ICONS: Record<Amenity, LucideIcon> = {
  wifi: Wifi,
  charging: Plug,
  dining: Utensils,
  alacarte: ChefHat,
  barista: Coffee,
  bar: Wine,
  showers: ShowerHead,
  quiet: Moon,
  naps: BedDouble,
  workspace: Laptop,
  conference: Presentation,
  family: Baby,
  terrace: Sun,
  runway: Plane,
  spa: Sparkles,
  fitness: Dumbbell,
  luggage: Luggage,
  daypass: Ticket,
};

export default async function LoungeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lounge = lounges.find((l) => l.id === id);

  if (!lounge) {
    notFound();
  }

  const blur = blurFor(lounge.imageUrl);
  const has = new Set<Amenity>(lounge.amenities);
  const available = AMENITY_CATALOG.filter((a) => has.has(a.id));
  const unavailable = AMENITY_CATALOG.filter((a) => !has.has(a.id));

  const nearby = lounges
    .filter((l) => l.airportCode === lounge.airportCode && l.id !== lounge.id)
    .slice(0, 4);

  // Alt text describes a photograph; generic brand art is decorative and gets
  // an empty alt so screen readers skip it rather than announcing a fiction.
  const heroAlt = lounge.photo
    ? lounge.photo.kind === "entrance"
      ? `The entrance to the ${lounge.name} at ${lounge.airportCode}`
      : `Inside the ${lounge.name} at ${lounge.airportCode}`
    : "";

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-hairline bg-canvas/72 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex h-12 max-w-5xl items-center justify-between gap-4 px-5">
          <BackToList />
          <AccountButton />
        </div>
      </header>

      <main className="flex-1">
        <div className="relative h-[42vh] min-h-[280px] w-full overflow-hidden bg-surface-sunken md:h-[54vh]">
          <Image
            src={withBasePath(heroSrc(lounge.imageUrl))}
            alt={heroAlt}
            fill
            preload
            sizes="100vw"
            placeholder={blur ? "blur" : "empty"}
            blurDataURL={blur}
            className="object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/10 to-transparent"
          />
          {!lounge.photo && (
            <span className="absolute top-3 right-4 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-medium text-white/90 backdrop-blur-sm">
              Illustrative photo
            </span>
          )}
        </div>

        <div className="mx-auto max-w-5xl px-5">
          <div className="animate-rise -mt-16 md:-mt-24">
            <div className="mb-3 flex items-center gap-2 text-[13px] font-medium tracking-[0.04em] uppercase">
              <span className="text-accent">{lounge.airportCode}</span>
              <span aria-hidden="true" className="text-ink-tertiary">
                ·
              </span>
              <span className="text-ink-tertiary">{lounge.airportCity}</span>
            </div>

            <h1 className="text-display max-w-3xl text-[38px] text-ink sm:text-[52px] md:text-[62px]">
              {lounge.name}
            </h1>

            <p className="mt-5 max-w-2xl text-[19px] leading-[1.5] text-ink-secondary">
              {lounge.location}
            </p>

            {lounge.closed && (
              <p className="mt-5 inline-block rounded-[10px] bg-amber-50 px-3 py-2 text-[13px] font-medium text-amber-900 ring-1 ring-amber-600/20">
                Closed for renovation — check before you travel.
              </p>
            )}
          </div>

          <div className="mt-8">
            <PhotoNotice lounge={lounge} />
          </div>

          <div className="mt-12 grid grid-cols-1 gap-x-12 gap-y-12 pb-24 lg:grid-cols-[1fr_340px]">
            <div className="space-y-12">
              <section>
                <h2 className="text-title mb-4 text-[22px] text-ink">Overview</h2>
                <p className="max-w-2xl text-[17px] leading-[1.6] text-ink-secondary">
                  {lounge.description}
                </p>
              </section>

              <GettingThere
                wayfinding={lounge.wayfinding}
                airportName={lounge.airportName}
                airportCode={lounge.airportCode}
                location={lounge.location}
                position={positionFor(lounge.id)}
                loungeId={lounge.id}
                loungeName={lounge.name}
              />

              <section>
                <div className="mb-5 flex items-baseline justify-between">
                  <h2 className="text-title text-[22px] text-ink">Amenities</h2>
                  <span className="text-[13px] tabular-nums text-ink-tertiary">
                    {available.length} of {AMENITY_CATALOG.length}
                  </span>
                </div>

                <ul className="grid grid-cols-2 gap-x-6 gap-y-px overflow-hidden rounded-[14px] bg-surface p-1.5 ring-1 ring-hairline sm:grid-cols-3">
                  {available.map(({ id, label }) => {
                    const Icon = AMENITY_ICONS[id];
                    return (
                      <li key={id} className="flex items-center gap-2.5 px-3 py-2.5">
                        <Icon
                          size={17}
                          strokeWidth={1.7}
                          aria-hidden="true"
                          className="shrink-0 text-accent"
                        />
                        <span className="text-[14px] text-ink">{label}</span>
                      </li>
                    );
                  })}
                </ul>

                {unavailable.length > 0 && (
                  <p className="mt-4 text-[13px] leading-relaxed text-ink-tertiary">
                    <span className="text-ink-secondary">Not offered:</span>{" "}
                    {unavailable.map((a) => a.label).join(", ")}.
                  </p>
                )}
              </section>

              <CommunitySection loungeId={lounge.id} loungeName={lounge.name} />

              {nearby.length > 0 && (
                <section>
                  <h2 className="text-title mb-5 text-[22px] text-ink">
                    Also at {lounge.airportCode}
                  </h2>
                  <ul className="divide-y divide-hairline overflow-hidden rounded-[14px] bg-surface ring-1 ring-hairline">
                    {nearby.map((other) => (
                      <li key={other.id}>
                        <Link
                          href={`/lounge/${other.id}`}
                          className="flex items-baseline justify-between gap-4 px-5 py-4 transition-colors hover:bg-surface-sunken"
                        >
                          {/* Both truncate: a long location used to be
                              unshrinkable and forced the name to wrap one
                              letter per line. */}
                          <span className="min-w-0 truncate text-[15px] font-medium text-ink">
                            {other.name}
                          </span>
                          <span className="min-w-0 max-w-[60%] truncate text-right text-[13px] text-ink-tertiary">
                            {other.location}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            <aside className="lg:sticky lg:top-20 lg:self-start">
              <AccessPanel access={lounge.access} />
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}

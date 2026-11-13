"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Map } from "lucide-react";
import { Lounge } from "@/data/lounges";
import { hasMap } from "@/lib/positions";
import { blurFor, cardSrc, withBasePath } from "@/lib/images";
import { verdictFor } from "@/lib/access";
import { useWallet } from "@/lib/wallet";

interface LoungeCardProps {
  lounge: Lounge;
  /** Cards in the first visible row load eagerly; the rest stay lazy. */
  eager?: boolean;
}

export default function LoungeCard({ lounge, eager = false }: LoungeCardProps) {
  const blur = blurFor(lounge.imageUrl);
  const { credentials, ready } = useWallet();
  const youreIn = ready && credentials.size > 0 && verdictFor(lounge.access, credentials).status === "in";

  return (
    <Link
      href={`/lounge/${lounge.id}`}
      className="group block rounded-[18px] bg-surface ring-1 ring-hairline transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] hover:-translate-y-1 hover:shadow-[0_12px_32px_rgb(0_0_0_/_0.10)]"
    >
      <div className="relative aspect-[3/2] overflow-hidden rounded-t-[18px] bg-surface-sunken">
        <Image
          src={withBasePath(cardSrc(lounge.imageUrl))}
          alt={lounge.photo ? `The ${lounge.name} at ${lounge.airportCode}` : ""}
          fill
          loading={eager ? "eager" : "lazy"}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          placeholder={blur ? "blur" : "empty"}
          blurDataURL={blur}
          className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:scale-[1.04]"
        />

        {youreIn && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
            <Check size={11} strokeWidth={3} aria-hidden="true" />
            You can enter
          </span>
        )}
      </div>

      <div className="p-5">
        <div className="mb-2 flex items-center gap-2 text-[12px] font-medium tracking-[0.04em] text-ink-tertiary uppercase">
          <span className="text-accent">{lounge.airportCode}</span>
          <span aria-hidden="true">·</span>
          <span className="truncate">{lounge.airportCity}</span>
        </div>

        <h3 className="text-title mb-1.5 text-[19px] text-ink">{lounge.name}</h3>

        <p className="line-clamp-2 text-[14px] leading-[1.45] text-ink-secondary">{lounge.location}</p>

        <div className="mt-4 flex items-center justify-between border-t border-hairline pt-3.5">
          <span className="flex min-w-0 items-center gap-2 pr-3 text-[13px] text-ink-tertiary">
            <span className="truncate">{lounge.amenities.length} amenities</span>
            {/* Not every lounge can be placed on the map, so it is worth
                flagging from the grid rather than leaving people to find it. */}
            {hasMap(lounge.id) && (
              <span
                title="Map with walking directions"
                className="inline-flex shrink-0 items-center gap-1 rounded-full bg-surface-sunken px-1.5 py-0.5 text-[11px] font-medium text-ink-secondary"
              >
                <Map size={11} strokeWidth={2} aria-hidden="true" />
                Map
              </span>
            )}
          </span>
          <span className="shrink-0 text-[13px] font-medium tabular-nums text-ink-secondary">
            {lounge.rating.toFixed(1)}
          </span>
        </div>
      </div>
    </Link>
  );
}

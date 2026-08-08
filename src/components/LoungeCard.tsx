import Image from "next/image";
import Link from "next/link";
import { Lounge } from "@/data/lounges";
import { blurFor, cardSrc, withBasePath } from "@/lib/images";

interface LoungeCardProps {
  lounge: Lounge;
  /** Cards in the first visible row load eagerly; the rest stay lazy. */
  eager?: boolean;
}

export default function LoungeCard({ lounge, eager = false }: LoungeCardProps) {
  const blur = blurFor(lounge.imageUrl);

  return (
    <Link
      href={`/lounge/${lounge.id}`}
      className="group block rounded-[18px] bg-surface ring-1 ring-hairline transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] hover:-translate-y-1 hover:shadow-[0_12px_32px_rgb(0_0_0_/_0.10)]"
    >
      <div className="relative aspect-[3/2] overflow-hidden rounded-t-[18px] bg-surface-sunken">
        <Image
          src={withBasePath(cardSrc(lounge.imageUrl))}
          alt={lounge.hasRealPhoto ? `Inside the ${lounge.name} at ${lounge.airportCode}` : ""}
          fill
          loading={eager ? "eager" : "lazy"}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          placeholder={blur ? "blur" : "empty"}
          blurDataURL={blur}
          className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:scale-[1.04]"
        />
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
          <span className="truncate pr-3 text-[13px] text-ink-tertiary">
            {lounge.amenities.length} amenities
          </span>
          <span className="shrink-0 text-[13px] font-medium tabular-nums text-ink-secondary">
            {lounge.rating.toFixed(1)}
          </span>
        </div>
      </div>
    </Link>
  );
}

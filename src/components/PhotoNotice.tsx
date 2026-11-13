import { Camera } from "lucide-react";
import type { Lounge } from "@/data/lounges";
import { photoContributionUrl } from "@/lib/links";

/**
 * What the reader is actually looking at, plus the attribution the CC licenses
 * require. Filing credit only in CREDITS.md would not satisfy them, and
 * "illustrative" art needs saying out loud rather than implying a room the
 * traveller will never walk into.
 */
function describe(photo: NonNullable<Lounge["photo"]>, lounge: Lounge): string {
  if (photo.scope === "airport") {
    return `A ${lounge.name} at ${lounge.airportCode} — possibly a different room to this one`;
  }
  return photo.kind === "entrance" ? "The entrance to this lounge" : "Inside this lounge";
}

export default function PhotoNotice({ lounge }: { lounge: Lounge }) {
  const { photo } = lounge;

  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1.5 text-[12px] text-ink-tertiary">
      <p className="leading-relaxed">
        {photo ? (
          <>
            {describe(photo, lounge)}. Photo by{" "}
            <a
              href={photo.source}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-hairline-strong underline-offset-2 transition-colors hover:text-ink-secondary"
            >
              {photo.credit}
            </a>
            ,{" "}
            <a
              href={photo.licenseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-hairline-strong underline-offset-2 transition-colors hover:text-ink-secondary"
            >
              {photo.license}
            </a>
            .
          </>
        ) : (
          <>Illustrative image — we have no freely-licensed photograph of this lounge yet.</>
        )}
      </p>

      <a
        href={photoContributionUrl(lounge)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex shrink-0 items-center gap-1.5 font-medium transition-colors hover:text-ink"
      >
        <Camera size={13} strokeWidth={1.8} aria-hidden="true" />
        {photo ? "Add a photo" : "Contribute a photo"}
      </a>
    </div>
  );
}

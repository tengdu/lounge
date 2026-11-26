"use client";

import { useState } from "react";

/**
 * Google profile picture, or the first initial when there is none (or it
 * fails to load — Google's image host refuses some referrers).
 */
export default function Avatar({
  name,
  src,
  size = 36,
}: {
  name: string;
  src: string | null;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const style = { width: size, height: size };

  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- remote avatar; next/image is unoptimized in this static export anyway
      <img
        src={src}
        alt=""
        style={style}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="shrink-0 rounded-full bg-surface-sunken object-cover"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      style={{ ...style, fontSize: size * 0.42 }}
      className="flex shrink-0 items-center justify-center rounded-full bg-accent/12 font-semibold text-accent"
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}

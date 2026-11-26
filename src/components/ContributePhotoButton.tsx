"use client";

import { Camera } from "lucide-react";
import { openComposer } from "@/lib/composer-events";

/** Opens the photo uploader in the Reviews section and brings it into view. */
export default function ContributePhotoButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth" });
        openComposer("photos");
      }}
      className="inline-flex shrink-0 items-center gap-1.5 font-medium transition-colors hover:text-ink"
    >
      <Camera size={13} strokeWidth={1.8} aria-hidden="true" />
      {label}
    </button>
  );
}

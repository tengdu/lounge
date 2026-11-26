"use client";
/* eslint-disable @next/next/no-img-element -- user photos come from Supabase's
   CDN at sizes chosen on upload; next/image is unoptimized in this static
   export, so it would add nothing but a remotePatterns entry. */

import { useCallback, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Clock, Trash2, X } from "lucide-react";
import type { Photo } from "@/lib/community";

function PendingBadge() {
  return (
    <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
      <Clock size={10} strokeWidth={2.2} aria-hidden="true" />
      Waiting for review
    </span>
  );
}

/** A horizontal strip of thumbnails, AllTrails-style, above the reviews. */
export function PhotoStrip({
  photos,
  onOpen,
}: {
  photos: Photo[];
  onOpen: (index: number) => void;
}) {
  if (photos.length === 0) return null;

  return (
    <ul className="-mx-5 flex snap-x gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0">
      {photos.map((photo, i) => (
        <li key={photo.id} className="shrink-0 snap-start">
          <button
            type="button"
            onClick={() => onOpen(i)}
            className="relative block h-36 overflow-hidden rounded-[12px] bg-surface-sunken ring-1 ring-hairline transition-opacity hover:opacity-90"
            style={{ aspectRatio: `${photo.width} / ${photo.height}`, maxWidth: 260 }}
            aria-label={`Open photo ${i + 1} of ${photos.length}`}
          >
            <img
              src={photo.thumbUrl}
              alt=""
              loading="lazy"
              className={`h-full w-full object-cover ${photo.status === "pending" ? "opacity-70" : ""}`}
            />
            {photo.status === "pending" && <PendingBadge />}
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Small thumbnails inside a review card. */
export function ReviewThumbs({
  photos,
  onOpen,
}: {
  photos: Photo[];
  onOpen: (photo: Photo) => void;
}) {
  if (photos.length === 0) return null;
  return (
    <ul className="mt-3 flex flex-wrap gap-1.5">
      {photos.map((photo) => (
        <li key={photo.id}>
          <button
            type="button"
            onClick={() => onOpen(photo)}
            className="relative block h-20 w-20 overflow-hidden rounded-[8px] bg-surface-sunken ring-1 ring-hairline transition-opacity hover:opacity-90"
            aria-label="Open photo"
          >
            <img src={photo.thumbUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
          </button>
        </li>
      ))}
    </ul>
  );
}

export function PhotoLightbox({
  photos,
  index,
  onIndex,
  onClose,
  canDelete,
  onDelete,
}: {
  photos: Photo[];
  index: number | null;
  onIndex: (index: number) => void;
  onClose: () => void;
  canDelete: (photo: Photo) => boolean;
  onDelete: (photo: Photo) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const open = index !== null && photos[index] !== undefined;
  const photo = open ? photos[index] : null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const step = useCallback(
    (delta: number) => {
      if (index === null || photos.length === 0) return;
      onIndex((index + delta + photos.length) % photos.length);
    },
    [index, onIndex, photos.length]
  );

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") step(-1);
        if (e.key === "ArrowRight") step(1);
      }}
      aria-label="Photo"
      className="m-auto max-h-none max-w-none bg-transparent p-0 backdrop:bg-black/85"
    >
      {photo && (
        <div className="flex flex-col items-center gap-3">
          <img
            src={photo.url}
            alt=""
            width={photo.width}
            height={photo.height}
            className="max-h-[80vh] w-auto max-w-[min(1200px,calc(100vw-32px))] rounded-[12px] object-contain"
          />
          <div className="flex items-center gap-2 text-white">
            {photos.length > 1 && (
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Previous photo"
                className="rounded-full bg-white/10 p-2 transition-colors hover:bg-white/20"
              >
                <ChevronLeft size={18} aria-hidden="true" />
              </button>
            )}
            <span className="min-w-16 text-center text-[13px] tabular-nums text-white/80">
              {index! + 1} / {photos.length}
            </span>
            {photos.length > 1 && (
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Next photo"
                className="rounded-full bg-white/10 p-2 transition-colors hover:bg-white/20"
              >
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            )}
            {photo.status === "pending" && (
              <span className="ml-2 text-[12px] text-white/70">Waiting for review — only you can see it</span>
            )}
            {canDelete(photo) && (
              <button
                type="button"
                onClick={() => onDelete(photo)}
                className="ml-2 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2 text-[13px] transition-colors hover:bg-red-500/80"
              >
                <Trash2 size={14} aria-hidden="true" />
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="ml-2 rounded-full bg-white/10 p-2 transition-colors hover:bg-white/20"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}

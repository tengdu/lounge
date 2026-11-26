"use client";

import { Pencil, Trash2 } from "lucide-react";
import type { Photo, Review } from "@/lib/community";
import Avatar from "@/components/Avatar";
import { Stars } from "@/components/Stars";
import { ReviewThumbs } from "@/components/CommunityPhotos";

const MONTH_YEAR = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const SHORT_DATE = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function ReviewCard({
  review,
  photos,
  isMine,
  canModerate,
  onEdit,
  onDelete,
  onOpenPhoto,
}: {
  review: Review;
  photos: Photo[];
  isMine: boolean;
  canModerate: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onOpenPhoto: (photo: Photo) => void;
}) {
  const edited = new Date(review.updatedAt).getTime() - new Date(review.createdAt).getTime() > 60_000;

  return (
    <article className="px-5 py-5">
      <header className="flex items-start gap-3">
        <Avatar name={review.author.displayName} src={review.author.avatarUrl} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-medium text-ink">
            {review.author.displayName}
            {isMine && <span className="ml-2 text-[12px] font-normal text-ink-tertiary">You</span>}
          </p>
          <p className="mt-0.5 text-[12px] text-ink-tertiary">
            <time dateTime={review.createdAt}>{SHORT_DATE.format(new Date(review.createdAt))}</time>
            {edited && " · edited"}
          </p>
        </div>
        {(isMine || canModerate) && (
          <div className="flex shrink-0 gap-1">
            {isMine && (
              <button
                type="button"
                onClick={onEdit}
                aria-label="Edit your review"
                className="rounded-full p-1.5 text-ink-tertiary transition-colors hover:bg-surface-sunken hover:text-ink"
              >
                <Pencil size={15} aria-hidden="true" />
              </button>
            )}
            <button
              type="button"
              onClick={onDelete}
              aria-label={isMine ? "Delete your review" : "Remove this review"}
              className="rounded-full p-1.5 text-ink-tertiary transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 size={15} aria-hidden="true" />
            </button>
          </div>
        )}
      </header>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        <Stars value={review.rating} />
        {review.visitedOn && (
          <span className="text-[12px] text-ink-tertiary">
            Visited {MONTH_YEAR.format(new Date(review.visitedOn))}
          </span>
        )}
      </div>

      {review.body && (
        <p className="mt-2.5 text-[15px] leading-[1.6] whitespace-pre-line text-ink-secondary">
          {review.body}
        </p>
      )}

      <ReviewThumbs photos={photos} onOpen={onOpenPhoto} />
    </article>
  );
}

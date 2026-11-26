"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Camera, PenLine } from "lucide-react";
import {
  EMPTY_SUMMARY,
  deletePhoto,
  deleteReview,
  fetchMyReview,
  fetchPhotos,
  fetchRatingSummary,
  fetchReviews,
  type Photo,
  type RatingSummary as Summary,
  type Review,
} from "@/lib/community";
import { useAuth } from "@/lib/auth";
import { communityEnabled } from "@/lib/supabase";
import { onOpenComposer, type ComposerMode } from "@/lib/composer-events";
import RatingSummary from "@/components/RatingSummary";
import { ReviewCard } from "@/components/ReviewList";
import { PhotoLightbox, PhotoStrip } from "@/components/CommunityPhotos";
import ReviewComposer from "@/components/ReviewComposer";

/**
 * Traveller reviews, ratings and photos for one lounge.
 *
 * The lounge page itself is static HTML; everything in here is fetched in the
 * browser after load, so a new review shows up without a rebuild.
 */
export default function CommunitySection({
  loungeId,
  loungeName,
}: {
  loungeId: string;
  loungeName: string;
}) {
  const auth = useAuth();
  const viewerId = auth.status === "signed-in" ? auth.viewer.id : null;
  const isAdmin = auth.status === "signed-in" && auth.viewer.isAdmin;

  const [summary, setSummary] = useState<Summary>(EMPTY_SUMMARY);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [mine, setMine] = useState<Review | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [composer, setComposer] = useState<ComposerMode | null>(null);
  const [lightbox, setLightbox] = useState<{ list: Photo[]; index: number } | null>(null);

  // Public data, plus whatever only the viewer can see (their own review and
  // pending photos), reloaded whenever who's looking changes.
  const load = useCallback(async () => {
    try {
      const [s, r, p, m] = await Promise.all([
        fetchRatingSummary(loungeId),
        fetchReviews(loungeId, 0),
        fetchPhotos(loungeId),
        viewerId ? fetchMyReview(loungeId, viewerId) : Promise.resolve(null),
      ]);
      setSummary(s);
      setReviews(r.reviews);
      setTotal(r.total);
      setPage(0);
      setPhotos(p);
      setMine(m);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reviews could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [loungeId, viewerId]);

  useEffect(() => {
    if (auth.status === "loading") return;
    // Fetch-on-mount for a static page; the data lives in Supabase, not the build.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [auth.status, load]);

  useEffect(() => onOpenComposer(setComposer), []);

  const refreshSummary = useCallback(async () => {
    try {
      setSummary(await fetchRatingSummary(loungeId));
    } catch {
      /* the list already reflects the change; the totals can catch up later */
    }
  }, [loungeId]);

  const loadMore = async () => {
    const next = page + 1;
    try {
      const r = await fetchReviews(loungeId, next);
      setReviews((current) => {
        const seen = new Set(current.map((x) => x.id));
        return [...current, ...r.reviews.filter((x) => !seen.has(x.id))];
      });
      setTotal(r.total);
      setPage(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "More reviews could not be loaded.");
    }
  };

  const onReviewSaved = (review: Review) => {
    const isNew = !reviews.some((r) => r.id === review.id);
    setMine(review);
    setReviews((current) =>
      isNew ? [review, ...current] : current.map((r) => (r.id === review.id ? review : r))
    );
    if (isNew) setTotal((t) => t + 1);
    void refreshSummary();
  };

  const onPhotoUploaded = (photo: Photo) => setPhotos((current) => [photo, ...current]);

  const removeReview = async (review: Review) => {
    const own = review.userId === viewerId;
    const prompt = own
      ? "Delete your review? Your photos stay up."
      : `Remove ${review.author.displayName}'s review? This cannot be undone.`;
    if (!window.confirm(prompt)) return;
    try {
      await deleteReview(review.id);
      setReviews((current) => current.filter((r) => r.id !== review.id));
      setTotal((t) => Math.max(0, t - 1));
      if (own) setMine(null);
      void refreshSummary();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "The review could not be deleted.");
    }
  };

  const removePhoto = async (photo: Photo) => {
    if (!window.confirm("Delete this photo? This cannot be undone.")) return;
    try {
      await deletePhoto(photo);
      setPhotos((current) => current.filter((p) => p.id !== photo.id));
      setLightbox(null);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "The photo could not be deleted.");
    }
  };

  const photosByReview = useMemo(() => {
    const map = new Map<string, Photo[]>();
    for (const photo of photos) {
      if (!photo.reviewId || photo.status !== "approved") continue;
      map.set(photo.reviewId, [...(map.get(photo.reviewId) ?? []), photo]);
    }
    return map;
  }, [photos]);

  // The viewer's own review leads, wherever it falls in date order.
  const ordered = useMemo(() => {
    if (!mine) return reviews;
    return [mine, ...reviews.filter((r) => r.id !== mine.id)];
  }, [mine, reviews]);

  if (!communityEnabled) return null;

  return (
    <section id="reviews" className="scroll-mt-20">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-title text-[22px] text-ink">Reviews</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setComposer("photos")}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-surface px-4 text-[14px] font-medium text-ink-secondary ring-1 ring-hairline transition-colors hover:text-ink"
          >
            <Camera size={15} strokeWidth={1.8} aria-hidden="true" />
            Add photos
          </button>
          <button
            type="button"
            onClick={() => setComposer("review")}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-ink px-4 text-[14px] font-medium text-white transition-opacity hover:opacity-90"
          >
            <PenLine size={15} strokeWidth={1.8} aria-hidden="true" />
            {mine ? "Edit your review" : "Write a review"}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-[10px] bg-red-50 px-3 py-2 text-[13px] text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <div aria-busy="true" className="h-[132px] animate-pulse rounded-[14px] bg-surface-sunken" />
      ) : (
        <div className="space-y-5">
          <RatingSummary summary={summary} />

          <PhotoStrip photos={photos} onOpen={(index) => setLightbox({ list: photos, index })} />

          {ordered.length > 0 ? (
            <div className="divide-y divide-hairline overflow-hidden rounded-[14px] bg-surface ring-1 ring-hairline">
              {ordered.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  photos={photosByReview.get(review.id) ?? []}
                  isMine={review.userId === viewerId}
                  canModerate={isAdmin}
                  onEdit={() => setComposer("review")}
                  onDelete={() => void removeReview(review)}
                  onOpenPhoto={(photo) => {
                    const list = photosByReview.get(review.id) ?? [];
                    setLightbox({ list, index: list.findIndex((p) => p.id === photo.id) });
                  }}
                />
              ))}
            </div>
          ) : (
            <p className="rounded-[14px] bg-surface px-5 py-8 text-center text-[15px] text-ink-secondary ring-1 ring-hairline">
              Been here? Be the first to say what it&apos;s like.
            </p>
          )}

          {reviews.length < total && (
            <button
              type="button"
              onClick={() => void loadMore()}
              className="w-full rounded-[12px] bg-surface py-2.5 text-[14px] font-medium text-ink-secondary ring-1 ring-hairline transition-colors hover:text-ink"
            >
              Show more reviews
            </button>
          )}
        </div>
      )}

      {composer && (
        <ReviewComposer
          loungeId={loungeId}
          loungeName={loungeName}
          mode={composer}
          existing={mine}
          onClose={() => setComposer(null)}
          onReviewSaved={onReviewSaved}
          onPhotoUploaded={onPhotoUploaded}
        />
      )}

      <PhotoLightbox
        photos={lightbox?.list ?? []}
        index={lightbox?.index ?? null}
        onIndex={(index) => setLightbox((current) => (current ? { ...current, index } : null))}
        onClose={() => setLightbox(null)}
        canDelete={(photo) => photo.userId === viewerId || isAdmin}
        onDelete={(photo) => void removePhoto(photo)}
      />
    </section>
  );
}

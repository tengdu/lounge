"use client";
/* eslint-disable @next/next/no-img-element -- previews are local blob: URLs */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ImagePlus, LogIn, X } from "lucide-react";
import {
  PHOTOS_PER_REVIEW,
  REVIEW_MAX,
  saveReview,
  uploadPhoto,
  type Photo,
  type Review,
} from "@/lib/community";
import { signInWithGoogle, useAuth } from "@/lib/auth";
import type { ComposerMode } from "@/lib/composer-events";
import { StarPicker } from "@/components/Stars";

interface Picked {
  file: File;
  preview: string;
}

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function ReviewComposer({
  loungeId,
  loungeName,
  mode,
  existing,
  onClose,
  onReviewSaved,
  onPhotoUploaded,
}: {
  loungeId: string;
  loungeName: string;
  /** The sheet is mounted only while open, so the form starts fresh each time. */
  mode: ComposerMode;
  existing: Review | null;
  onClose: () => void;
  onReviewSaved: (review: Review) => void;
  onPhotoUploaded: (photo: Photo) => void;
}) {
  const auth = useAuth();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [body, setBody] = useState(existing?.body ?? "");
  const [visitedOn, setVisitedOn] = useState(existing?.visitedOn ?? "");
  const [picked, setPicked] = useState<Picked[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // <dialog> is only modal (focus trap, Esc, inert page) via showModal().
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  // Previews are blob: URLs that hold the whole file in memory until revoked.
  const clearPicked = useCallback(() => {
    setPicked((current) => {
      current.forEach((p) => URL.revokeObjectURL(p.preview));
      return [];
    });
  }, []);

  const close = useCallback(() => {
    if (busy) return;
    clearPicked();
    onClose();
  }, [busy, clearPicked, onClose]);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    setError(null);
    const room = PHOTOS_PER_REVIEW - picked.length;
    const images = Array.from(files).filter(
      (f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name)
    );
    if (images.length > room) setError(`Up to ${PHOTOS_PER_REVIEW} photos at a time.`);
    setPicked((current) => [
      ...current,
      ...images.slice(0, room).map((file) => ({ file, preview: URL.createObjectURL(file) })),
    ]);
  };

  const removePicked = (index: number) => {
    setPicked((current) => {
      URL.revokeObjectURL(current[index].preview);
      return current.filter((_, i) => i !== index);
    });
  };

  const photosOnly = mode === "photos";
  const canSubmit =
    auth.status === "signed-in" && !busy && (photosOnly ? picked.length > 0 : rating > 0);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (auth.status !== "signed-in" || !canSubmit) return;
    setError(null);

    try {
      let reviewId = existing?.id ?? null;
      if (!photosOnly) {
        setBusy(existing ? "Saving…" : "Posting…");
        const saved = await saveReview(
          loungeId,
          { rating, body, visitedOn: visitedOn || null },
          existing?.id ?? null
        );
        reviewId = saved.id;
        onReviewSaved(saved);
      }

      for (let i = 0; i < picked.length; i++) {
        setBusy(`Uploading photo ${i + 1} of ${picked.length}…`);
        const photo = await uploadPhoto(loungeId, auth.viewer.id, picked[i].file, reviewId);
        onPhotoUploaded(photo);
      }

      setBusy(null);
      clearPicked();
      onClose();
    } catch (e) {
      setBusy(null);
      setError(e instanceof Error ? e.message : "Something went wrong — please try again.");
    }
  };

  const title = photosOnly ? "Add photos" : existing ? "Edit your review" : "Write a review";

  return (
    <dialog
      ref={dialogRef}
      onClose={close}
      onCancel={(e) => {
        if (busy) e.preventDefault();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) close();
      }}
      aria-labelledby="composer-title"
      className="m-auto w-[min(560px,calc(100vw-32px))] rounded-[20px] bg-canvas p-0 text-ink shadow-[0_24px_64px_rgb(0_0_0_/_0.24)] backdrop:bg-black/40 backdrop:backdrop-blur-sm"
    >
      <form onSubmit={submit} className="flex max-h-[min(760px,88vh)] flex-col">
        <header className="flex items-start justify-between gap-4 border-b border-hairline px-6 py-5">
          <div className="min-w-0">
            <h2 id="composer-title" className="text-title text-[20px] text-ink">
              {title}
            </h2>
            <p className="mt-1 truncate text-[13px] text-ink-secondary">{loungeName}</p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="-mr-1.5 -mt-1 shrink-0 rounded-full p-1.5 text-ink-tertiary transition-colors hover:bg-surface-sunken hover:text-ink"
          >
            <X size={18} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </header>

        {auth.status !== "signed-in" ? (
          <div className="px-6 py-10 text-center">
            <p className="text-[15px] text-ink-secondary">
              {auth.status === "loading"
                ? "Checking your sign-in…"
                : "Sign in to rate this lounge and share photos."}
            </p>
            {auth.status === "signed-out" && (
              <button
                type="button"
                onClick={() => void signInWithGoogle()}
                className="mt-5 inline-flex items-center gap-2 rounded-[12px] bg-ink px-5 py-2.5 text-[14px] font-medium text-white transition-opacity hover:opacity-90"
              >
                <LogIn size={15} aria-hidden="true" />
                Continue with Google
              </button>
            )}
            {auth.status === "signed-out" && (
              <p className="mt-4 text-[12px] text-ink-tertiary">
                We get your name, email and profile picture from Google. Only your first name,
                last initial and picture are shown publicly.{" "}
                <Link href="/privacy" className="underline underline-offset-2 hover:text-ink-secondary">
                  Privacy policy
                </Link>
              </p>
            )}
          </div>
        ) : (
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
            {!photosOnly && (
              <>
                <fieldset>
                  <legend className="mb-2 text-[13px] font-medium text-ink">Your rating</legend>
                  <StarPicker value={rating} onChange={setRating} />
                </fieldset>

                <div>
                  <label htmlFor="review-body" className="mb-2 block text-[13px] font-medium text-ink">
                    Your review <span className="font-normal text-ink-tertiary">(optional)</span>
                  </label>
                  <textarea
                    id="review-body"
                    value={body}
                    onChange={(e) => setBody(e.target.value.slice(0, REVIEW_MAX))}
                    rows={5}
                    placeholder="How busy was it? Food, drinks, showers, seating, the view…"
                    className="w-full resize-y rounded-[12px] bg-surface px-3.5 py-3 text-[15px] leading-[1.5] text-ink ring-1 ring-hairline outline-none placeholder:text-ink-tertiary focus:ring-2 focus:ring-accent"
                  />
                  <p className="mt-1 text-right text-[11px] tabular-nums text-ink-tertiary">
                    {body.length} / {REVIEW_MAX}
                  </p>
                </div>

                <div>
                  <label htmlFor="review-visited" className="mb-2 block text-[13px] font-medium text-ink">
                    When did you visit? <span className="font-normal text-ink-tertiary">(optional)</span>
                  </label>
                  <input
                    id="review-visited"
                    type="date"
                    value={visitedOn}
                    max={today()}
                    onChange={(e) => setVisitedOn(e.target.value)}
                    className="rounded-[12px] bg-surface px-3.5 py-2.5 text-[15px] text-ink ring-1 ring-hairline outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </>
            )}

            <div>
              <p className="mb-2 text-[13px] font-medium text-ink">
                Photos{" "}
                {!photosOnly && <span className="font-normal text-ink-tertiary">(optional)</span>}
              </p>
              <ul className="flex flex-wrap gap-2">
                {picked.map((p, i) => (
                  <li key={p.preview} className="relative">
                    <img
                      src={p.preview}
                      alt=""
                      className="h-20 w-20 rounded-[10px] bg-surface-sunken object-cover ring-1 ring-hairline"
                    />
                    <button
                      type="button"
                      onClick={() => removePicked(i)}
                      aria-label="Remove photo"
                      disabled={Boolean(busy)}
                      className="absolute -top-1.5 -right-1.5 rounded-full bg-ink p-0.5 text-white"
                    >
                      <X size={12} strokeWidth={2.5} aria-hidden="true" />
                    </button>
                  </li>
                ))}
                {picked.length < PHOTOS_PER_REVIEW && (
                  <li>
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={Boolean(busy)}
                      className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-[10px] text-[11px] text-ink-tertiary border border-dashed border-hairline-strong transition-colors hover:bg-surface-sunken hover:text-ink"
                    >
                      <ImagePlus size={20} strokeWidth={1.6} aria-hidden="true" />
                      Add
                    </button>
                  </li>
                )}
              </ul>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                tabIndex={-1}
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <p className="mt-2 text-[12px] leading-relaxed text-ink-tertiary">
                Photos appear once they&apos;ve been checked. Location data is removed before upload.
                Please avoid other travellers&apos; faces.
              </p>
            </div>

            {error && (
              <p role="alert" className="rounded-[10px] bg-red-50 px-3 py-2 text-[13px] text-red-700">
                {error}
              </p>
            )}
          </div>
        )}

        {auth.status === "signed-in" && (
          <footer className="flex items-center justify-between gap-4 border-t border-hairline px-6 py-4">
            <p className="min-w-0 truncate text-[12px] text-ink-tertiary">
              {busy ?? `Posting as ${auth.viewer.name}`}
            </p>
            <button
              type="submit"
              disabled={!canSubmit}
              className="shrink-0 rounded-[10px] bg-ink px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {photosOnly ? "Upload" : existing ? "Save" : "Post review"}
            </button>
          </footer>
        )}
      </form>
    </dialog>
  );
}

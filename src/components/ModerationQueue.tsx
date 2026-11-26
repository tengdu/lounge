"use client";
/* eslint-disable @next/next/no-img-element -- Supabase CDN images, see CommunityPhotos */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, LogIn, X } from "lucide-react";
import { fetchPendingPhotos, moderatePhoto, type Photo } from "@/lib/community";
import { signInWithGoogle, useAuth } from "@/lib/auth";
import { communityEnabled } from "@/lib/supabase";

const WHEN = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

/**
 * Pending photos, oldest first. The page is public HTML like every other; it
 * is the database that refuses non-admins, so this only decides what to show.
 */
export default function ModerationQueue({ names }: { names: Record<string, string> }) {
  const auth = useAuth();
  const isAdmin = auth.status === "signed-in" && auth.viewer.isAdmin;

  const [photos, setPhotos] = useState<Photo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    try {
      setPhotos(await fetchPendingPhotos());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The queue could not be loaded.");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-side fetch on a static page
    if (isAdmin) void load();
  }, [isAdmin, load]);

  const decide = async (photo: Photo, decision: "approved" | "rejected") => {
    setWorking((w) => new Set(w).add(photo.id));
    try {
      await moderatePhoto(photo, decision);
      setPhotos((current) => current?.filter((p) => p.id !== photo.id) ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "That did not work — try again.");
    } finally {
      setWorking((w) => {
        const next = new Set(w);
        next.delete(photo.id);
        return next;
      });
    }
  };

  if (!communityEnabled) {
    return <p className="text-ink-secondary">Community features are not configured on this build.</p>;
  }
  if (auth.status === "loading") {
    return <p className="text-ink-secondary">Checking your sign-in…</p>;
  }
  if (auth.status === "signed-out") {
    return (
      <button
        type="button"
        onClick={() => void signInWithGoogle()}
        className="inline-flex items-center gap-2 rounded-[12px] bg-ink px-5 py-2.5 text-[14px] font-medium text-white"
      >
        <LogIn size={15} aria-hidden="true" />
        Sign in with Google
      </button>
    );
  }
  if (!isAdmin) {
    return <p className="text-ink-secondary">This page is for moderators only.</p>;
  }

  return (
    <div>
      {error && (
        <p role="alert" className="mb-4 rounded-[10px] bg-red-50 px-3 py-2 text-[13px] text-red-700">
          {error}
        </p>
      )}

      {photos === null ? (
        <p className="text-ink-secondary">Loading…</p>
      ) : photos.length === 0 ? (
        <p className="rounded-[14px] bg-surface px-5 py-10 text-center text-ink-secondary ring-1 ring-hairline">
          Nothing waiting. 🎉
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => {
            const busy = working.has(photo.id);
            return (
              <li
                key={photo.id}
                className="overflow-hidden rounded-[14px] bg-surface ring-1 ring-hairline"
              >
                <a href={photo.url} target="_blank" rel="noopener noreferrer" className="block">
                  <img
                    src={photo.url}
                    alt=""
                    loading="lazy"
                    className="aspect-[4/3] w-full bg-surface-sunken object-cover"
                  />
                </a>
                <div className="space-y-3 p-4">
                  <div>
                    <Link
                      href={`/lounge/${photo.loungeId}`}
                      className="block truncate text-[14px] font-medium text-ink hover:underline"
                    >
                      {names[photo.loungeId] ?? photo.loungeId}
                    </Link>
                    <p className="text-[12px] text-ink-tertiary">
                      {WHEN.format(new Date(photo.createdAt))} · {photo.width}×{photo.height}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void decide(photo, "approved")}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[10px] bg-emerald-600 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                    >
                      <Check size={14} aria-hidden="true" />
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void decide(photo, "rejected")}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[10px] bg-surface-sunken py-2 text-[13px] font-medium text-ink transition-colors hover:bg-red-50 hover:text-red-700 disabled:opacity-40"
                    >
                      <X size={14} aria-hidden="true" />
                      Reject
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

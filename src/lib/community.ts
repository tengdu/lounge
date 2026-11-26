"use client";

import { PHOTO_BUCKET, photoUrl, supabase } from "@/lib/supabase";
import { resizeImage } from "@/lib/resize-image";

/**
 * Every read and write for reviews, ratings and photos.
 *
 * The browser talks to Supabase directly; what each call may do is decided by
 * the row-level security in supabase/migrations, not here.
 */

export interface Author {
  displayName: string;
  avatarUrl: string | null;
}

export interface Review {
  id: string;
  loungeId: string;
  userId: string;
  rating: number;
  body: string;
  visitedOn: string | null;
  createdAt: string;
  updatedAt: string;
  author: Author;
}

export type PhotoStatus = "pending" | "approved" | "rejected";

export interface Photo {
  id: string;
  loungeId: string;
  userId: string;
  reviewId: string | null;
  url: string;
  thumbUrl: string;
  storagePath: string;
  thumbPath: string;
  width: number;
  height: number;
  caption: string | null;
  status: PhotoStatus;
  createdAt: string;
}

export interface RatingSummary {
  average: number;
  count: number;
  /** Index 0 is one star, index 4 is five. */
  counts: [number, number, number, number, number];
}

export const EMPTY_SUMMARY: RatingSummary = { average: 0, count: 0, counts: [0, 0, 0, 0, 0] };

export const REVIEW_MAX = 2000;
export const PHOTOS_PER_REVIEW = 5;
export const PAGE_SIZE = 10;

function client() {
  const c = supabase();
  if (!c) throw new Error("Reviews are not available on this build.");
  return c;
}

/** Postgres and PostgREST errors are written for developers; soften the usual ones. */
function friendly(error: { message: string; code?: string }): Error {
  if (error.code === "23505") return new Error("You've already reviewed this lounge.");
  if (error.code === "42501" || /row-level security/i.test(error.message)) {
    return new Error("You need to be signed in to do that.");
  }
  if (/JWT|session/i.test(error.message)) return new Error("Your session expired — sign in again.");
  return new Error(error.message);
}

// ─── Mapping ──────────────────────────────────────────────────────────────

interface ReviewRow {
  id: string;
  lounge_id: string;
  user_id: string;
  rating: number;
  body: string;
  visited_on: string | null;
  created_at: string;
  updated_at: string;
  author: { display_name: string; avatar_url: string | null } | null;
}

const REVIEW_COLUMNS =
  "id, lounge_id, user_id, rating, body, visited_on, created_at, updated_at, author:profiles(display_name, avatar_url)";

function toReview(row: ReviewRow): Review {
  return {
    id: row.id,
    loungeId: row.lounge_id,
    userId: row.user_id,
    rating: row.rating,
    body: row.body,
    visitedOn: row.visited_on,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    author: {
      displayName: row.author?.display_name ?? "Traveller",
      avatarUrl: row.author?.avatar_url ?? null,
    },
  };
}

interface PhotoRow {
  id: string;
  lounge_id: string;
  user_id: string;
  review_id: string | null;
  storage_path: string;
  thumb_path: string;
  width: number;
  height: number;
  caption: string | null;
  status: PhotoStatus;
  created_at: string;
}

const PHOTO_COLUMNS =
  "id, lounge_id, user_id, review_id, storage_path, thumb_path, width, height, caption, status, created_at";

function toPhoto(row: PhotoRow): Photo {
  return {
    id: row.id,
    loungeId: row.lounge_id,
    userId: row.user_id,
    reviewId: row.review_id,
    url: photoUrl(row.storage_path),
    thumbUrl: photoUrl(row.thumb_path),
    storagePath: row.storage_path,
    thumbPath: row.thumb_path,
    width: row.width,
    height: row.height,
    caption: row.caption,
    status: row.status,
    createdAt: row.created_at,
  };
}

// ─── Ratings ──────────────────────────────────────────────────────────────

export async function fetchRatingSummary(loungeId: string): Promise<RatingSummary> {
  const { data, error } = await client()
    .from("lounge_ratings")
    .select("avg_rating, review_count, stars_1, stars_2, stars_3, stars_4, stars_5")
    .eq("lounge_id", loungeId)
    .maybeSingle();
  if (error) throw friendly(error);
  if (!data) return EMPTY_SUMMARY;
  return {
    average: data.avg_rating,
    count: data.review_count,
    counts: [data.stars_1, data.stars_2, data.stars_3, data.stars_4, data.stars_5],
  };
}

// ─── Reviews ──────────────────────────────────────────────────────────────

export async function fetchReviews(
  loungeId: string,
  page: number
): Promise<{ reviews: Review[]; total: number }> {
  const from = page * PAGE_SIZE;
  const { data, error, count } = await client()
    .from("reviews")
    .select(REVIEW_COLUMNS, { count: "exact" })
    .eq("lounge_id", loungeId)
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1)
    .overrideTypes<ReviewRow[], { merge: false }>();
  if (error) throw friendly(error);
  return { reviews: (data ?? []).map(toReview), total: count ?? 0 };
}

export async function fetchMyReview(loungeId: string, userId: string): Promise<Review | null> {
  const { data, error } = await client()
    .from("reviews")
    .select(REVIEW_COLUMNS)
    .eq("lounge_id", loungeId)
    .eq("user_id", userId)
    .maybeSingle()
    .overrideTypes<ReviewRow | null, { merge: false }>();
  if (error) throw friendly(error);
  return data ? toReview(data) : null;
}

export interface ReviewDraft {
  rating: number;
  body: string;
  visitedOn: string | null;
}

/**
 * Creates the traveller's review, or edits it if they already have one.
 * Not an upsert: the database only lets rating, body and visit date change on
 * an existing row, and an upsert would try to rewrite the keys too.
 */
export async function saveReview(
  loungeId: string,
  draft: ReviewDraft,
  existingId: string | null
): Promise<Review> {
  const fields = {
    rating: draft.rating,
    body: draft.body.trim(),
    visited_on: draft.visitedOn || null,
  };

  const query = existingId
    ? client().from("reviews").update(fields).eq("id", existingId)
    : client().from("reviews").insert({ lounge_id: loungeId, ...fields });

  const { data, error } = await query
    .select(REVIEW_COLUMNS)
    .single()
    .overrideTypes<ReviewRow, { merge: false }>();
  if (error) throw friendly(error);
  return toReview(data);
}

export async function deleteReview(id: string): Promise<void> {
  const { error } = await client().from("reviews").delete().eq("id", id);
  if (error) throw friendly(error);
}

// ─── Photos ───────────────────────────────────────────────────────────────

/** Approved photos, plus the viewer's own pending ones — RLS decides which. */
export async function fetchPhotos(loungeId: string): Promise<Photo[]> {
  const { data, error } = await client()
    .from("photos")
    .select(PHOTO_COLUMNS)
    .eq("lounge_id", loungeId)
    .neq("status", "rejected")
    .order("created_at", { ascending: false })
    .limit(60)
    .overrideTypes<PhotoRow[], { merge: false }>();
  if (error) throw friendly(error);
  return (data ?? []).map(toPhoto);
}

export async function uploadPhoto(
  loungeId: string,
  userId: string,
  file: File,
  reviewId: string | null
): Promise<Photo> {
  const c = client();
  const [full, thumb] = await Promise.all([resizeImage(file, 1600), resizeImage(file, 480, 0.76)]);

  const id = crypto.randomUUID();
  const ext = (type: string) => (type === "image/webp" ? "webp" : "jpg");
  const storagePath = `${userId}/${id}.${ext(full.type)}`;
  const thumbPath = `${userId}/${id}-thumb.${ext(thumb.type)}`;

  const bucket = c.storage.from(PHOTO_BUCKET);
  const uploads = await Promise.all([
    bucket.upload(storagePath, full.blob, { contentType: full.type, cacheControl: "31536000" }),
    bucket.upload(thumbPath, thumb.blob, { contentType: thumb.type, cacheControl: "31536000" }),
  ]);
  const failed = uploads.find((u) => u.error);
  if (failed?.error) {
    await bucket.remove([storagePath, thumbPath]);
    throw new Error(`Upload failed: ${failed.error.message}`);
  }

  const { data, error } = await c
    .from("photos")
    .insert({
      lounge_id: loungeId,
      review_id: reviewId,
      storage_path: storagePath,
      thumb_path: thumbPath,
      width: full.width,
      height: full.height,
    })
    .select(PHOTO_COLUMNS)
    .single()
    .overrideTypes<PhotoRow, { merge: false }>();

  if (error) {
    // Don't leave an orphaned file eating the storage quota.
    await bucket.remove([storagePath, thumbPath]);
    throw friendly(error);
  }
  return toPhoto(data);
}

export async function deletePhoto(photo: Photo): Promise<void> {
  const c = client();
  const { error } = await c.from("photos").delete().eq("id", photo.id);
  if (error) throw friendly(error);
  await c.storage.from(PHOTO_BUCKET).remove([photo.storagePath, photo.thumbPath]);
}

// ─── Moderation ───────────────────────────────────────────────────────────

export async function fetchPendingPhotos(): Promise<Photo[]> {
  const { data, error } = await client()
    .from("photos")
    .select(PHOTO_COLUMNS)
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(100)
    .overrideTypes<PhotoRow[], { merge: false }>();
  if (error) throw friendly(error);
  return (data ?? []).map(toPhoto);
}

/**
 * Approves a photo, or rejects it and deletes the files so a rejected image is
 * no longer reachable at its public URL.
 */
export async function moderatePhoto(photo: Photo, decision: "approved" | "rejected") {
  const c = client();
  const { error } = await c
    .from("photos")
    .update({ status: decision, moderated_at: new Date().toISOString() })
    .eq("id", photo.id);
  if (error) throw friendly(error);
  if (decision === "rejected") {
    const removed = await c.storage.from(PHOTO_BUCKET).remove([photo.storagePath, photo.thumbPath]);
    if (removed.error) throw new Error(`Rejected, but the file was not deleted: ${removed.error.message}`);
  }
}

# Reviews, ratings and photos — setup

The site is still a static export on GitHub Pages. Reviews and photos live in a
free [Supabase](https://supabase.com) project that the browser talks to
directly. Every rule — who may write, edit or see what — is enforced in
Postgres by row-level security in
[`supabase/migrations/0001_community.sql`](../supabase/migrations/0001_community.sql).

Without the two env vars below, the site builds exactly as before, with no
sign-in and no reviews.

## 1. Create the Supabase project

1. Sign up at supabase.com and create a project (Free plan).
2. **Project Settings → API**: copy the **Project URL** and the
   **anon / publishable** key. Both are meant to be public. Never use the
   `service_role` / secret key in this repo.

## 2. Create the tables, rules and photo bucket

**SQL Editor → New query**, paste the whole of
`supabase/migrations/0001_community.sql`, and run it. You can run it again
safely.

## 3. Google sign-in

1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials),
   go to **Create credentials → OAuth client ID → Web application**.
   - **Authorized JavaScript origins**: `https://tengdu.github.io` and
     `http://localhost:3000`.
   - **Authorized redirect URIs**: `https://<project-ref>.supabase.co/auth/v1/callback`.
     Supabase shows this exact URL on its Google provider page.
   - Set up the OAuth consent screen with the app name, support email and
     privacy policy link. Scopes are the default `email` and `profile` only.
2. In Supabase, go to **Authentication → Sign In / Providers → Google**,
   enable it, and paste the client ID and secret.
3. Under **Authentication → URL Configuration**:
   - **Site URL**: `https://tengdu.github.io/lounge/`
   - **Redirect URLs**: add `https://tengdu.github.io/lounge/**` and
     `http://localhost:3000/lounge/**`.

   Sign-in returns to the page it started from, so these wildcards are needed.

## 4. Point the site at it

Local development: create `.env.local`, which git already ignores:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

GitHub Pages: in **Repo → Settings → Secrets and variables → Actions →
Variables**, add the same two names as repository variables, then re-run the
deploy.

## 5. Make yourself a moderator

Sign in on the site once so your profile row exists. Then run this in the SQL
editor:

```sql
update public.profiles set is_admin = true
where id = (select id from auth.users where email = 'you@example.com');
```

Your avatar menu now shows **Photo queue** (`/lounge/admin`). New photos wait
there until you approve them. Rejecting a photo deletes its file. As an admin
you can also remove any review from its lounge page.

## How it fits together

| What | Where |
| --- | --- |
| Tables `profiles`, `reviews`, `photos`; view `lounge_ratings` | Supabase Postgres |
| Photo files (`<user-id>/<uuid>.webp` + `-thumb.webp`) | Supabase Storage bucket `lounge-photos`, public read |
| Client, auth, queries | `src/lib/supabase.ts`, `src/lib/auth.ts`, `src/lib/community.ts` |
| Browser-side resize + EXIF/GPS stripping | `src/lib/resize-image.ts` |
| UI | `src/components/CommunitySection.tsx` and friends; `src/app/admin/page.tsx` |

**Rules the database enforces:**

- Anyone can read reviews and approved photos.
- You must be signed in to write, and you can only touch your own rows.
- Each person gets one review per lounge.
- New photos are always `pending`, and only a moderator can change their status.
- Uploads must go into your own storage folder.
- Each person can upload at most 30 photos a day.

**Free-tier budget:** 1 GB storage and 5 GB egress a month. Photos are resized
in the browser to about 200 KB full size and about 30 KB thumbnails, and
listings load only thumbnails. That works out to roughly 4,000 photos before
storage is a concern. A free project pauses after a week with no requests; any
visit to a lounge page counts as a request.

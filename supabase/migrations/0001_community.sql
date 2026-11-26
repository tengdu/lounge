-- Community reviews, ratings and photos.
--
-- The site is a static export: the browser talks to Supabase directly with the
-- public anon key, so every rule that matters lives here as row-level security.
-- Nothing in the client is trusted.
--
-- Run once in the Supabase SQL editor (or `supabase db push`). Safe to re-run.

-- ─── Profiles ──────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  avatar_url   text,
  is_admin     boolean not null default false,
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are public" on public.profiles;
create policy "Profiles are public" on public.profiles
  for select using (true);

-- No insert/update policy: profiles are written by the trigger below, and
-- is_admin is set by hand in the SQL editor. A user must never be able to
-- promote themselves.

-- "Teng Du" → "Teng D." — reviews are public, a surname is not needed to
-- trust one.
create or replace function public.short_name(full_name text, email text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    -- Never fall back to the email: it is private, the name is public.
    when coalesce(trim(full_name), '') = '' then 'Traveller'
    when position(' ' in trim(full_name)) = 0 then trim(full_name)
    else split_part(trim(full_name), ' ', 1) || ' ' ||
         upper(left(regexp_replace(trim(full_name), '^.* ', ''), 1)) || '.'
  end
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    public.short_name(
      coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
      new.email
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill anyone who signed up before this migration ran.
insert into public.profiles (id, display_name, avatar_url)
select
  u.id,
  public.short_name(
    coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'),
    u.email
  ),
  u.raw_user_meta_data ->> 'avatar_url'
from auth.users u
on conflict (id) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

-- ─── Reviews ───────────────────────────────────────────────────────────────

create table if not exists public.reviews (
  id         uuid primary key default gen_random_uuid(),
  lounge_id  text not null check (char_length(lounge_id) between 1 and 120),
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  rating     smallint not null check (rating between 1 and 5),
  body       text not null default '' check (char_length(body) <= 2000),
  visited_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- One review per traveller per lounge; a return visit edits it.
  unique (lounge_id, user_id)
);

create index if not exists reviews_lounge_created_idx
  on public.reviews (lounge_id, created_at desc);

alter table public.reviews enable row level security;

drop policy if exists "Reviews are public" on public.reviews;
create policy "Reviews are public" on public.reviews
  for select using (true);

drop policy if exists "Write your own review" on public.reviews;
create policy "Write your own review" on public.reviews
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "Edit your own review" on public.reviews;
create policy "Edit your own review" on public.reviews
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Delete your own review, or moderate" on public.reviews;
create policy "Delete your own review, or moderate" on public.reviews
  for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists reviews_touch on public.reviews;
create trigger reviews_touch
  before update on public.reviews
  for each row execute function public.touch_updated_at();

-- ─── Rating summary ────────────────────────────────────────────────────────

create or replace view public.lounge_ratings
with (security_invoker = on)
as
select
  lounge_id,
  round(avg(rating)::numeric, 2)::float8 as avg_rating,
  count(*)::int                          as review_count,
  count(*) filter (where rating = 1)::int as stars_1,
  count(*) filter (where rating = 2)::int as stars_2,
  count(*) filter (where rating = 3)::int as stars_3,
  count(*) filter (where rating = 4)::int as stars_4,
  count(*) filter (where rating = 5)::int as stars_5
from public.reviews
group by lounge_id;

-- ─── Photos ────────────────────────────────────────────────────────────────

create table if not exists public.photos (
  id           uuid primary key default gen_random_uuid(),
  lounge_id    text not null check (char_length(lounge_id) between 1 and 120),
  user_id      uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  review_id    uuid references public.reviews (id) on delete set null,
  storage_path text not null,
  thumb_path   text not null,
  width        int not null check (width between 1 and 4000),
  height       int not null check (height between 1 and 4000),
  caption      text check (caption is null or char_length(caption) <= 200),
  status       text not null default 'pending'
               check (status in ('pending', 'approved', 'rejected')),
  created_at   timestamptz not null default now(),
  moderated_at timestamptz
);

create index if not exists photos_lounge_idx on public.photos (lounge_id, created_at desc);
create index if not exists photos_pending_idx on public.photos (created_at) where status = 'pending';

alter table public.photos enable row level security;

drop policy if exists "Approved photos are public; yours are visible to you" on public.photos;
create policy "Approved photos are public; yours are visible to you" on public.photos
  for select using (
    status = 'approved' or user_id = auth.uid() or public.is_admin()
  );

-- New photos always start pending, and must point into the uploader's own
-- storage folder — nobody can claim someone else's file or skip the queue.
drop policy if exists "Upload your own photos for review" on public.photos;
create policy "Upload your own photos for review" on public.photos
  for insert to authenticated with check (
    user_id = auth.uid()
    and status = 'pending'
    and moderated_at is null
    and storage_path like auth.uid()::text || '/%'
    and thumb_path   like auth.uid()::text || '/%'
  );

drop policy if exists "Only moderators change photos" on public.photos;
create policy "Only moderators change photos" on public.photos
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Delete your own photos, or moderate" on public.photos;
create policy "Delete your own photos, or moderate" on public.photos
  for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Free-tier storage is 1 GB; a runaway client should not be able to fill it.
create or replace function public.limit_photo_uploads()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.photos
      where user_id = new.user_id and created_at > now() - interval '1 day') >= 30 then
    raise exception 'Daily photo limit reached — try again tomorrow.';
  end if;
  return new;
end;
$$;

drop trigger if exists photos_rate_limit on public.photos;
create trigger photos_rate_limit
  before insert on public.photos
  for each row execute function public.limit_photo_uploads();

-- ─── Grants ────────────────────────────────────────────────────────────────
-- Explicit, so the API surface does not depend on project defaults. Column
-- grants on update stop a user moving their review to another lounge or
-- another author, even within their own rows.

-- Supabase's default privileges grant everything on new public tables to the
-- API roles; start from nothing so the column limits below actually bind.
revoke all on public.profiles, public.reviews, public.photos, public.lounge_ratings
  from anon, authenticated;

grant select on public.profiles, public.reviews, public.photos, public.lounge_ratings
  to anon, authenticated;
grant insert, delete on public.reviews, public.photos to authenticated;
grant update (rating, body, visited_on) on public.reviews to authenticated;
grant update (status, moderated_at) on public.photos to authenticated;

-- Trigger functions fire on their own; nobody needs to call them via /rpc.
-- is_admin() stays callable: the photo policies evaluate it for every caller,
-- and all it reveals is whether you yourself are a moderator.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.limit_photo_uploads() from public, anon, authenticated;

-- ─── Storage ───────────────────────────────────────────────────────────────
-- Public read keeps photos on the CDN with no signed-URL round trip. Paths are
-- `<user id>/<random uuid>.webp`, so a pending photo cannot be guessed, and a
-- rejected one is deleted outright.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('lounge-photos', 'lounge-photos', true, 2097152, array['image/webp', 'image/jpeg'])
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Upload into your own folder" on storage.objects;
create policy "Upload into your own folder" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'lounge-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- The storage API's remove() reads the row before deleting it, so owners and
-- moderators need select as well as delete.
drop policy if exists "See your own files, or moderate" on storage.objects;
create policy "See your own files, or moderate" on storage.objects
  for select to authenticated using (
    bucket_id = 'lounge-photos'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

drop policy if exists "Delete your own files, or moderate" on storage.objects;
create policy "Delete your own files, or moderate" on storage.objects
  for delete to authenticated using (
    bucket_id = 'lounge-photos'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

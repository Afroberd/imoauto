-- IMOAUTO — Fase 2 schema (listings + photos)
-- Apply via Supabase SQL Editor.

create extension if not exists "pgcrypto";

-- Enums
do $$ begin
  create type listing_kind as enum ('property', 'vehicle');
exception when duplicate_object then null; end $$;

do $$ begin
  create type listing_purpose as enum ('sale', 'rent');
exception when duplicate_object then null; end $$;

do $$ begin
  create type listing_status as enum ('draft', 'published', 'sold', 'rented', 'archived');
exception when duplicate_object then null; end $$;

-- Listings
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  kind listing_kind not null,
  purpose listing_purpose not null default 'sale',
  title text not null check (char_length(title) between 3 and 140),
  description text,
  price_cve integer not null check (price_cve >= 0),
  location_island text not null,
  location_city text,
  attributes jsonb not null default '{}'::jsonb,
  status listing_status not null default 'draft',
  cover_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists listings_owner_id_idx on public.listings(owner_id);
create index if not exists listings_kind_idx on public.listings(kind);
create index if not exists listings_status_idx on public.listings(status);
create index if not exists listings_created_at_idx on public.listings(created_at desc);

-- Photos
create table if not exists public.listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  url text not null,
  storage_path text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists listing_photos_listing_id_idx on public.listing_photos(listing_id);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists listings_set_updated_at on public.listings;
create trigger listings_set_updated_at
  before update on public.listings
  for each row execute function public.set_updated_at();

-- RLS
alter table public.listings enable row level security;
alter table public.listing_photos enable row level security;

-- listings policies
drop policy if exists "Public can read published listings" on public.listings;
create policy "Public can read published listings"
  on public.listings for select
  using (status = 'published');

drop policy if exists "Owners can read their own listings" on public.listings;
create policy "Owners can read their own listings"
  on public.listings for select
  to authenticated
  using (owner_id = auth.uid());

drop policy if exists "Authenticated can insert their own listings" on public.listings;
create policy "Authenticated can insert their own listings"
  on public.listings for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "Owners can update their own listings" on public.listings;
create policy "Owners can update their own listings"
  on public.listings for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "Owners can delete their own listings" on public.listings;
create policy "Owners can delete their own listings"
  on public.listings for delete
  to authenticated
  using (owner_id = auth.uid());

-- listing_photos policies
drop policy if exists "Public can read photos of published listings" on public.listing_photos;
create policy "Public can read photos of published listings"
  on public.listing_photos for select
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_photos.listing_id
        and l.status = 'published'
    )
  );

drop policy if exists "Owners can read photos of their own listings" on public.listing_photos;
create policy "Owners can read photos of their own listings"
  on public.listing_photos for select
  to authenticated
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_photos.listing_id
        and l.owner_id = auth.uid()
    )
  );

drop policy if exists "Owners can insert photos to their own listings" on public.listing_photos;
create policy "Owners can insert photos to their own listings"
  on public.listing_photos for insert
  to authenticated
  with check (
    exists (
      select 1 from public.listings l
      where l.id = listing_photos.listing_id
        and l.owner_id = auth.uid()
    )
  );

drop policy if exists "Owners can update photos of their own listings" on public.listing_photos;
create policy "Owners can update photos of their own listings"
  on public.listing_photos for update
  to authenticated
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_photos.listing_id
        and l.owner_id = auth.uid()
    )
  );

drop policy if exists "Owners can delete photos of their own listings" on public.listing_photos;
create policy "Owners can delete photos of their own listings"
  on public.listing_photos for delete
  to authenticated
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_photos.listing_id
        and l.owner_id = auth.uid()
    )
  );

-- Phase 5.1: Favorites (wishlist)
-- Users can save listings they are interested in.

create table public.favorites (
  user_id    uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

-- Index for listing-level queries (e.g. "how many people favorited this?")
create index favorites_listing_id_idx on public.favorites (listing_id);

-- Row-Level Security
alter table public.favorites enable row level security;

create policy "Users can read their own favorites"
  on public.favorites for select
  using (auth.uid() = user_id);

create policy "Users can save favorites"
  on public.favorites for insert
  with check (auth.uid() = user_id);

create policy "Users can remove their own favorites"
  on public.favorites for delete
  using (auth.uid() = user_id);

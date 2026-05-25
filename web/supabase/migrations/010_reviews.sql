-- Phase 5.4: Reviews + denormalised rating aggregates on listings
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.reviews (
  id           uuid        primary key default gen_random_uuid(),
  listing_id   uuid        not null references public.listings(id) on delete cascade,
  reviewer_id  uuid        not null references auth.users(id)      on delete cascade,
  booking_id   uuid        references public.bookings(id) on delete set null,
  rating       int         not null check (rating between 1 and 5),
  body         text,
  created_at   timestamptz not null default now(),
  -- One review per (listing, reviewer) — prevents spam and review bombing.
  unique (listing_id, reviewer_id)
);

create index if not exists reviews_listing_idx on public.reviews (listing_id);

-- Aggregate columns on listings, kept in sync by trigger below.
alter table public.listings
  add column if not exists rating_avg   numeric(3,2),
  add column if not exists rating_count int not null default 0;

create or replace function public.update_listing_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid;
begin
  target := coalesce(new.listing_id, old.listing_id);
  update public.listings
  set
    rating_avg   = (select round(avg(rating)::numeric, 2) from public.reviews where listing_id = target),
    rating_count = (select count(*)                       from public.reviews where listing_id = target)
  where id = target;
  return null;
end;
$$;

drop trigger if exists reviews_update_rating on public.reviews;
create trigger reviews_update_rating
  after insert or update or delete on public.reviews
  for each row execute procedure public.update_listing_rating();

alter table public.reviews enable row level security;

drop policy if exists "Reviews: publicly visible" on public.reviews;
create policy "Reviews: publicly visible"
  on public.reviews for select using (true);

-- A user can only review a listing they:
--   - aren't the owner of
--   - and EITHER had a confirmed booking whose check_out has passed (rent_daily)
--   - OR contacted via a conversation (sale + rent_monthly — looser MVP rule)
-- This avoids blocking sales/rent_monthly users from reviewing entirely.
drop policy if exists "Reviews: eligible users insert" on public.reviews;
create policy "Reviews: eligible users insert"
  on public.reviews for insert
  with check (
    reviewer_id = auth.uid()
    and not exists (
      select 1 from public.listings
      where id = listing_id and owner_id = auth.uid()
    )
    and (
      exists (
        select 1 from public.bookings
        where listing_id = reviews.listing_id
          and guest_id   = auth.uid()
          and status     = 'confirmed'
          and check_out  <= current_date
      )
      or
      exists (
        select 1 from public.conversations
        where listing_id = reviews.listing_id
          and buyer_id   = auth.uid()
      )
    )
  );

drop policy if exists "Reviews: reviewers update" on public.reviews;
create policy "Reviews: reviewers update"
  on public.reviews for update
  using  (reviewer_id = auth.uid())
  with check (reviewer_id = auth.uid());

drop policy if exists "Reviews: reviewers delete" on public.reviews;
create policy "Reviews: reviewers delete"
  on public.reviews for delete
  using (reviewer_id = auth.uid());

-- Backfill aggregates from any existing reviews (no-op on first install).
update public.listings l
set
  rating_avg   = sub.avg_rating,
  rating_count = sub.cnt
from (
  select listing_id, round(avg(rating)::numeric, 2) as avg_rating, count(*) as cnt
  from public.reviews
  group by listing_id
) sub
where l.id = sub.listing_id;

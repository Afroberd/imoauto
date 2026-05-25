-- Phase 5.3: Bookings (rent_daily only)
-- ─────────────────────────────────────────────────────────────────────────────

-- btree_gist needed for the exclusion constraint (uuid + daterange).
create extension if not exists btree_gist;

create table if not exists public.bookings (
  id            uuid        primary key default gen_random_uuid(),
  listing_id    uuid        not null references public.listings(id) on delete cascade,
  guest_id      uuid        not null references auth.users(id)      on delete cascade,
  check_in      date        not null,
  check_out     date        not null,
  guests        int         not null default 1 check (guests > 0),
  -- 'blocked' is a self-block by the owner (no real guest). guest_id == owner in that case.
  status        text        not null default 'pending'
                check (status in ('pending','confirmed','declined','cancelled','blocked')),
  total_cve     int         not null default 0,
  message       text,
  created_at    timestamptz not null default now(),
  check (check_out > check_in)
);

create index if not exists bookings_listing_idx on public.bookings (listing_id);
create index if not exists bookings_guest_idx   on public.bookings (guest_id);
create index if not exists bookings_status_idx  on public.bookings (status);

-- Prevent overlapping pending/confirmed/blocked bookings on the same listing.
-- '[)' = include check_in, exclude check_out (one stay's check_out can equal next stay's check_in).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'bookings_no_overlap'
  ) then
    alter table public.bookings
      add constraint bookings_no_overlap exclude using gist (
        listing_id  with =,
        daterange(check_in, check_out, '[)') with &&
      ) where (status in ('pending','confirmed','blocked'));
  end if;
end $$;

alter table public.bookings enable row level security;

drop policy if exists "Bookings: participants can read" on public.bookings;
create policy "Bookings: participants can read"
  on public.bookings for select
  using (
    auth.uid() = guest_id
    or exists (
      select 1 from public.listings
      where id = listing_id and owner_id = auth.uid()
    )
  );

drop policy if exists "Bookings: guests create" on public.bookings;
create policy "Bookings: guests create"
  on public.bookings for insert
  with check (
    guest_id = auth.uid()
    and status in ('pending','blocked')
    -- For pending: must not be the owner.
    -- For blocked: must be the owner (self-block).
    and (
      (status = 'pending'  and exists (select 1 from public.listings where id = listing_id and owner_id <> auth.uid()))
      or
      (status = 'blocked' and exists (select 1 from public.listings where id = listing_id and owner_id =  auth.uid()))
    )
  );

drop policy if exists "Bookings: participants update" on public.bookings;
create policy "Bookings: participants update"
  on public.bookings for update
  using (
    auth.uid() = guest_id
    or exists (select 1 from public.listings where id = listing_id and owner_id = auth.uid())
  )
  with check (
    auth.uid() = guest_id
    or exists (select 1 from public.listings where id = listing_id and owner_id = auth.uid())
  );

drop policy if exists "Bookings: owners and guests delete" on public.bookings;
create policy "Bookings: owners and guests delete"
  on public.bookings for delete
  using (
    auth.uid() = guest_id
    or exists (select 1 from public.listings where id = listing_id and owner_id = auth.uid())
  );

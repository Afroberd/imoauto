-- ╔════════════════════════════════════════════════════════════════════════════╗
-- ║ IMOAUTO — Fase 5 (Mensagens + Reservas + Avaliações) — IDEMPOTENTE        ║
-- ║ Cola este ficheiro inteiro no SQL editor do Supabase e clica Run.         ║
-- ║ É seguro correr múltiplas vezes — usa IF NOT EXISTS / DROP+CREATE.        ║
-- ╚════════════════════════════════════════════════════════════════════════════╝

-- ════════════════════════════════════════════════════════════════════════════
-- 008: PROFILES + CONVERSATIONS + MESSAGES (Fase 5.2)
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.profiles (
  id           uuid        primary key references auth.users(id) on delete cascade,
  display_name text,
  email        text        not null,
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are publicly visible" on public.profiles;
create policy "Profiles are publicly visible" on public.profiles for select using (true);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();

insert into public.profiles (id, email) select id, email::text from auth.users
  on conflict (id) do nothing;


create table if not exists public.conversations (
  id                uuid        primary key default gen_random_uuid(),
  listing_id        uuid        not null references public.listings(id)  on delete cascade,
  buyer_id          uuid        not null references auth.users(id)        on delete cascade,
  seller_id         uuid        not null references auth.users(id)        on delete cascade,
  last_message_at   timestamptz,
  last_message_body text,
  created_at        timestamptz not null default now(),
  constraint conversations_unique_buyer_listing unique (listing_id, buyer_id)
);

create index if not exists conversations_buyer_idx    on public.conversations (buyer_id);
create index if not exists conversations_seller_idx   on public.conversations (seller_id);
create index if not exists conversations_last_msg_idx on public.conversations (last_message_at desc nulls last);

alter table public.conversations enable row level security;

drop policy if exists "Participants can read conversations" on public.conversations;
create policy "Participants can read conversations" on public.conversations for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

drop policy if exists "Buyers can start conversations" on public.conversations;
create policy "Buyers can start conversations" on public.conversations for insert
  with check (auth.uid() = buyer_id and auth.uid() <> seller_id);

drop policy if exists "Participants can update conversation metadata" on public.conversations;
create policy "Participants can update conversation metadata" on public.conversations for update
  using  (auth.uid() = buyer_id or auth.uid() = seller_id)
  with check (auth.uid() = buyer_id or auth.uid() = seller_id);


create table if not exists public.messages (
  id              uuid        primary key default gen_random_uuid(),
  conversation_id uuid        not null references public.conversations(id) on delete cascade,
  sender_id       uuid        not null references auth.users(id)           on delete cascade,
  body            text        not null check (char_length(body) between 1 and 2000),
  created_at      timestamptz not null default now()
);

create index if not exists messages_conv_time_idx on public.messages (conversation_id, created_at);

alter table public.messages enable row level security;

drop policy if exists "Participants can read messages" on public.messages;
create policy "Participants can read messages" on public.messages for select
  using (exists (select 1 from public.conversations
    where id = conversation_id and (buyer_id = auth.uid() or seller_id = auth.uid())));

drop policy if exists "Participants can send messages" on public.messages;
create policy "Participants can send messages" on public.messages for insert
  with check (sender_id = auth.uid()
    and exists (select 1 from public.conversations
      where id = conversation_id and (buyer_id = auth.uid() or seller_id = auth.uid())));

do $$ begin
  begin
    alter publication supabase_realtime add table public.messages;
  exception when others then null;
  end;
end $$;


-- ════════════════════════════════════════════════════════════════════════════
-- 009: BOOKINGS (Fase 5.3) — só para rent_daily
-- ════════════════════════════════════════════════════════════════════════════

create extension if not exists btree_gist;

create table if not exists public.bookings (
  id            uuid        primary key default gen_random_uuid(),
  listing_id    uuid        not null references public.listings(id) on delete cascade,
  guest_id      uuid        not null references auth.users(id)      on delete cascade,
  check_in      date        not null,
  check_out     date        not null,
  guests        int         not null default 1 check (guests > 0),
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

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'bookings_no_overlap') then
    alter table public.bookings add constraint bookings_no_overlap exclude using gist (
      listing_id with =,
      daterange(check_in, check_out, '[)') with &&
    ) where (status in ('pending','confirmed','blocked'));
  end if;
end $$;

alter table public.bookings enable row level security;

drop policy if exists "Bookings: participants can read" on public.bookings;
create policy "Bookings: participants can read" on public.bookings for select
  using (auth.uid() = guest_id
    or exists (select 1 from public.listings where id = listing_id and owner_id = auth.uid()));

drop policy if exists "Bookings: guests create" on public.bookings;
create policy "Bookings: guests create" on public.bookings for insert
  with check (guest_id = auth.uid() and status in ('pending','blocked')
    and ((status = 'pending'  and exists (select 1 from public.listings where id = listing_id and owner_id <> auth.uid()))
      or (status = 'blocked' and exists (select 1 from public.listings where id = listing_id and owner_id =  auth.uid()))));

drop policy if exists "Bookings: participants update" on public.bookings;
create policy "Bookings: participants update" on public.bookings for update
  using (auth.uid() = guest_id
    or exists (select 1 from public.listings where id = listing_id and owner_id = auth.uid()))
  with check (auth.uid() = guest_id
    or exists (select 1 from public.listings where id = listing_id and owner_id = auth.uid()));

drop policy if exists "Bookings: owners and guests delete" on public.bookings;
create policy "Bookings: owners and guests delete" on public.bookings for delete
  using (auth.uid() = guest_id
    or exists (select 1 from public.listings where id = listing_id and owner_id = auth.uid()));


-- ════════════════════════════════════════════════════════════════════════════
-- 010: REVIEWS + AGREGADOS NO LISTINGS (Fase 5.4)
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.reviews (
  id           uuid        primary key default gen_random_uuid(),
  listing_id   uuid        not null references public.listings(id) on delete cascade,
  reviewer_id  uuid        not null references auth.users(id)      on delete cascade,
  booking_id   uuid        references public.bookings(id) on delete set null,
  rating       int         not null check (rating between 1 and 5),
  body         text,
  created_at   timestamptz not null default now(),
  unique (listing_id, reviewer_id)
);

create index if not exists reviews_listing_idx on public.reviews (listing_id);

alter table public.listings
  add column if not exists rating_avg   numeric(3,2),
  add column if not exists rating_count int not null default 0;

create or replace function public.update_listing_rating()
returns trigger language plpgsql security definer set search_path = public as $$
declare target uuid;
begin
  target := coalesce(new.listing_id, old.listing_id);
  update public.listings set
    rating_avg   = (select round(avg(rating)::numeric, 2) from public.reviews where listing_id = target),
    rating_count = (select count(*) from public.reviews where listing_id = target)
  where id = target;
  return null;
end;
$$;

drop trigger if exists reviews_update_rating on public.reviews;
create trigger reviews_update_rating after insert or update or delete on public.reviews
  for each row execute procedure public.update_listing_rating();

alter table public.reviews enable row level security;

drop policy if exists "Reviews: publicly visible" on public.reviews;
create policy "Reviews: publicly visible" on public.reviews for select using (true);

drop policy if exists "Reviews: eligible users insert" on public.reviews;
create policy "Reviews: eligible users insert" on public.reviews for insert
  with check (reviewer_id = auth.uid()
    and not exists (select 1 from public.listings where id = listing_id and owner_id = auth.uid())
    and (exists (select 1 from public.bookings
      where listing_id = reviews.listing_id and guest_id = auth.uid()
        and status = 'confirmed' and check_out <= current_date)
      or exists (select 1 from public.conversations
        where listing_id = reviews.listing_id and buyer_id = auth.uid())));

drop policy if exists "Reviews: reviewers update" on public.reviews;
create policy "Reviews: reviewers update" on public.reviews for update
  using (reviewer_id = auth.uid()) with check (reviewer_id = auth.uid());

drop policy if exists "Reviews: reviewers delete" on public.reviews;
create policy "Reviews: reviewers delete" on public.reviews for delete
  using (reviewer_id = auth.uid());

update public.listings l set
  rating_avg = sub.avg_rating, rating_count = sub.cnt
from (select listing_id, round(avg(rating)::numeric, 2) as avg_rating, count(*) as cnt
      from public.reviews group by listing_id) sub
where l.id = sub.listing_id;

-- ════════════════════════════════════════════════════════════════════════════
-- FIM. Devias ver "Success. No rows returned" no painel Results.
-- ════════════════════════════════════════════════════════════════════════════

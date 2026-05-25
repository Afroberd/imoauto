-- Phase 5.2: Profiles, Conversations, Messages
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Profiles ─────────────────────────────────────────────────────────────────
-- Public shadow of auth.users so conversation lists can show user info.

create table public.profiles (
  id           uuid        primary key references auth.users(id) on delete cascade,
  display_name text,
  email        text        not null,
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are publicly visible"
  on public.profiles for select using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  using  (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create a profile whenever someone registers.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = public as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Backfill any existing users.
insert into public.profiles (id, email)
select id, email::text from auth.users
on conflict (id) do nothing;


-- ── Conversations ────────────────────────────────────────────────────────────
-- One row per (listing, buyer) pair.
-- seller_id is denormalised from listings.owner_id at creation time so that
-- inbox queries don't need to join listings just to filter participants.

create table public.conversations (
  id                uuid        primary key default gen_random_uuid(),
  listing_id        uuid        not null references public.listings(id)  on delete cascade,
  buyer_id          uuid        not null references auth.users(id)        on delete cascade,
  seller_id         uuid        not null references auth.users(id)        on delete cascade,
  -- Denormalised snapshot updated by the sendMessage server action.
  last_message_at   timestamptz,
  last_message_body text,
  created_at        timestamptz not null default now(),
  constraint conversations_unique_buyer_listing unique (listing_id, buyer_id)
);

create index conversations_buyer_idx    on public.conversations (buyer_id);
create index conversations_seller_idx   on public.conversations (seller_id);
create index conversations_last_msg_idx on public.conversations (last_message_at desc nulls last);

alter table public.conversations enable row level security;

create policy "Participants can read conversations"
  on public.conversations for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "Buyers can start conversations"
  on public.conversations for insert
  with check (auth.uid() = buyer_id and auth.uid() <> seller_id);

create policy "Participants can update conversation metadata"
  on public.conversations for update
  using  (auth.uid() = buyer_id or auth.uid() = seller_id)
  with check (auth.uid() = buyer_id or auth.uid() = seller_id);


-- ── Messages ─────────────────────────────────────────────────────────────────

create table public.messages (
  id              uuid        primary key default gen_random_uuid(),
  conversation_id uuid        not null references public.conversations(id) on delete cascade,
  sender_id       uuid        not null references auth.users(id)           on delete cascade,
  body            text        not null check (char_length(body) between 1 and 2000),
  created_at      timestamptz not null default now()
);

create index messages_conv_time_idx on public.messages (conversation_id, created_at);

alter table public.messages enable row level security;

create policy "Participants can read messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations
      where id = conversation_id
        and (buyer_id = auth.uid() or seller_id = auth.uid())
    )
  );

create policy "Participants can send messages"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations
      where id = conversation_id
        and (buyer_id = auth.uid() or seller_id = auth.uid())
    )
  );


-- ── Realtime ─────────────────────────────────────────────────────────────────
-- Enable postgres_changes events on the messages table so clients receive
-- new messages via the Supabase Realtime websocket.
do $$
begin
  begin
    alter publication supabase_realtime add table public.messages;
  exception when others then
    null; -- publication may not exist yet in some environments; ignore
  end;
end $$;

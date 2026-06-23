-- ╔════════════════════════════════════════════════════════════════════════════╗
-- ║ IMOAUTO — Favoritos (recriar) + Notificações                              ║
-- ║ Idempotente. Cola no SQL editor do Supabase e clica Run.                  ║
-- ╚════════════════════════════════════════════════════════════════════════════╝

-- ════════════════════════════════════════════════════════════════════════════
-- 1) FAVORITES — a tabela perdeu-se; recriar (migration 007 original)
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.favorites (
  user_id    uuid        not null references auth.users(id)        on delete cascade,
  listing_id uuid        not null references public.listings(id)   on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create index if not exists favorites_listing_idx on public.favorites (listing_id);

alter table public.favorites enable row level security;

drop policy if exists "Favorites: own read" on public.favorites;
create policy "Favorites: own read"
  on public.favorites for select using (auth.uid() = user_id);

drop policy if exists "Favorites: own insert" on public.favorites;
create policy "Favorites: own insert"
  on public.favorites for insert with check (auth.uid() = user_id);

drop policy if exists "Favorites: own delete" on public.favorites;
create policy "Favorites: own delete"
  on public.favorites for delete using (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════════════════════
-- 2) NOTIFICATIONS — tabela central de notificações por utilizador
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.notifications (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  type       text        not null,   -- message | booking_request | booking_update | review
  title      text        not null,
  body       text,
  link       text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx   on public.notifications (user_id, created_at desc);
create index if not exists notifications_unread_idx on public.notifications (user_id) where read_at is null;

alter table public.notifications enable row level security;

-- Users only ever see and update (mark-read) their own notifications.
drop policy if exists "Notifications: own read" on public.notifications;
create policy "Notifications: own read"
  on public.notifications for select using (auth.uid() = user_id);

drop policy if exists "Notifications: own update" on public.notifications;
create policy "Notifications: own update"
  on public.notifications for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Inserts are done by SECURITY DEFINER triggers below (which bypass RLS), so
-- there is intentionally NO insert policy for end users.

-- ── Trigger helpers ──────────────────────────────────────────────────────────

-- New message → notify the OTHER participant of the conversation.
create or replace function public.notify_new_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  conv record;
  recipient uuid;
  listing_title text;
begin
  select * into conv from public.conversations where id = new.conversation_id;
  if conv is null then return new; end if;
  if conv.buyer_id = new.sender_id then recipient := conv.seller_id; else recipient := conv.buyer_id; end if;
  select title into listing_title from public.listings where id = conv.listing_id;
  insert into public.notifications (user_id, type, title, body, link)
  values (recipient, 'message', 'Nova mensagem', coalesce(listing_title, 'Anúncio'),
          '/messages/' || conv.id);
  return new;
end;
$$;
drop trigger if exists on_new_message_notify on public.messages;
create trigger on_new_message_notify
  after insert on public.messages
  for each row execute procedure public.notify_new_message();

-- New booking (pending or instant-confirmed) → notify the listing owner.
create or replace function public.notify_new_booking()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  owner uuid;
  listing_title text;
begin
  if new.status = 'blocked' then return new; end if; -- owner self-block, no notif
  select owner_id, title into owner, listing_title from public.listings where id = new.listing_id;
  if owner is null then return new; end if;
  insert into public.notifications (user_id, type, title, body, link)
  values (owner, 'booking_request', 'Novo pedido de reserva',
          coalesce(listing_title, 'Anúncio'), '/dashboard/requests');
  return new;
end;
$$;
drop trigger if exists on_new_booking_notify on public.bookings;
create trigger on_new_booking_notify
  after insert on public.bookings
  for each row execute procedure public.notify_new_booking();

-- Booking status change → notify the guest.
create or replace function public.notify_booking_status()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  listing_title text;
  msg text;
begin
  if new.status = old.status then return new; end if;
  select title into listing_title from public.listings where id = new.listing_id;
  if    new.status = 'confirmed'   then msg := 'Reserva aceite — paga já';
  elsif new.status = 'paid'        then msg := 'Pagamento confirmado';
  elsif new.status = 'declined'    then msg := 'Reserva recusada';
  elsif new.status = 'in_progress' then msg := 'Check-in registado';
  elsif new.status = 'completed'   then msg := 'Estadia concluída';
  elsif new.status = 'cancelled'   then msg := 'Reserva cancelada';
  else return new; end if;
  insert into public.notifications (user_id, type, title, body, link)
  values (new.guest_id, 'booking_update', msg,
          coalesce(listing_title, 'Anúncio'), '/dashboard/reservas');
  return new;
end;
$$;
drop trigger if exists on_booking_status_notify on public.bookings;
create trigger on_booking_status_notify
  after update on public.bookings
  for each row execute procedure public.notify_booking_status();

-- New review → notify the listing owner.
create or replace function public.notify_new_review()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  owner uuid;
  listing_title text;
begin
  select owner_id, title into owner, listing_title from public.listings where id = new.listing_id;
  if owner is null then return new; end if;
  insert into public.notifications (user_id, type, title, body, link)
  values (owner, 'review', 'Nova avaliação',
          coalesce(listing_title, 'Anúncio'), '/listings/' || new.listing_id);
  return new;
end;
$$;
drop trigger if exists on_new_review_notify on public.reviews;
create trigger on_new_review_notify
  after insert on public.reviews
  for each row execute procedure public.notify_new_review();

-- Realtime: push new notifications to the bell live.
do $$
begin
  begin
    alter publication supabase_realtime add table public.notifications;
  exception when others then null;
  end;
end $$;

-- ════════════════════════════════════════════════════════════════════════════
-- FIM. Devias ver "Success. No rows returned".
-- ════════════════════════════════════════════════════════════════════════════

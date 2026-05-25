-- ╔════════════════════════════════════════════════════════════════════════════╗
-- ║ IMOAUTO — Fase 6.1: Plataforma de reservas completa                       ║
-- ║                                                                            ║
-- ║ • Extensão de bookings: ciclo de vida 8 estados + payment_status +        ║
-- ║   campos para entrega/devolução de carros (KM, combustível, danos)        ║
-- ║ • payments: trilho de auditoria (manual hoje, Stripe/Vinti4 amanhã)       ║
-- ║ • guest_verifications: BI/passaporte + carta de condução                  ║
-- ║ • listings: instant_booking, require_verification, payout_iban etc.       ║
-- ║ • Storage bucket 'verifications' (privado, owner-only)                    ║
-- ╚════════════════════════════════════════════════════════════════════════════╝

-- ════════════════════════════════════════════════════════════════════════════
-- 1) BOOKINGS — extensões para ciclo de vida completo + campos de carros
-- ════════════════════════════════════════════════════════════════════════════

alter table public.bookings
  add column if not exists payment_status    text        not null default 'unpaid'
    check (payment_status in ('unpaid','partial','paid','refunded')),
  add column if not exists paid_at           timestamptz,
  add column if not exists paid_amount_cve   int         not null default 0,
  add column if not exists checked_in_at     timestamptz,
  add column if not exists checked_out_at    timestamptz,
  add column if not exists status_changed_at timestamptz not null default now(),
  -- Para carros (rent_daily vehicles)
  add column if not exists pickup_km         int,
  add column if not exists return_km         int,
  add column if not exists pickup_fuel       int check (pickup_fuel between 0 and 100),
  add column if not exists return_fuel       int check (return_fuel between 0 and 100),
  add column if not exists pickup_notes      text,
  add column if not exists return_notes      text,
  add column if not exists damage_notes      text;

-- Estados novos: paid (pago, à espera da data check-in) | in_progress (em curso) | completed (concluído)
alter table public.bookings drop constraint if exists bookings_status_check;
alter table public.bookings add constraint bookings_status_check
  check (status in ('pending','confirmed','paid','in_progress','completed','declined','cancelled','blocked'));

-- Atualiza a exclusion constraint para incluir os estados novos que bloqueiam datas
alter table public.bookings drop constraint if exists bookings_no_overlap;
alter table public.bookings add constraint bookings_no_overlap exclude using gist (
  listing_id with =,
  daterange(check_in, check_out, '[)') with &&
) where (status in ('pending','confirmed','paid','in_progress','blocked'));

-- ════════════════════════════════════════════════════════════════════════════
-- 2) PAYMENTS — trilho de auditoria de pagamentos
--    Funciona já para manual_transfer/cash; pronto para stripe/vinti4
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.payments (
  id           uuid        primary key default gen_random_uuid(),
  booking_id   uuid        not null references public.bookings(id) on delete cascade,
  amount_cve   int         not null check (amount_cve > 0),
  method       text        not null check (method in ('manual_transfer','cash','vinti4','stripe','other')),
  reference    text,
  notes        text,
  recorded_by  uuid        references auth.users(id),
  paid_at      timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

create index if not exists payments_booking_idx on public.payments (booking_id);

alter table public.payments enable row level security;

drop policy if exists "Payments: participants read" on public.payments;
create policy "Payments: participants read" on public.payments for select using (
  exists (
    select 1 from public.bookings b
    join public.listings l on l.id = b.listing_id
    where b.id = booking_id
      and (b.guest_id = auth.uid() or l.owner_id = auth.uid())
  )
);

drop policy if exists "Payments: host inserts" on public.payments;
create policy "Payments: host inserts" on public.payments for insert with check (
  exists (
    select 1 from public.bookings b
    join public.listings l on l.id = b.listing_id
    where b.id = booking_id
      and l.owner_id = auth.uid()
  )
);

-- Trigger: quando inserimos um pagamento, atualizamos o agregado na booking
-- e, se total pago >= total devido, avançamos status confirmed -> paid
create or replace function public.handle_payment_recorded()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  total_paid int;
  bk record;
begin
  select * into bk from public.bookings where id = new.booking_id;
  select coalesce(sum(amount_cve), 0) into total_paid from public.payments where booking_id = new.booking_id;

  update public.bookings
  set paid_amount_cve = total_paid,
      payment_status = case
        when total_paid <= 0           then 'unpaid'
        when total_paid < bk.total_cve then 'partial'
        else 'paid'
      end,
      paid_at = case when total_paid >= bk.total_cve and paid_at is null then now() else paid_at end,
      status = case
        when total_paid >= bk.total_cve and status = 'confirmed' then 'paid'
        else status
      end,
      status_changed_at = case
        when total_paid >= bk.total_cve and status = 'confirmed' then now()
        else status_changed_at
      end
  where id = new.booking_id;

  return new;
end;
$$;

drop trigger if exists payments_after_insert on public.payments;
create trigger payments_after_insert
  after insert on public.payments
  for each row execute procedure public.handle_payment_recorded();

-- ════════════════════════════════════════════════════════════════════════════
-- 3) GUEST_VERIFICATIONS — BI / Passaporte / Carta de condução
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.guest_verifications (
  user_id                   uuid        primary key references auth.users(id) on delete cascade,
  id_type                   text        check (id_type in ('bi','passport')),
  id_number                 text,
  id_photo_url              text,
  driver_license_number     text,
  driver_license_photo_url  text,
  phone                     text,
  verified_at               timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

alter table public.guest_verifications enable row level security;

drop policy if exists "Verifications: own and hosts read" on public.guest_verifications;
create policy "Verifications: own and hosts read" on public.guest_verifications for select using (
  auth.uid() = user_id
  or exists (
    select 1 from public.bookings b
    join public.listings l on l.id = b.listing_id
    where b.guest_id = user_id
      and l.owner_id = auth.uid()
      and b.status in ('confirmed','paid','in_progress','completed')
  )
);

drop policy if exists "Verifications: own insert" on public.guest_verifications;
create policy "Verifications: own insert" on public.guest_verifications for insert
  with check (auth.uid() = user_id);

drop policy if exists "Verifications: own update" on public.guest_verifications;
create policy "Verifications: own update" on public.guest_verifications for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════════════════════
-- 4) LISTINGS — settings de anfitrião (instant_booking, payout info)
-- ════════════════════════════════════════════════════════════════════════════

alter table public.listings
  add column if not exists instant_booking       boolean not null default false,
  add column if not exists require_verification  boolean not null default true,
  add column if not exists payment_window_hours  int     not null default 24,
  add column if not exists payout_iban           text,
  add column if not exists payout_holder_name    text,
  add column if not exists payout_instructions   text;

-- ════════════════════════════════════════════════════════════════════════════
-- 5) STORAGE BUCKET 'verifications' — privado, only owner sees their own files
-- ════════════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'verifications',
  'verifications',
  false,
  5242880, -- 5 MB
  array['image/jpeg','image/png','image/webp','application/pdf']
) on conflict (id) do nothing;

drop policy if exists "Verifications: owner read" on storage.objects;
create policy "Verifications: owner read" on storage.objects for select using (
  bucket_id = 'verifications'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Verifications: owner insert" on storage.objects;
create policy "Verifications: owner insert" on storage.objects for insert with check (
  bucket_id = 'verifications'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Verifications: owner update" on storage.objects;
create policy "Verifications: owner update" on storage.objects for update using (
  bucket_id = 'verifications'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Verifications: owner delete" on storage.objects;
create policy "Verifications: owner delete" on storage.objects for delete using (
  bucket_id = 'verifications'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- ════════════════════════════════════════════════════════════════════════════
-- 6) HELPER FUNCTION — calcula estado em tempo real de um anúncio
--    livre | reservado | ocupado | bloqueado
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public.listing_state_today(p_listing_id uuid)
returns text language sql stable as $$
  select case
    when exists (select 1 from public.bookings
      where listing_id = p_listing_id and status = 'in_progress'
        and current_date >= check_in and current_date < check_out) then 'ocupado'
    when exists (select 1 from public.bookings
      where listing_id = p_listing_id and status = 'blocked'
        and current_date >= check_in and current_date < check_out) then 'bloqueado'
    when exists (select 1 from public.bookings
      where listing_id = p_listing_id and status in ('paid','confirmed')
        and check_in >= current_date) then 'reservado'
    else 'livre'
  end;
$$;

-- ════════════════════════════════════════════════════════════════════════════
-- FIM. Devias ver "Success. No rows returned" no painel Results.
-- ════════════════════════════════════════════════════════════════════════════

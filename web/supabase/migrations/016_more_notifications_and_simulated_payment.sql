-- ╔════════════════════════════════════════════════════════════════════════════╗
-- ║ IMOAUTO — 016: Mais notificações (=emails) + pagamento SIMULADO           ║
-- ║ • Boas-vindas ao criar conta (email/sino via pipeline existente)          ║
-- ║ • "Pedido de reserva enviado" ao hóspede                                  ║
-- ║ • "Pagamento recebido" ao proprietário                                    ║
-- ║ • record_simulated_payment(): hóspede paga a própria reserva confirmada    ║
-- ║   (modo teste — Vinti4 real substitui isto depois). Idempotente.          ║
-- ╚════════════════════════════════════════════════════════════════════════════╝

-- 1) Boas-vindas (dispara também o email, via webhook de notifications)
create or replace function public.notify_welcome()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, type, title, body, link)
  values (new.id, 'welcome', 'Bem-vindo ao IMOAUTO 👋',
          'A tua conta está criada. Explora os anúncios ou publica o teu — é grátis.',
          '/listings');
  return new;
end;
$$;
drop trigger if exists on_auth_user_created_welcome on auth.users;
create trigger on_auth_user_created_welcome
  after insert on auth.users
  for each row execute procedure public.notify_welcome();

-- 2) Hóspede: confirmação de que o pedido foi enviado
create or replace function public.notify_booking_created_guest()
returns trigger language plpgsql security definer set search_path = public as $$
declare listing_title text;
begin
  if new.status = 'blocked' then return new; end if;
  select title into listing_title from public.listings where id = new.listing_id;
  insert into public.notifications (user_id, type, title, body, link)
  values (new.guest_id, 'booking_sent', 'Pedido de reserva enviado',
          coalesce(listing_title, 'Anúncio'), '/dashboard/reservas');
  return new;
end;
$$;
drop trigger if exists on_new_booking_notify_guest on public.bookings;
create trigger on_new_booking_notify_guest
  after insert on public.bookings
  for each row execute procedure public.notify_booking_created_guest();

-- 3) Proprietário: pagamento recebido
create or replace function public.notify_payment_owner()
returns trigger language plpgsql security definer set search_path = public as $$
declare o uuid; listing_title text;
begin
  select l.owner_id, l.title into o, listing_title
    from public.bookings b join public.listings l on l.id = b.listing_id
   where b.id = new.booking_id;
  if o is null then return new; end if;
  insert into public.notifications (user_id, type, title, body, link)
  values (o, 'payment', 'Pagamento recebido: ' || new.amount_cve || ' CVE',
          coalesce(listing_title, 'Anúncio'), '/dashboard/payments');
  return new;
end;
$$;
drop trigger if exists on_payment_notify_owner on public.payments;
create trigger on_payment_notify_owner
  after insert on public.payments
  for each row execute procedure public.notify_payment_owner();

-- 4) Pagamento SIMULADO — o hóspede "paga" a própria reserva confirmada.
--    SECURITY DEFINER contorna a RLS de payments (que só deixa o anfitrião
--    inserir), com guardas: só o hóspede da reserva, só status 'confirmed'.
create or replace function public.record_simulated_payment(p_booking_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare b record;
begin
  select * into b from public.bookings where id = p_booking_id;
  if b is null then raise exception 'booking_not_found'; end if;
  if b.guest_id <> auth.uid() then raise exception 'forbidden'; end if;
  if b.status <> 'confirmed' then raise exception 'not_payable'; end if;
  insert into public.payments (booking_id, amount_cve, method, reference, notes, recorded_by)
  values (p_booking_id,
          b.total_cve - coalesce(b.paid_amount_cve, 0),
          'vinti4',
          'SIM-' || substr(md5(random()::text), 1, 8),
          'Pagamento SIMULADO (modo teste — sem cobrança real)',
          auth.uid());
end;
$$;

-- FIM. "Success. No rows returned".

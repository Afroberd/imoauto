-- ╔════════════════════════════════════════════════════════════════════════════╗
-- ║ IMOAUTO — Comissão de serviço (10%, lado do anfitrião) nas reservas       ║
-- ║ Guardada por reserva no momento da criação (mudar a taxa no futuro não    ║
-- ║ reescreve reservas antigas). Idempotente.                                  ║
-- ╚════════════════════════════════════════════════════════════════════════════╝

alter table public.bookings
  add column if not exists commission_rate  numeric(4,2) not null default 0.10,
  add column if not exists commission_cve   int          not null default 0,
  add column if not exists host_payout_cve  int          not null default 0;

-- Backfill: reservas existentes (exceto bloqueios) passam a ter comissão 10%.
update public.bookings
   set commission_cve  = round(total_cve * 0.10),
       host_payout_cve = total_cve - round(total_cve * 0.10)
 where status <> 'blocked'
   and total_cve > 0
   and host_payout_cve = 0;

-- FIM. Devias ver "Success. No rows returned".

-- ╔════════════════════════════════════════════════════════════════════════════╗
-- ║ IMOAUTO — Fase 6.2: Painel admin de verificações de identidade            ║
-- ║                                                                            ║
-- ║ • admins: lista de utilizadores com acesso ao painel admin                ║
-- ║ • is_admin(): helper usado nas policies                                    ║
-- ║ • guest_verifications: fila de revisão (status pending/approved/rejected) ║
-- ║ • RLS: admins leem/atualizam todas as verificações + leem os ficheiros    ║
-- ║                                                                            ║
-- ║ Idempotente — podes correr várias vezes sem problema.                     ║
-- ╚════════════════════════════════════════════════════════════════════════════╝

-- ════════════════════════════════════════════════════════════════════════════
-- 1) ADMINS — quem tem acesso ao painel /admin
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.admins (
  user_id    uuid        primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- Cada utilizador só consegue ver a sua própria linha (para saber se é admin).
-- A gestão de admins faz-se por SQL (abaixo), nunca pela API pública.
drop policy if exists "Admins: self read" on public.admins;
create policy "Admins: self read" on public.admins for select
  using (auth.uid() = user_id);

-- Helper: é o utilizador (uid) um admin? SECURITY DEFINER para não recorrer à
-- RLS da própria tabela admins (evita recursão nas policies que o chamam).
create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins a where a.user_id = uid);
$$;

-- ════════════════════════════════════════════════════════════════════════════
-- 2) GUEST_VERIFICATIONS — fila de revisão
-- ════════════════════════════════════════════════════════════════════════════

alter table public.guest_verifications
  add column if not exists status           text not null default 'pending'
    check (status in ('pending','approved','rejected')),
  add column if not exists rejection_reason text,
  add column if not exists reviewed_by      uuid references auth.users(id),
  add column if not exists reviewed_at       timestamptz;

-- Backfill: quem já tinha verified_at (auto-aprovado no MVP antigo) conta como aprovado.
update public.guest_verifications
  set status = 'approved'
  where verified_at is not null and status <> 'approved';

-- Admins leem todas as verificações (soma-se às policies existentes: próprio + anfitrião).
drop policy if exists "Verifications: admin read" on public.guest_verifications;
create policy "Verifications: admin read" on public.guest_verifications for select
  using (public.is_admin());

-- Admins atualizam (aprovar/rejeitar) qualquer verificação.
drop policy if exists "Verifications: admin update" on public.guest_verifications;
create policy "Verifications: admin update" on public.guest_verifications for update
  using (public.is_admin()) with check (public.is_admin());

-- ════════════════════════════════════════════════════════════════════════════
-- 3) STORAGE — admins veem os ficheiros do bucket privado 'verifications'
--    (necessário para gerar signed URLs das fotos de BI/carta no painel)
-- ════════════════════════════════════════════════════════════════════════════

drop policy if exists "Verifications: admin read files" on storage.objects;
create policy "Verifications: admin read files" on storage.objects for select using (
  bucket_id = 'verifications' and public.is_admin()
);

-- ════════════════════════════════════════════════════════════════════════════
-- 4) SEED — torna-te admin
--    ⚠️ Troca o email abaixo pelo email com que entras no IMOAUTO, se for outro.
-- ════════════════════════════════════════════════════════════════════════════

insert into public.admins (user_id)
  select id from auth.users where email = 'afroberd@gmail.com'
  on conflict (user_id) do nothing;

-- ════════════════════════════════════════════════════════════════════════════
-- FIM. Devias ver "Success. No rows returned" no painel Results.
-- Para adicionar outro admin mais tarde:
--   insert into public.admins (user_id)
--     select id from auth.users where email = 'OUTRO@EMAIL.com'
--     on conflict (user_id) do nothing;
-- ════════════════════════════════════════════════════════════════════════════

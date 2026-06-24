-- ╔════════════════════════════════════════════════════════════════════════════╗
-- ║ IMOAUTO — Notificações da verificação de identidade                       ║
-- ║                                                                            ║
-- ║ • Submeteu verificação (fica 'pending')  → notifica TODOS os admins        ║
-- ║ • Verificação aprovada                    → notifica o utilizador          ║
-- ║ • Verificação rejeitada                   → notifica o utilizador + motivo  ║
-- ║                                                                            ║
-- ║ Segue o padrão dos triggers da migração 012 (SECURITY DEFINER, sem RLS).   ║
-- ║ Idempotente — podes correr várias vezes. Precisa da migração 013 aplicada. ║
-- ╚════════════════════════════════════════════════════════════════════════════╝

create or replace function public.notify_verification()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  submitter_label text;
  admin_row       record;
begin
  -- 1) Entrou (ou voltou) a 'pending' → avisar todos os admins para reverem.
  if new.status = 'pending'
     and (tg_op = 'INSERT' or old.status is distinct from 'pending') then
    select coalesce(display_name, email) into submitter_label
      from public.profiles where id = new.user_id;
    for admin_row in select user_id from public.admins loop
      insert into public.notifications (user_id, type, title, body, link)
      values (admin_row.user_id, 'verification_review',
              'Nova verificação para rever',
              coalesce(submitter_label, 'Um utilizador'),
              '/admin/verificacoes');
    end loop;
  end if;

  -- 2) Aprovada → avisar o utilizador.
  if tg_op = 'UPDATE' and new.status = 'approved'
     and old.status is distinct from 'approved' then
    insert into public.notifications (user_id, type, title, body, link)
    values (new.user_id, 'verification', 'Identidade verificada ✓',
            'Já podes publicar e reservar aluguer diário.', '/verificacao');
  end if;

  -- 3) Rejeitada → avisar o utilizador (com o motivo).
  if tg_op = 'UPDATE' and new.status = 'rejected'
     and old.status is distinct from 'rejected' then
    insert into public.notifications (user_id, type, title, body, link)
    values (new.user_id, 'verification', 'Verificação rejeitada',
            coalesce(new.rejection_reason, 'Reenvia o documento para nova análise.'),
            '/verificacao');
  end if;

  return new;
end;
$$;

drop trigger if exists on_verification_notify on public.guest_verifications;
create trigger on_verification_notify
  after insert or update on public.guest_verifications
  for each row execute procedure public.notify_verification();

-- ════════════════════════════════════════════════════════════════════════════
-- FIM. Devias ver "Success. No rows returned".
-- ════════════════════════════════════════════════════════════════════════════

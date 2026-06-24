# IMOAUTO — Estado do projeto (handoff)

Última atualização: 2026-06-24. Documento para retomar o trabalho numa sessão
nova sem perder contexto. (O site está 100% funcional em produção.)

## Onde está

- **Produção:** https://www.imoauto.cv (domínio .cv ligado ao Vercel, SSL ok).
  Aliases: imoauto.cv → www.imoauto.cv, imoauto.vercel.app.
- **Stack:** Next.js 16 (App Router, Turbopack) · React 19 · Tailwind 4 ·
  Supabase (Postgres+Auth+Storage+RLS+Realtime) · Vercel (Hobby, Node 22.x).
- **Repo:** github.com/Afroberd/imoauto (branch main). Cada push → deploy Vercel.
- **Supabase project ref:** rnaoozvrdhhoedxdasip
- **Vercel:** projeto prj_ZY93MeXxW7lcbv2K6JLskncLDxzk, team team_Gmqje9uLQxZhyhoNfQT6tZOq

## Funciona em produção (testado)

- Auth email/password + Google OAuth (redirect https corrigido)
- Anúncios: criar (wizard 6 passos), editar, listar, mapa, favoritos, pesquisa
- Mensagens em tempo real (/messages)
- Reservas rent_daily: BookingForm (carro mostra "Condutores/dias"; imóvel
  "Hóspedes/noites"), /dashboard com Hoje, Pedidos, Estadias, Pagamentos,
  Calendário, "As minhas reservas"
- Verificação de identidade (/verificacao) — auto-aprova (MVP)
- Avaliações (estrelas) + agregados em listings
- Notificações: sino 🔔 no header, painel, realtime, triggers automáticos
- Mobile: hamburger + responsivo
- Pagamentos: "Pagar na chegada" ativo; Cartão (Stripe) e Vinti4 prontos mas
  desativados até haver credenciais

## Migrations SQL aplicadas (todas no Supabase)

001–006 (base) · 007 favorites (recriada na 012) · 008 mensagens ·
009 bookings · 010 reviews · 011 plataforma reservas (payments, verifications,
listings settings, bucket verifications) · 012 favorites+notifications.
Há um PHASE_5_COMPLETE.sql idempotente. **Forma de aplicar SQL:** colar no SQL
editor do Supabase (o user faz Ctrl+A→Ctrl+V→Run). Migrations são idempotentes.

## PENDENTE (próximos passos)

1. **Ativar Stripe** (conta criada em Portugal pelo irmão do user). Falta o user
   enviar: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`.
   Meter no Vercel → botão "Cartão" ativa sozinho. Webhook já implementado em
   /api/webhooks/stripe. (lib/payments/stripe.ts apiVersion '2026-04-22.dahlia'.)
2. **Ativar Vinti4/SISP.** Falta: contrato SISP + `VINTI4_POS_ID`,
   `VINTI4_POS_AUTH_CODE`, `VINTI4_GATEWAY_URL` + **manual de integração SISP**.
   ⚠️ Completar a fórmula da fingerprint em lib/payments/vinti4.ts
   (buildFingerprint + verifyVinti4Response — estão isoladas com TODO).
3. **Emails transacionais** (Resend) — ainda nenhum email é enviado.
4. **Verificação de identidade real** — hoje auto-aprova; falta painel admin
   para o user aprovar/rejeitar.
5. **CRON_SECRET** no Vercel — o cron /api/cron/booking-transitions corre mas
   sem secret definido.
6. **Reativar "Confirm email"** no Supabase Auth antes de abrir ao público.
7. **Limpar conta de teste** debug.imoauto.test@gmail.com (criada para debug).

## Regras importantes (ver memória)

- Responder em português; código em inglês.
- Abrir URLs no Microsoft Edge (mas automação de browser só funciona em Chrome
  via chrome-devtools-mcp — dizer ao user à partida quando precisa de Chrome).
- **Testar SEMPRE o site LOGADO no browser antes de dizer "feito"** (curl/build
  não apanham crashes client-side só-logado — foi o que causou o ecrã preto).
- Confirmar deploy READY no Vercel após cada push.

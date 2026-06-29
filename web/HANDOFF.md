# IMOAUTO — Estado do projeto (handoff)

Última atualização: 2026-06-29. Documento para retomar o trabalho numa sessão
nova sem perder contexto. (O site está 100% funcional em produção.)

**Feito em 2026-06-29:** domínio imoauto.cv expirou e foi RENOVADO (1 ano; auto-
renew a confirmar) · SEO/Open Graph + sitemap + robots · páginas legais +
entidade (Afro-Berdiano Image, NIF 285307002) · CRON_SECRET definido no Vercel ·
conta de teste debug.imoauto.test APAGADA · "Pagar na chegada" removido (mostra
"pagamento online em breve" até Vinti4 estar vivo) · decidido Vinti4-only (sem
Stripe). Falta: verificar domínio no Resend (emails p/ todos) → depois SMTP no
Supabase → depois reativar Confirm email; Vinti4 (SISP em curso); comissão 10%
na lógica; política de verificação (ver baixo). Browser do user ligado via
extensão Claude-in-Chrome (consigo conduzir Supabase/Vercel/Namecheap logados;
SQL sim, segredos não).

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
- Verificação de identidade (/verificacao) — fila de revisão manual: entra
  'pending', admin aprova/rejeita em /admin/verificacoes. Publicar aluguer
  diário (rent_daily, imóvel/carro) exige estar verificado. Notifica admin
  (novo pedido) e user (aprovado/rejeitado) via sino 🔔.
- Avaliações (estrelas) + agregados em listings
- Notificações: sino 🔔 no header, painel, realtime, triggers automáticos
- Mobile: hamburger + responsivo
- SEO/partilha: Open Graph + Twitter card (layout), imagem OG dinâmica
  (app/opengraph-image.tsx), generateMetadata por anúncio (partilha mostra foto
  de capa + preço), sitemap.ts + robots.ts. SITE_URL via NEXT_PUBLIC_SITE_URL.
- Páginas legais: /termos, /privacidade, /contacto (links no rodapé). São
  modelos PT a rever por advogado. ⚠️ /contacto tem email/WhatsApp PLACEHOLDER
  (geral@imoauto.cv, +238 000…) — trocar pelos reais em app/contacto/page.tsx.
- Pagamentos: "Pagar na chegada" ativo; Cartão (Stripe) e Vinti4 prontos mas
  desativados até haver credenciais

## Migrations SQL aplicadas (todas no Supabase)

001–006 (base) · 007 favorites (recriada na 012) · 008 mensagens ·
009 bookings · 010 reviews · 011 plataforma reservas (payments, verifications,
listings settings, bucket verifications) · 012 favorites+notifications ·
**013 admin_verifications APLICADA** (admins + is_admin() + status/rejection_reason/
reviewed_by/reviewed_at em guest_verifications + RLS admin; admin=afroberd@gmail.com).
**014 verification_notifications APLICADA** (trigger notify_verification:
avisa admins quando há nova verificação pendente; avisa o user quando aprovada/
rejeitada).
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
3. **Emails transacionais** (Resend) — ✅ A FUNCIONAR (pipeline confirmado:
   notificação → email recebido). lib/email/resend.ts + template.ts + rota
   /api/webhooks/notification-email. Env vars no Vercel (RESEND_API_KEY,
   EMAIL_FROM, NOTIFICATION_WEBHOOK_SECRET) ✅ + Database Webhook no Supabase
   (notifications INSERT → POST à rota, header x-webhook-secret) ✅.
   **FALTA p/ produção: verificar o domínio imoauto.cv no Resend** (Resend →
   Domains → add imoauto.cv → adicionar registos DNS). Enquanto não estiver:
   (a) emails caem no SPAM; (b) modo teste só entrega ao email da conta Resend
   (afroberd@gmail.com) — outros users não recebem. Depois de verificar, mudar
   EMAIL_FROM para noreply@imoauto.cv. Nota: submeter verificação só notifica
   ADMINS; o utilizador só é notificado quando aprovada/rejeitada (by design).
4. **Verificação de identidade real** — ✅ FEITO E NO AR (migração 013 aplicada,
   deployed, testado logado em 2026-06-24). Painel admin em /admin/verificacoes:
   lista pedidos, vê fotos (signed URLs do bucket privado), aprova/rejeita com
   motivo. submitVerification já NÃO auto-aprova — entra como 'pending'. Link
   "Admin" no header só aparece a admins. Admin = afroberd@gmail.com (login do
   site; ≠ yanickdrs). Tabela `admins`; para adicionar admin ver migração 013.
   Publicar aluguer diário (rent_daily) exige verificação (createListing/
   updateListing + wizard). Notificações via migração 014 (admin no novo pedido;
   user na aprovação/rejeição) — APLICADA. Tarefa fechada.
   Autentika (identidade oficial do Estado CV via OIDC) = alternativa futura —
   ver memória reference-autentika; adesão por email cxm@nosi.cv.
5. **CRON_SECRET** no Vercel — o cron /api/cron/booking-transitions corre mas
   sem secret definido.
6. **Reativar "Confirm email"** no Supabase Auth antes de abrir ao público.
7. **Limpar conta de teste** debug.imoauto.test@gmail.com (criada para debug).

## Análise de prontidão p/ lançamento (2026-06-24)

O site são 2 produtos colados: **A) Classificados tipo OLX** (venda/aluguer
mensal, contacto direto — quase pronto, não precisa de verificação nem emails)
e **B) Reservas tipo Booking** (aluguer diário, calendário, verificação — tem
atrito). Riscos/lógica a resolver antes de abrir ao público:
- **Gargalo da verificação:** publicar/reservar diário exige verificação MANUAL
  e o email de aprovação não chega (domínio). Decisão pendente do user: auto-
  aprovar no lançamento / manter manual / tirar. (Mudança ~5 min quando decidir.)
- **Emails off para todos exceto afroberd** até verificar o domínio (ver #3).
- **Confirm email desligado** (#6) → registo com email de outrem.
- **Cold start:** homepage só mostra anúncios se existirem — é preciso semear
  anúncios reais antes de abrir.
- Páginas legais ✅ feitas hoje (rever c/ advogado + trocar placeholders contacto).
- Sem monitorização de erros em produção.

## Regras importantes (ver memória)

- Responder em português; código em inglês.
- Abrir URLs no Microsoft Edge (mas automação de browser só funciona em Chrome
  via chrome-devtools-mcp — dizer ao user à partida quando precisa de Chrome).
- **Testar SEMPRE o site LOGADO no browser antes de dizer "feito"** (curl/build
  não apanham crashes client-side só-logado — foi o que causou o ecrã preto).
- Confirmar deploy READY no Vercel após cada push.

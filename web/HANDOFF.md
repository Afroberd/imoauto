# IMOAUTO — HANDOFF completo (snapshot 2026-07-03)

Documento único para retomar o trabalho num chat novo sem perder contexto.
O site está **100% funcional em produção**. Lê isto de cima a baixo antes de agir.

---

## 1. COMO TRABALHAR COM O USER (regras)

- User = **Yanick** (zero-code). Responder **em português**; código em inglês.
- **Testar SEMPRE logado no browser antes de dizer "feito"** (curl/build não
  apanham crashes client-side — já causou um ecrã preto no passado).
- **Browser do user ligado** via extensão Claude-in-Chrome (tools
  `mcp__claude-in-chrome__*`): consigo conduzir Supabase/Vercel/Namecheap/Resend
  **logados**. SQL escrevo e corro eu (há diálogo de confirmação em ops
  destrutivas); **segredos** (API keys, valores DKIM, passwords) o filtro
  bloqueia — o user cola, eu abro a página e preencho o resto.
- Cada `git push` a `main` → deploy automático Vercel. Confirmar deploy READY.
- **Manter este HANDOFF + a memória atualizados ao longo do trabalho** (o user
  muda de chat quando o contexto enche — este doc é a ponte).
- AGENTS.md: este Next.js 16 tem breaking changes — ler docs em
  `node_modules/next/dist/docs/` antes de escrever código Next novo.
- Lint tem erros PRÉ-EXISTENTES (date-input.tsx, vinti4.ts, gateway.ts) — não
  bloqueiam; o build passa. Não "corrigir" sem pedido.

## 2. INFRA / IDs

- **Prod:** https://www.imoauto.cv (aliases: imoauto.cv, imoauto.vercel.app).
  Domínio na **Namecheap** (renovado até jun 2027 após ter EXPIRADO em jun 2026
  — confirmar auto-renew um dia).
- **Stack:** Next.js 16 App Router + React 19 + Tailwind 4 · Supabase
  (Postgres/Auth/Storage/RLS/Realtime) · Vercel Hobby.
- **Repo:** github.com/Afroberd/imoauto (branch `main`), pasta `web/`.
- **Supabase ref:** rnaoozvrdhhoedxdasip · **Vercel:** prj_ZY93MeXxW7lcbv2K6JLskncLDxzk
  / team_Gmqje9uLQxZhyhoNfQT6tZOq (MCP Vercel ligado — deploys/logs por API).
- **Login do site + admin:** afroberd@gmail.com (tabela `admins`, migração 013).
  yanickdrs@gmail.com também é admin. Conta Resend/Vercel/Supabase/Namecheap:
  afroberd@gmail.com.
- **Env vars no Vercel:** NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
  RESEND_API_KEY, EMAIL_FROM (=`IMOAUTO <onboarding@resend.dev>` por agora),
  NOTIFICATION_WEBHOOK_SECRET, CRON_SECRET. (NEXT_PUBLIC_SITE_URL opcional,
  default https://www.imoauto.cv no código.)
- **Database Webhook Supabase:** `notification_email` — INSERT em
  `public.notifications` → POST https://www.imoauto.cv/api/webhooks/notification-email
  com header `x-webhook-secret`.
- **Migrations 001–015 TODAS aplicadas** (013 admins/verificação · 014 notif.
  verificação · 015 comissão: commission_rate/commission_cve/host_payout_cve). Aplicar SQL = colar no SQL editor (eu
  consigo fazê-lo via browser).

## 3. DECISÕES TOMADAS (não re-discutir sem motivo)

- **Dois produtos:** A) **Classificados** (venda + aluguer mensal; grátis;
  contacto direto WhatsApp) · B) **Reservas pagas** (aluguer diário; pagamento
  online; **comissão 10% paga pelo anfitrião** — ele recebe 90%).
- **Pagamento online: SÓ Vinti4/SISP** (cobre Vinti4+Visa+Mastercard+Amex).
  Stripe ABANDONADO (código fica dormente; não ativar). Contrato SISP proíbe
  passar taxa ao comprador → comissão sai do lado do anfitrião. Liquidação:
  vinti4 no dia, internacionais 4 dias úteis. Taxa SISP = "tarifário" anexo ao
  contrato — **pedir/confirmar o valor** (come a margem dos 10%).
- **"Pagar na chegada" REMOVIDO** (payment-options.tsx mostra "pagamento online
  em breve" enquanto nenhum gateway ativo).
- **Verificação de identidade: MANUAL** (admin revê em /admin/verificacoes).
  Auto-aprovação rejeitada pelo user. **Autentika** (identidade do Estado CV,
  OIDC, adesão cxm@nosi.cv) = futuro; investigação na memória reference-autentika.
- **Entidade legal:** Afro-Berdiano Image, Sociedade Unipessoal, Lda —
  NIF 285307002, Palmarejo, Praia. Consta nos Termos/Privacidade. Dados completos
  (registo, IBAN Caixa, passaporte Yanick) na memória **reference-business-identity**
  (SENSÍVEL). Contacto público: afroberd@gmail.com · +238 937 20 69.
  ⚠️ Atividade registada da empresa = produção de vídeo (≠ imobiliária) —
  user decidiu avançar; se a SISP objetar, acrescentar atividade ao objeto social.

## 4. O QUE FUNCIONA EM PRODUÇÃO (testado)

- Auth email/password + Google OAuth · perfil
- Anúncios: wizard 6 passos, editar, pausar/apagar, fotos, mapa (Leaflet),
  pesquisa (tipo/finalidade/ilha/preço/texto), favoritos, partilha
- Mensagens em tempo real (/messages) · Avaliações (estrelas)
- Reservas rent_daily: BookingForm, dashboard anfitrião (Hoje/Pedidos/Estadias/
  Pagamentos/Calendário), "As minhas reservas", check-in/out c/ km+combustível
- Verificação: submete → 'pending' → admin aprova/rejeita c/ motivo em
  /admin/verificacoes (vê fotos via signed URLs). Publicar rent_daily EXIGE
  verificação. Sino notifica admin (novo pedido) e user (resultado).
- Notificações: sino realtime + triggers (mensagem/reserva/estado/avaliação/verificação)
- **Emails:** pipeline completo notificação→webhook→Resend→inbox. ⚠️ Só entrega
  a afroberd@gmail.com (modo teste Resend) até o domínio ser verificado.
- SEO: Open Graph + Twitter card, imagem OG dinâmica, metadata por anúncio
  (partilha = foto capa + título + preço), sitemap.xml, robots.txt
- SEO hardening (2026-07-10): canonicals nas páginas públicas, noindex nos
  privados, /api/health p/ uptime, redirect apex→www agora 308 PERMANENTE
  (mudado no Vercel Domains), docs/production-domain-and-indexing.md
  (checklist DNS/Search Console). Canónico = www (decisão: NÃO inverter).
- Legal: /termos /privacidade /contacto (contactos REAIS: afroberd@gmail.com,
  +238 937 20 69) + entidade identificada + links no rodapé. Modelos PT — rever
  com advogado antes de escala.
- Mobile responsivo · ~13 anúncios publicados (reais do user/contactos; conta
  de teste debug.imoauto.test APAGADA em 2026-06-29)

## 5. ROADMAP — TUDO O QUE FALTA (com dependências)

### TRILHO A — Emails para todos (Resend) — ✅ COMPLETO (2026-07-03)
Domínio imoauto.cv VERIFIED no Resend (DNS na Namecheap: SPF/DKIM/DMARC/MX) ·
EMAIL_FROM no Vercel = `IMOAUTO <noreply@imoauto.cv>` (redeploy feito) ·
SMTP custom no Supabase (smtp.resend.com:465, user resend, pw=RESEND_API_KEY) ·
**Confirm email ATIVADO**. Emails chegam a TODOS os users, fora do spam; registo
novo exige confirmação de email. ⚠️ Testar: registar conta nova + receber email.

### TRILHO B — Vinti4 / pagamento online — BLOQUEADO NO USER→SISP
1. **User envia à SISP** (responder ao email deles, processo só segue completo):
   ficha preenchida (`C:\Users\yanic\Downloads\Ficha_Adesao_SISP_IMOAUTO_preenchida.docx`
   — gerada por mim, falta nº agência bancária), contrato assinado (PDF
   `MD050.02_CONTRATOADESAOPAGAMENTOONLINENAWEB (1).pdf`; preencher parágrafo:
   "AFRO-BERDIANO IMAGE, SOCIEDADE UNIPESSOAL, LDA, contribuinte nº 285307002,
   sede Palmarejo, Praia, representado por Yanick dos Reis Silva, Sócio-Gerente,
   conta nº 03546157110001, Banco Caixa"), Certidão Comercial, cópia passaporte.
   Perguntar no mesmo email: tarifário (taxa/transação) + se a atividade da
   empresa é aceite.
2. SISP devolve: VINTI4_POS_ID, VINTI4_POS_AUTH_CODE, VINTI4_GATEWAY_URL +
   **manual técnico**.
3. **Eu:** completar `buildFingerprint` + `verifyVinti4Response` em
   lib/payments/vinti4.ts conforme o manual (TODOs isolados) · meter env vars ·
   testar em ambiente de teste da SISP · botão Vinti4 ativa sozinho.

### TRILHO C — Comissão 10% — ✅ FEITO (2026-07-03)
lib/payments/commission.ts · createBooking grava comissão/payout por reserva ·
migração 015 aplicada (+backfill) · dashboard anfitrião (pedidos/pagamentos/
estadias) mostra "Recebes X após comissão 10%" · hint no wizard (rent_daily).
No Vinti4 (Trilho B): usar host_payout_cve como valor a transferir ao anfitrião.

### TRILHO D — Lançar CLASSIFICADOS (pode ir primeiro, não depende de B/C)
- Precisa: Trilho A passos 1–5 (por causa do confirm-email) + anúncios reais
  (user; cold start com ~13) → **anunciar/lançar**.
- Alternativa rápida: lançar sem confirm-email (risco: registos com email
  alheio) — decisão do user.

### BACKLOG / polish (não bloqueia nada)
- Checkbox "aceito os Termos" no registo
- Monitorização de erros (ex. Sentry) + analytics (Vercel Analytics)
- Filtro por concelho + ordenação (preço/recente) na pesquisa
- Botão "denunciar anúncio" / moderação
- Auto-renew do domínio na Namecheap (tem 1 ano pago)
- Rever legal com advogado · Autentika (verificação oficial)

## 6. ORDEM RECOMENDADA (se o user perguntar "o que fazemos?")

1. **Trilho A** (Resend DNS → Verified → EMAIL_FROM → SMTP → confirm-email) —
   30 min de trabalho conjunto, desbloqueia emails E o lançamento seguro.
2. **User dispara Trilho B** (email à SISP com anexos) — 15 min dele; a espera
   é da SISP.
3. **Eu faço Trilho C** (comissão) enquanto a SISP responde.
4. **Lançar classificados** (Trilho D) — não esperar pelo Vinti4.
5. Vinti4 chega → ligar reservas pagas → lançamento "Booking" completo.

## 7. ARQUITETURA RÁPIDA (onde mexer)

- `app/actions/*.ts` — server actions (listings, bookings, verification, admin,
  notifications, payments…). RLS no Supabase é a fonte de verdade.
- `app/admin/*` — painel admin (guard: tabela admins). `components/admin/*`.
- `lib/payments/vinti4.ts` — TODOs da fingerprint (Trilho B). `gateway.ts`
  seleciona gateway. `stripe.ts` dormente.
- `lib/email/resend.ts` + `template.ts` + `app/api/webhooks/notification-email/`
  — pipeline de email (1 notificação = 1 email).
- `supabase/migrations/` — 001–014 aplicadas; escrever novas idempotentes.
- `components/payment-options.tsx` — UI de pagamento (online-only).
- SEO: `app/layout.tsx` (metadata), `app/opengraph-image.tsx`,
  `app/listings/[id]/page.tsx` (generateMetadata), `app/sitemap.ts`, `app/robots.ts`.

## 8. HISTÓRICO RECENTE (contexto)

- 2026-06-24: painel admin verificações (migr. 013+014) · verificação manual ·
  publicar rent_daily exige verificação · emails Resend construídos e testados ·
  páginas legais criadas · gate de verificação no wizard.
- 2026-06-26: ficha SISP preenchida (docx) · dados empresa/IBAN/passaporte
  guardados na memória · decisão comissão 10% + Vinti4-only.
- 2026-06-29: **domínio expirou e foi renovado** (site esteve em parking!) ·
  SEO/OG/sitemap/robots · entidade nas páginas legais · CRON_SECRET · conta de
  teste apagada · "pagar na chegada" removido · domínio adicionado no Resend ·
  browser do user ligado (extensão) — Supabase/Vercel/Namecheap conduzidos por mim.

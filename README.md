# IMOAUTO

Marketplace atlântico — imóveis e automóveis em Cabo Verde. Compra, venda e aluguer (diário ou mensal) em todas as nove ilhas.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Tailwind CSS 4** + tipografia Fraunces / Outfit (Atlantic Editorial)
- **Supabase** — Postgres + Auth (email + Google OAuth) + Storage + RLS
- **Vercel** — deploy

## Estrutura

```
.
├── web/                   # Aplicação Next.js
│   ├── app/               # App Router (pages, layouts, actions)
│   ├── components/        # Componentes partilhados
│   ├── lib/               # Helpers (Supabase clients, types)
│   ├── public/            # Assets estáticos (logos SVG)
│   ├── supabase/
│   │   └── migrations/    # SQL aplicado via Supabase SQL Editor
│   └── proxy.ts           # Next 16 proxy (antigo middleware)
└── README.md
```

## Desenvolver localmente

```bash
cd web
cp .env.example .env.local      # editar com as chaves Supabase reais
npm install
npm run dev                     # http://localhost:3000
```

## Variáveis de ambiente

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_…
NEXT_PUBLIC_SITE_URL=https://imoauto.example.cv   # opcional (deriva-se de headers)
```

## Roadmap

- [x] Fase 1 — Autenticação (email + Google OAuth)
- [x] Fase 2 — Listagens (criar, listar, detalhe, eliminar) + Storage
- [x] Identidade visual — Atlantic Editorial
- [ ] Fase 3 — Pesquisa avançada + Mapa
- [ ] Fase 4 — Aluguer (calendário + reservas diárias/mensais)
- [ ] Fase 5 — Dashboards + edição de anúncios + mensagens
- [ ] Fase 6 — Pagamentos (Vinti4 ou equivalente CV)

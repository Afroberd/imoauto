# IMOAUTO — Especificação completa

> Documento vivo. Antes de tocar em código, valida aqui. Cada secção
> identifica o que precisa de existir, com que detalhe, e como cada caso
> particular difere dos restantes. O objectivo é nunca mais ter formulários
> "para tudo" nem botões que não fazem nada.

Versão `0.1` · Cabo Verde · escudo cabo-verdiano (CVE)

---

## 0. Princípios não-negociáveis

1. **Contacto directo, sem comissão IMOAUTO** sobre as transacções (fase 1-5).
   O modelo de receita futuro é destaque pago / planos premium, não a transacção.
2. **Mobile-first.** A maioria dos utilizadores em CV navega no telemóvel.
   Tudo o que se desenha tem de funcionar em 360px de largura.
3. **WhatsApp é o canal de facto.** Qualquer "Contactar" abre `wa.me/<num>`.
   Email é fallback, não default.
4. **Multilíngue PT-CV.** UI sempre em português. Numerais com separadores
   PT (`15.000.000 CVE`).
5. **Quem publica é quem responde.** Não há intermediação — só plataforma.
6. **Não inventar dados que não existem.** Se um campo é opcional, mostrar
   "—" em vez de "Não disponível"; nunca mostrar valores falsos.

---

## 1. Personas

| Persona | Vê | Faz |
|---|---|---|
| **Visitante** (não autenticado) | Anúncios públicos, detalhe, mapa, pesquisa | Pode contactar via WhatsApp e partilhar. Para anunciar/guardar tem de registar. |
| **Anunciante particular** | Visitante + dashboard pessoal, criar/editar/apagar anúncios | Publica até **N** anúncios (limite a definir — começamos sem limite). |
| **Anunciante profissional** (imobiliária, stand, rent-a-car) | Anunciante particular + perfil profissional com badge "Verificado", listagem agrupada por marca | Plano pago, anúncios destacados, estatísticas. **Fase 6+**. |
| **Procurador** | Visitante + favoritos, histórico de contactos | Guarda anúncios, deixa avaliações depois de transacção (Fase 5+). |
| **Admin IMOAUTO** | Tudo | Modera, suspende, responde a denúncias. **Painel separado, Fase 5+.** |

> Hoje: Visitante, Anunciante particular, Procurador (mesma conta — papéis
> activados conforme acção). Profissional e Admin só mais tarde.

---

## 2. Matriz de transacção — 6 combinações distintas

A matriz **kind × purpose × frequency** gera 6 combinações. Cada uma é um
fluxo diferente, com campos diferentes, página diferente, contactos
diferentes.

|   | Imóvel | Automóvel |
|---|---|---|
| **Venda** | Casa, apartamento, terreno, comercial — *negociação directa* | Carro, mota, comercial — *negociação directa* |
| **Aluguer · Mensal** | Long-term rental tipo "T2 em Mindelo" — contrato mensal recorrente | Aluguer mensal de carro (negócio menos comum mas existe) |
| **Aluguer · Diário** | Estadia tipo Booking/Airbnb — calendário de disponibilidade, noites mín/máx | Rent-a-car turístico — calendário, idade mínima, KM incluídos |

### 2.1 Imóvel · Venda

**Campos obrigatórios:**
- Tipo de imóvel: *apartamento, moradia, terreno, comercial, escritório*
- Preço (CVE) — pode marcar "Negociável"
- Ilha + cidade/zona + (opcional) coordenadas
- Área (m²)
- Título, descrição
- Fotos (mín. 1, recomendado 5)
- Contacto WhatsApp / telefone (mín. 1)

**Campos opcionais relevantes:**
- Quartos, casas de banho
- Ano de construção
- Estado de conservação (*novo, bom, a precisar de obras*)
- Documentos: escritura sim/não, registo predial sim/não
- Mobiliado: sim/parcial/não
- Garagem, varanda, vista mar
- Inclui: piscina, jardim, churrasqueira

**Página de detalhe destaca:**
- Galeria, preço grande, badge "Negociável" se aplicável
- Tipo + área + quartos como spec-row
- Localização (com mapa se coords)
- Botão **Contactar via WhatsApp**

**Estado especial:** `sold` (vendido — escondido da pesquisa mas owner pode ver).

---

### 2.2 Imóvel · Aluguer · Mensal (long-term)

**Campos obrigatórios:**
- Tipo: *apartamento, moradia, quarto*
- Renda mensal (CVE)
- Caução (CVE ou "X meses")
- Ilha + cidade + (opcional) coordenadas
- Área (m²), quartos, casas de banho
- Mobiliado sim/não/parcial
- Fotos (mín. 1)
- Contacto

**Campos opcionais relevantes:**
- Despesas incluídas: água, luz, internet, condomínio (checkbox)
- Duração mínima do contrato (meses)
- Disponibilidade a partir de (data)
- Animais permitidos sim/não/falar
- Fumadores sim/não
- Adequado a famílias, estudantes, profissionais

**Página de detalhe destaca:**
- Galeria, renda mensal grande + "/ mês"
- Linha de inclui (ícones de água, luz, etc.)
- Caução
- Data disponível
- Botão **Contactar via WhatsApp**

**Estado especial:** `rented` (alugado — escondido até a disponibilidade voltar).

---

### 2.3 Imóvel · Aluguer · Diário (estadia)

**Campos obrigatórios:**
- Tipo: *apartamento turístico, moradia, quarto privado, casa inteira*
- Preço por noite (CVE) — base
- Capacidade (hóspedes)
- Camas, quartos, casas de banho
- Ilha + cidade + (opcional) coordenadas
- Fotos (mín. 3 recomendado)
- Contacto

**Campos opcionais relevantes:**
- Preço por semana, preço por mês (descontos)
- Taxa de limpeza (uma vez)
- Caução refundável
- Estadia mínima / máxima (noites)
- Hora de check-in / check-out
- Comodidades (chips): WiFi, AC, cozinha, máquina lavar, piscina, parking, vista mar, secador, kit higiene
- Regras: fumar, festas, animais, suitable for children
- Calendário de disponibilidade (datas bloqueadas)
- Cancelamento: flexível / moderado / rigoroso

**Página de detalhe destaca:**
- Galeria, preço/noite grande, capacidade
- Comodidades em grid de ícones
- **Calendário** com datas indisponíveis a cinza
- Bloco "Avaliações" se já existirem (Fase 5+)
- Botão **Contactar via WhatsApp** e/ou (futuro) **Pedir reserva**

**Estado especial:** o anúncio mantém-se `published` mesmo durante uma
reserva — só as datas é que ficam bloqueadas. Quando ainda não temos
sistema de reservas, mostramos um banner "Confirma disponibilidade no
WhatsApp".

---

### 2.4 Automóvel · Venda

**Campos obrigatórios:**
- Tipo: *carro, mota, comercial, pickup, camião*
- Marca, modelo, ano
- Preço (CVE) — pode marcar "Negociável"
- Quilometragem (km)
- Combustível: gasolina, gasóleo, híbrido, eléctrico, GPL
- Caixa: manual, automática
- Ilha + cidade
- Fotos (mín. 3 recomendado)
- Contacto

**Campos opcionais relevantes:**
- Cor, número de lugares, número de portas
- Estado: *novo, semi-novo, usado, para peças*
- Documentos em dia (sim/não/parcial)
- Histórico de acidentes
- Cilindrada (cc), potência (cv)
- Tracção: 2x4, 4x4
- Extras: AC, Bluetooth, GPS, sensores estacionamento, câmara ré, jantes liga, vidros eléctricos

**Página de detalhe destaca:**
- Galeria, preço grande, badge "Negociável"
- Linha hero: marca · modelo · ano · km · combustível · caixa
- Botão **Contactar via WhatsApp**

**Estado especial:** `sold`.

---

### 2.5 Automóvel · Aluguer · Diário (rent-a-car)

**Campos obrigatórios:**
- Tipo: *carro, mota, scooter, comercial*
- Marca, modelo, ano
- Preço por dia (CVE)
- Combustível, caixa, lugares
- Ilha de operação (cidade de entrega/recolha)
- Fotos (mín. 2)
- Contacto

**Campos opcionais relevantes:**
- Preço por semana, preço por mês (descontos)
- Caução (CVE)
- KM diários incluídos / KM ilimitados
- Idade mínima do condutor
- Anos de carta de condução exigidos
- Local de entrega (balcão, aeroporto, ao domicílio + cidades)
- Seguro incluído (sim/não, com franquia)
- Extras pagos: cadeira criança, GPS, condutor adicional
- Calendário de disponibilidade
- Combustível à entrega: cheio / como apanhou

**Página de detalhe destaca:**
- Galeria, preço/dia grande
- Linha hero: marca · modelo · lugares · combustível · caixa
- Inclui: KM, seguro, etc. (ícones)
- Caução, idade mín, entrega
- Calendário
- Botão **Contactar via WhatsApp** e/ou (futuro) **Pedir reserva**

---

### 2.6 Automóvel · Aluguer · Mensal

Versão de longa-duração da 2.5. Mesmos campos, mas:
- Preço mensal (em vez de diário)
- Sem calendário de noites (talvez calendário de meses ocupados)
- Sem entrega ao dia (entrega no início do mês)

**Aviso de implementação:** menos prioritário que 2.5. Pode partilhar
formulário com 2.5 e diferenciar por unidade de preço.

---

## 3. Modelo de dados — propostas

### 3.1 `listings` (refactoring proposto)

Em vez de uma só tabela polimórfica com `attributes` jsonb (actual), faz
sentido manter o jsonb para **atributos verdadeiramente type-specific**
(comodidades, extras, etc.) mas elevar a colunas reais os atributos que
queremos pesquisar/ordenar:

```
listings
  id                uuid pk
  owner_id          uuid fk auth.users
  kind              enum (property | vehicle)
  purpose           enum (sale | rent_monthly | rent_daily)   ← refactor
  status            enum (draft | published | paused | sold | rented | archived)

  title             text
  description       text
  location_island   text
  location_city     text
  latitude          numeric(9,6)
  longitude         numeric(9,6)
  contact_phone     text

  -- pricing: o significado depende de purpose
  price_cve         integer    -- venda OU mensal OU diário (base)
  price_weekly_cve  integer    -- só rent_daily
  price_monthly_cve integer    -- só rent_daily
  cleaning_fee_cve  integer    -- só rent_daily (imóvel)
  deposit_cve       integer    -- mensal + rent_daily
  negotiable        boolean    -- só venda

  -- imóvel
  property_type     text       -- apartamento, moradia, terreno, comercial
  area_sqm          integer
  bedrooms          smallint
  bathrooms         smallint
  beds              smallint   -- só rent_daily
  guests            smallint   -- só rent_daily
  furnished         enum (yes | partial | no)  -- só aluguer
  year_built        smallint

  -- automóvel
  vehicle_type      text       -- carro, mota, comercial, etc
  brand             text
  model             text
  vehicle_year      smallint
  km                integer
  fuel              text
  transmission      text
  seats             smallint
  doors             smallint
  vehicle_condition text       -- novo, semi-novo, usado, peças

  -- aluguer diário
  min_nights        smallint
  max_nights        smallint
  checkin_time      time
  checkout_time     time
  cancellation      enum (flexible | moderate | strict)

  -- rent-a-car
  min_driver_age    smallint
  daily_km_included integer    -- null = ilimitado
  delivery_options  text[]     -- ['balcao','aeroporto','domicilio']
  insurance_included boolean

  -- atributos abertos (comodidades, extras)
  amenities         text[]     -- ['wifi','ac','piscina',...]
  vehicle_extras    text[]     -- ['ac','bluetooth','gps',...]
  utilities_included text[]    -- ['agua','luz','internet','condominio']
  rules             text[]     -- ['no_smoking','no_pets','no_parties']

  cover_image_url   text
  created_at, updated_at  timestamptz
```

**Validação ao nível da app**, não SQL: campos `_daily` só fazem sentido com
`purpose=rent_daily`, etc. Server action recusa combinações inválidas.

### 3.2 Tabelas adicionais para fases futuras

```
listing_photos          (existe)
listing_blocked_dates   id, listing_id, start_date, end_date, reason  ← Fase 4
bookings                id, listing_id, guest_id, start, end, total, status (pending|confirmed|cancelled|completed)  ← Fase 4
favorites               user_id, listing_id, created_at  ← Fase 5
messages                id, listing_id, from_id, to_id, body, created_at, read_at  ← Fase 5 (se quisermos chat interno)
reviews                 id, booking_id, rating, body, created_at  ← Fase 5
reports                 id, listing_id, reporter_id, reason, status  ← Fase 5
```

---

## 4. Fluxos de utilizador (já com lacunas conhecidas)

### 4.1 Onboarding
- Registo → confirmação email (a religar) → primeiro anúncio guiado.
- Hoje: salta confirmação. Página `/profile` é pobre — não tem foto, bio, nem perfil profissional.
- **A fazer:** página `/profile` com foto, nome, telefone padrão, "Eu sou…" (particular | profissional).

### 4.2 Criar anúncio (refactor obrigatório)
Sequência multi-step, não uma página única:
1. **Passo 1 — O que estás a anunciar?** Cartão grande para cada uma das 6 combinações. Não mostrar os 6 numa lista plana — mostrar primeiro Imóvel/Automóvel, depois Venda/Aluguer, depois (se aluguer) Diário/Mensal.
2. **Passo 2 — Localização** (ilha + cidade + coords opcionais).
3. **Passo 3 — Detalhes específicos** (campos da combinação escolhida).
4. **Passo 4 — Fotos** (drag & drop, reordenar, primeira = capa).
5. **Passo 5 — Preço e contacto**.
6. **Passo 6 — Pré-visualização** (mostrar como vai aparecer) + Publicar.

Cada passo é uma URL (`/listings/new/1`, `/listings/new/2`…) com estado
guardado no servidor como `draft` desde o passo 2 — não perdes tudo se
fechares o browser.

### 4.3 Editar anúncio (em falta)
- Botão "Editar" em `/my-listings` e em `/listings/[id]` (só para o owner).
- Reabre o wizard do 4.2 pré-preenchido.
- Permite "Pausar" (`paused`) e "Publicar de novo".

### 4.4 Pesquisa e descoberta
- Home com 3-4 categorias de descoberta (recentes, perto de ti se geo, por ilha).
- `/listings` com filtros (já temos).
- **Faltam filtros específicos:** quartos exactos, ano min/max, km máx, comodidades exigidas.
- **Falta:** ordenação (mais recente, preço asc/desc, mais relevante).

### 4.5 Contacto
- Hoje: botão WhatsApp directo (✓).
- A pensar: registar que o utilizador X contactou o anúncio Y (para
  estatísticas do anunciante e para review depois). Só Fase 5+.

### 4.6 Reservar (Fase 4)
- Para `rent_daily`: calendário de selecção de datas, cálculo de total,
  pedido de reserva, owner aprova/rejeita, datas ficam bloqueadas.
- Conflitos: nenhuma reserva pode sobrepor outra `confirmed`.

### 4.7 Pagar (Fase 6)
- Vinti4, Pay4U, mPesa CV. **Investigação obrigatória sobre KYC e
  taxas.** Não tocar antes de fazer chamada com o banco escolhido.

---

## 5. Páginas e estados — auditoria

| Página | Estado actual | Lacunas |
|---|---|---|
| `/` | OK visual | Sem secções específicas para 3 verticais (compra, aluguer-curta, aluguer-longa) |
| `/listings` | Filtros básicos + mapa | Falta ordenação, filtros específicos por tipo, paginação |
| `/listings/[id]` | Layout genérico para todos | **Deve mudar com `purpose`**: calendário em rent_daily, "Negociável" em sale, etc. |
| `/listings/new` | **Página única, mesmo form para tudo** | **Refazer como wizard 4.2** |
| `/my-listings` | Lista simples | Falta editar, pausar, duplicar, ver estatísticas |
| `/profile` | Só mostra dados auth | Falta foto, telefone padrão, profissional/particular, anúncios públicos do user |
| `/login`, `/register` | OK | Esquecer-me-da-password não existe |
| `/auth/callback` | OK | Mensagens de erro técnicas, não amigáveis |

---

## 6. Notificações

Nada existe ainda. Necessário pelo menos:
- Email quando alguém regista (boas-vindas).
- Email quando o anúncio é publicado / aprovado.
- Email opcional quando alguém adiciona aos favoritos / vê o anúncio X vezes.
- WhatsApp template message só com consentimento explícito (caro e difícil).

**Para v1**: começar só com emails transaccionais via Supabase Auth +
Resend. Notificações in-app só quando tivermos mensagens.

---

## 7. Pagamentos (Fase 6 — não tocar antes)

Opções para CV:
- **Vinti4 (rede de cartões CV)** — requer contrato com banco emissor.
- **Pay4U** — gateway agnóstico, mais flexível.
- **mPesa CV / T+ Móvel** — mobile money, comum.
- **Stripe** — só para clientes internacionais com cartão. Não cobre CVE.

Modelo proposto inicialmente: pagamento *fora* da plataforma (acordo
directo). Plataforma cobra só por **destaque pago** (premium feature):
- "Destacar 7 dias" — top of category, badge "Em destaque".
- Subscrição mensal para anunciantes profissionais.

---

## 8. Trust & segurança

Hoje: zero. Para um marketplace credível precisamos de:
- **Verificação de telefone** (SMS code) ao registar.
- Badge "Email verificado" e "Telefone verificado".
- Limite de **N anúncios por user não verificado** (anti-spam).
- Botão **"Denunciar anúncio"** em cada detalhe.
- Moderação: anúncios de utilizadores novos podem precisar de aprovação
  manual no primeiro post.
- Termos & condições aceites no registo (já não aceitamos sem isto).

---

## 9. Admin (Fase 5+)

Painel separado em `/admin` (RLS by role):
- Lista de anúncios pendentes de moderação.
- Lista de denúncias.
- Suspender utilizador / anúncio.
- Estatísticas (total de anúncios, anúncios por ilha, etc.).
- Não usar `/admin` durante o desenvolvimento normal — privacy.

---

## 10. Estado actual — honest audit

### Funcionalidades que dizem estar prontas mas não estão

- **Form de criação** trata venda de casa, aluguer mensal de quarto e
  aluguer diário de carro como se fossem a mesma coisa. **PARTIDO POR DESIGN.**
- **Edição de anúncio** não existe.
- **Botões "Contactar/Partilhar"** corrigidos nesta sessão. ✓
- **Apagar com confirmação** corrigido nesta sessão. ✓
- **Mapa em Praia, não Assomada** corrigido nesta sessão. ✓
- **Calendário/disponibilidade** não existe.
- **Favoritos** não existem.
- **Mensagens internas** não existem.
- **Avaliações** não existem.
- **Verificação de telefone** não existe.
- **Esquecer password** não existe.
- **Foto de perfil** não existe.

### Cosméticas que sabem mal

- Header dropdown de "Os meus" e "Conta" some em mobile.
- Pesquisa não dá feedback de "0 resultados com estes filtros" suficientemente claro.
- Empty state do mapa quando não há anúncios é um mapa vazio sem ajuda.

### Bugs latentes

- `cover_image_url` desactualiza se a primeira foto for apagada.
- Upload de fotos pode deixar lixo se a transacção partir a meio.
- Sem rate-limit na criação de anúncios — vulnerável a spam.

---

## 11. Roadmap revisto (substitui o anterior)

> **Regra:** nenhuma fase começa sem este SPEC validado pela parte
> relevante. Cada fase tem um "definition of done" explícito.

### Fase 4 — Refactor de criação e edição (PRÓXIMA)
DoD:
- Wizard multi-step em `/listings/new` com a árvore 4.2.
- Cada uma das 6 combinações tem o seu próprio sub-formulário, com os
  campos da secção 2.x correspondente.
- Editar anúncio existente reabre o wizard com dados.
- Pausar / reactivar anúncio.
- `cover_image_url` calculado dinamicamente (não denormalizado), ou
  query `listing_photos order by position limit 1`.

### Fase 5 — Disponibilidade e reservas (Booking-like)
DoD:
- Tabelas `listing_blocked_dates` + `bookings`.
- Calendário visual em `rent_daily` (apartamentos e rent-a-car).
- Pedido de reserva → email ao owner → owner aprova/rejeita.
- Datas bloqueadas após aprovação. Anti-overlap garantido.

### Fase 6 — Mensagens, favoritos, avaliações
DoD:
- `favorites` table + botão funcional.
- Inbox de mensagens com cada anúncio (alternativa a WhatsApp para quem
  não quer dar número).
- Avaliações pós-transacção (rating + texto).

### Fase 7 — Pagamentos / destaque
DoD:
- Integração Vinti4 OU Pay4U.
- "Destacar anúncio 7 dias" como compra única.
- Plano mensal para profissionais.

### Fase 8 — Verificação, denúncia, admin
DoD:
- Telefone verificado por SMS.
- Botão "Denunciar".
- `/admin` com fila de moderação.

---

## 12. Decisões em aberto (responder antes de Fase 4)

1. **Aluguer mensal e diário são duas categorias separadas ou variantes da
   mesma?** Recomendo separadas — UX é muito diferente.
2. **Profissionais existem desde já ou só Fase 7?** Hoje só particular.
3. **Pode um anúncio ter mais que uma `purpose` ao mesmo tempo?** Ex: "vendo
   ou alugo". Recomendo: não — força a escolha. Pode duplicar anúncio se
   precisar.
4. **Negociável só em venda?** Recomendo sim.
5. **Os limites de anúncios por utilizador?** Sugiro: 5 sem verificação, 50 verificado.
6. **Política sobre fotos:** mínimo 1, máximo 20, tamanho máx 5MB cada,
   conversão automática para webp.

---

*Fim do documento. Próximo passo: o user lê isto, anota o que mudar, e só
depois começamos a Fase 4.*

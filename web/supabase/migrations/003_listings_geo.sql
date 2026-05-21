-- IMOAUTO — Fase 3: coordenadas geográficas
-- Adiciona latitude/longitude (opcionais) à tabela listings.

alter table public.listings
  add column if not exists latitude numeric(9, 6),
  add column if not exists longitude numeric(9, 6);

-- Index parcial para queries de mapa (apenas anúncios com coordenadas válidas)
create index if not exists listings_geo_idx
  on public.listings(latitude, longitude)
  where latitude is not null and longitude is not null;

-- Constraint de sanidade (Cabo Verde está entre lat 14-18, lon -25 a -22)
-- Mantém-se permissivo (mundo inteiro) para casos extremos, só rejeita valores absurdos.
do $$ begin
  alter table public.listings
    add constraint listings_lat_range check (latitude is null or (latitude between -90 and 90));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.listings
    add constraint listings_lng_range check (longitude is null or (longitude between -180 and 180));
exception when duplicate_object then null; end $$;

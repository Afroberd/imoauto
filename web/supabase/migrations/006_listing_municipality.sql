-- IMOAUTO — Fase 4.5: município (concelho) do anúncio
-- Cabo Verde tem 22 municípios. Coluna estruturada para filtrar por concelho.
alter table public.listings
  add column if not exists location_municipality text;

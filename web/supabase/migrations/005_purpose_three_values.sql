-- IMOAUTO — Fase 4: purpose passa de (sale|rent) para (sale|rent_monthly|rent_daily)
-- Converte a coluna enum para text + check constraint (mais flexível, sem
-- a dor de alterar tipos enum em Postgres).

-- 1. Largar o default antes de mudar o tipo
alter table public.listings alter column purpose drop default;

-- 2. Converter enum -> text
alter table public.listings
  alter column purpose type text using purpose::text;

-- 3. Migrar dados antigos: 'rent' era ambíguo -> assumir aluguer mensal
update public.listings set purpose = 'rent_monthly' where purpose = 'rent';

-- 4. Repor default
alter table public.listings alter column purpose set default 'sale';

-- 5. Check constraint com os 3 valores válidos
do $$ begin
  alter table public.listings
    add constraint listings_purpose_check
    check (purpose in ('sale', 'rent_monthly', 'rent_daily'));
exception when duplicate_object then null; end $$;

-- 6. O tipo enum antigo deixa de ser usado — deixá-lo é inofensivo.
--    (não fazemos drop type para não falhar se algo ainda o referenciar)

-- IMOAUTO — Contacto opcional por anúncio (WhatsApp/telefone)
alter table public.listings
  add column if not exists contact_phone text;

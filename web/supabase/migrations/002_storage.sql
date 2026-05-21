-- IMOAUTO — Storage bucket 'listings' + RLS policies
-- Apply via Supabase SQL Editor. Bucket creation can also be done via UI.

-- Create bucket (idempotent)
insert into storage.buckets (id, name, public)
values ('listings', 'listings', true)
on conflict (id) do nothing;

-- Storage RLS policies
drop policy if exists "Public can read listing photos" on storage.objects;
create policy "Public can read listing photos"
  on storage.objects for select
  using (bucket_id = 'listings');

drop policy if exists "Authenticated can upload to their folder" on storage.objects;
create policy "Authenticated can upload to their folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'listings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Owners can update their photos" on storage.objects;
create policy "Owners can update their photos"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'listings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Owners can delete their photos" on storage.objects;
create policy "Owners can delete their photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'listings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'circle-documents',
  'circle-documents',
  false,
  15728640,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/heic', 'image/heif', 'text/plain', 'text/csv', 'application/json']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "circle_documents_read_household"
on storage.objects for select to authenticated
using (
  bucket_id = 'circle-documents'
  and public.circle_is_member(((storage.foldername(name))[2])::uuid)
);

create policy "circle_documents_insert_member"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'circle-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.circle_is_member(((storage.foldername(name))[2])::uuid)
);

create policy "circle_documents_update_owner_or_manager"
on storage.objects for update to authenticated
using (
  bucket_id = 'circle-documents'
  and (owner_id = auth.uid()::text or public.circle_can_manage(((storage.foldername(name))[2])::uuid))
)
with check (
  bucket_id = 'circle-documents'
  and public.circle_is_member(((storage.foldername(name))[2])::uuid)
);

create policy "circle_documents_delete_owner_or_manager"
on storage.objects for delete to authenticated
using (
  bucket_id = 'circle-documents'
  and (owner_id = auth.uid()::text or public.circle_can_manage(((storage.foldername(name))[2])::uuid))
);

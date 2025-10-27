-- Create public storage bucket for app files
insert into storage.buckets (id, name, public)
values ('files', 'files', true)
on conflict (id) do nothing;

-- Public read access to files bucket
create policy "Public read access to files"
  on storage.objects for select
  using (bucket_id = 'files');

-- Allow anyone to upload to files bucket (no auth required)
create policy "Anyone can upload to files"
  on storage.objects for insert
  with check (bucket_id = 'files');

-- Allow updates (e.g., moving/renaming) within files bucket
create policy "Anyone can update files"
  on storage.objects for update
  using (bucket_id = 'files')
  with check (bucket_id = 'files');

-- Allow deletion from files bucket
create policy "Anyone can delete files"
  on storage.objects for delete
  using (bucket_id = 'files');
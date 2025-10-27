-- Create storage bucket for files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'files',
  'files',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
);

-- Storage policies for files bucket
CREATE POLICY "Anyone can view files"
ON storage.objects FOR SELECT
USING (bucket_id = 'files');

CREATE POLICY "Anyone can upload files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'files');

CREATE POLICY "Anyone can update their files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'files');

CREATE POLICY "Anyone can delete files"
ON storage.objects FOR DELETE
USING (bucket_id = 'files');
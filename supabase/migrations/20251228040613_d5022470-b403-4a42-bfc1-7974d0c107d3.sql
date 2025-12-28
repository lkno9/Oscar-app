-- Set user-files bucket as public to allow public URLs
UPDATE storage.buckets 
SET public = true 
WHERE id = 'user-files';
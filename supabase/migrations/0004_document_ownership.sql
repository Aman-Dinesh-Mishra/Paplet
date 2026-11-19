ALTER TABLE public.documents
ADD COLUMN user_id UUID
REFERENCES auth.users(id)
ON DELETE CASCADE;
CREATE INDEX idx_documents_user_id
ON public.documents(user_id);

-- Migration: Add user_id column and RLS policies to reviews table

ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_select_own" ON public.reviews;
DROP POLICY IF EXISTS "reviews_insert_own" ON public.reviews;
DROP POLICY IF EXISTS "reviews_update_own" ON public.reviews;
DROP POLICY IF EXISTS "reviews_delete_own" ON public.reviews;

CREATE POLICY "reviews_select_own" ON public.reviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "reviews_insert_own" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_update_own" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "reviews_delete_own" ON public.reviews FOR DELETE USING (auth.uid() = user_id);

-- After running, assign existing reviews to a user:
-- UPDATE public.reviews SET user_id = 'YOUR_USER_UUID' WHERE user_id IS NULL;

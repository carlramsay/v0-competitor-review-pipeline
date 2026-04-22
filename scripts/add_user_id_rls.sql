-- Migration: Add user_id column and RLS policies to reviews table
-- Run this script in your Supabase SQL editor

-- Step 1: Add user_id column if it doesn't exist
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Create index for faster queries by user_id
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);

-- Step 3: Enable Row Level Security
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "reviews_select_own" ON public.reviews;
DROP POLICY IF EXISTS "reviews_insert_own" ON public.reviews;
DROP POLICY IF EXISTS "reviews_update_own" ON public.reviews;
DROP POLICY IF EXISTS "reviews_delete_own" ON public.reviews;

-- Step 5: Create RLS policies for owner-based access
-- SELECT: Users can only view their own reviews
CREATE POLICY "reviews_select_own" 
ON public.reviews 
FOR SELECT 
USING (auth.uid() = user_id);

-- INSERT: Users can only insert reviews with their own user_id
CREATE POLICY "reviews_insert_own" 
ON public.reviews 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own reviews
CREATE POLICY "reviews_update_own" 
ON public.reviews 
FOR UPDATE 
USING (auth.uid() = user_id);

-- DELETE: Users can only delete their own reviews
CREATE POLICY "reviews_delete_own" 
ON public.reviews 
FOR DELETE 
USING (auth.uid() = user_id);

-- Note: After running this migration, existing reviews without user_id 
-- will be inaccessible until you assign them to a user.
-- To assign existing reviews to a specific user, run:
-- UPDATE public.reviews SET user_id = 'YOUR_USER_UUID_HERE' WHERE user_id IS NULL;

-- Migration: Add tasks column to reviews table for distribution task tracking

ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS tasks JSONB NOT NULL DEFAULT '{
  "blogPublishedArousr": false,
  "videoPostedYouTube": false,
  "videoPostedXBIZ": false,
  "videoEmbeddedBlog": false,
  "blogPostedMedium": false,
  "linkedInArticle": false,
  "xPost": false,
  "facebookPost": false
}'::jsonb;

-- Create index for tasks queries
CREATE INDEX IF NOT EXISTS idx_reviews_tasks ON public.reviews USING GIN (tasks);

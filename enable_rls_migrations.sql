-- ============================================
-- Enable RLS on _prisma_migrations table
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable Row Level Security on _prisma_migrations table
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows service role to manage migrations
-- This prevents public access while allowing Prisma to manage migrations
CREATE POLICY "Service role can manage migrations" ON "_prisma_migrations"
  FOR ALL
  USING (auth.role() = 'service_role');

-- Verify RLS is enabled (optional check)
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = '_prisma_migrations';

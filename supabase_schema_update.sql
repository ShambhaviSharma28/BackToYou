-- ==============================================================================
-- RUN THIS IN YOUR SUPABASE SQL EDITOR:
-- https://supabase.com/dashboard/project/nfokvjzypitlrqoccnvi/sql/new
-- ==============================================================================

-- 1. Ensure all columns exist for reporter details, photos, and recovery tracking
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS reporter_name TEXT,
ADD COLUMN IF NOT EXISTS contact_info TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open',
ADD COLUMN IF NOT EXISTS recovered_at TIMESTAMPTZ;

-- 2. Allow updating items (fixes "new row violates row-level security policy")
DROP POLICY IF EXISTS "Allow authenticated users to update items" ON items;
DROP POLICY IF EXISTS "Allow users to update items" ON items;
DROP POLICY IF EXISTS "Users can update their own items" ON items;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON items;

CREATE POLICY "Allow users to update items" 
ON items 
FOR UPDATE 
TO public 
USING (true) 
WITH CHECK (true);

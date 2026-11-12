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

-- 2. Enable Row-Level Security
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- 3. Ensure SELECT and INSERT policies exist
DROP POLICY IF EXISTS "Enable read access for all users" ON items;
CREATE POLICY "Enable read access for all users" 
ON items 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON items;
CREATE POLICY "Enable insert for authenticated users only" 
ON items 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 4. Enable UPDATE policy for authenticated users (fixes: "new row violates row-level security policy")
DROP POLICY IF EXISTS "Users can update their own items" ON items;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON items;
DROP POLICY IF EXISTS "Allow authenticated users to update items" ON items;
DROP POLICY IF EXISTS "items_update_policy" ON items;

CREATE POLICY "Allow authenticated users to update items" 
ON items 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

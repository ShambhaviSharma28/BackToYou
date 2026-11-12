-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- to add dedicated columns for the reporter's name, contact details, item photos, and recovery status.

ALTER TABLE items 
ADD COLUMN IF NOT EXISTS reporter_name TEXT,
ADD COLUMN IF NOT EXISTS contact_info TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open',
ADD COLUMN IF NOT EXISTS recovered_at TIMESTAMPTZ;

-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- to add dedicated columns for the reporter's name and contact details.

ALTER TABLE items 
ADD COLUMN IF NOT EXISTS reporter_name TEXT,
ADD COLUMN IF NOT EXISTS contact_info TEXT;

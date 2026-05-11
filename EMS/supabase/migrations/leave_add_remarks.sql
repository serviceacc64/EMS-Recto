-- Add remarks column to leave_applications table
-- Run this in Supabase SQL Editor
ALTER TABLE public.leave_applications
  ADD COLUMN IF NOT EXISTS remarks TEXT DEFAULT NULL;

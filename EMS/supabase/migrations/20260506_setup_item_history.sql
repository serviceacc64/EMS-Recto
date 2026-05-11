-- Migration: Setup item_history table and RLS policies

-- 1. Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.item_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_no TEXT NOT NULL,
    employee_no TEXT NOT NULL,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    vacated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE public.item_history ENABLE ROW LEVEL SECURITY;

-- 3. Create Policies

-- Policy: Allow anyone to read history
DROP POLICY IF EXISTS "Allow public read access" ON public.item_history;
CREATE POLICY "Allow public read access" 
ON public.item_history FOR SELECT 
USING (true);

-- Policy: Allow anyone to insert history (fixes the 403 error)
DROP POLICY IF EXISTS "Allow public insert access" ON public.item_history;
CREATE POLICY "Allow public insert access" 
ON public.item_history FOR INSERT 
WITH CHECK (true);

-- Policy: Allow anyone to update history (needed for vacating items)
DROP POLICY IF EXISTS "Allow public update access" ON public.item_history;
CREATE POLICY "Allow public update access" 
ON public.item_history FOR UPDATE 
USING (true)
WITH CHECK (true);

-- 4. (Optional) Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_item_history_item_no ON public.item_history(item_no);
CREATE INDEX IF NOT EXISTS idx_item_history_employee_no ON public.item_history(employee_no);

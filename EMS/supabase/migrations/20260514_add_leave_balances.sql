-- Migration: Add leave balance columns to employees table
-- These are used to track initial leave credits for personnel

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='local_leave_balance') THEN
        ALTER TABLE public.employees ADD COLUMN local_leave_balance NUMERIC(8,3) DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='do_leave_balance') THEN
        ALTER TABLE public.employees ADD COLUMN do_leave_balance NUMERIC(8,3) DEFAULT 0;
    END IF;
END $$;

-- Update the public inquiry function to ensure it doesn't fail if columns were missing
-- (Actually, the function was already updated in a previous migration but it might have been invalid if the columns didn't exist)

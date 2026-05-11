-- Migration: Add department and personnel_category to employees table

-- 1. Add columns if they don't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='department') THEN
        ALTER TABLE public.employees ADD COLUMN department TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='personnel_category') THEN
        ALTER TABLE public.employees ADD COLUMN personnel_category TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='school_level') THEN
        ALTER TABLE public.employees ADD COLUMN school_level TEXT;
    END IF;
END $$;   

-- 2. (Optional) Set default values for existing records to avoid nulls if desired
-- UPDATE public.employees SET personnel_category = 'Teaching' WHERE personnel_category IS NULL;
-- UPDATE public.employees SET department = 'Unassigned' WHERE department IS NULL;

-- 3. Add indexes for better filtering performance
CREATE INDEX IF NOT EXISTS idx_employees_department ON public.employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_personnel_category ON public.employees(personnel_category);
CREATE INDEX IF NOT EXISTS idx_employees_school_level ON public.employees(school_level);

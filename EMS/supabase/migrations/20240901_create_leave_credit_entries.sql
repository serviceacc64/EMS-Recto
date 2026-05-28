-- Migration: create_leave_credit_entries.sql
-- Creates table to store leave credit entries
-- Table: public.leave_credit_entries

CREATE TABLE IF NOT EXISTS public.leave_credit_entries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    source_type varchar(50) NOT NULL,               -- e.g., 'service_credits', 'event', 'other'
    source_desc varchar(255),                         -- optional description of the source
    start_date date NOT NULL,
    end_date date NOT NULL,
    amount_days numeric(5,2) NOT NULL CHECK (amount_days >= 0),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Optional index for faster look‑ups by employee
CREATE INDEX IF NOT EXISTS idx_leave_credit_entries_employee_id ON public.leave_credit_entries (employee_id);

-- Trigger to auto‑update updated_at on row modification (PostgreSQL syntax)
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_timestamp ON public.leave_credit_entries;
CREATE TRIGGER trg_update_timestamp
BEFORE UPDATE ON public.leave_credit_entries
FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

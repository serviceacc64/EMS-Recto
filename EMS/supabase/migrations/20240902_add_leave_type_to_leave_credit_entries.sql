-- Migration: add_leave_type_to_leave_credit_entries.sql
-- Adds the required `leave_type` column to the leave_credit_entries table
-- Table: public.leave_credit_entries

ALTER TABLE public.leave_credit_entries
  ADD COLUMN IF NOT EXISTS leave_type VARCHAR(10) NOT NULL DEFAULT 'local';

-- Optional constraint to restrict values to the allowed types (local, do)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_leave_type'
      AND conrelid = 'public.leave_credit_entries'::regclass
  ) THEN
    ALTER TABLE public.leave_credit_entries
      ADD CONSTRAINT chk_leave_type CHECK (leave_type IN ('local', 'do'));
  END IF;
END $$;

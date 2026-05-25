-- Migration: rls_permissive_leave_credit_entries.sql
-- Adjusts RLS policies for leave_credit_entries to permit INSERTs for any authenticated user.
-- This resolves the 'new row violates row-level security policy' error.

ALTER TABLE public.leave_credit_entries ENABLE ROW LEVEL SECURITY;

-- Ensure SELECT is allowed for all authenticated users (already present, but redeclare safely)
-- Ensure SELECT is allowed for all authenticated users (drop if exists then create)
DROP POLICY IF EXISTS "allow_select" ON public.leave_credit_entries;
CREATE POLICY "allow_select"
  ON public.leave_credit_entries
  FOR SELECT
  TO public
  USING (true);

-- Drop any existing restrictive INSERT policy
DROP POLICY IF EXISTS "allow_super_admin_insert" ON public.leave_credit_entries;
DROP POLICY IF EXISTS "allow_insert" ON public.leave_credit_entries;

-- Create a permissive INSERT policy (any authenticated user can insert)
CREATE POLICY "allow_insert"
  ON public.leave_credit_entries
  FOR INSERT
  TO public
  WITH CHECK (true);

-- OPTIONAL: If you need UPDATE/DELETE later, add similar policies.

-- 1. Performance Optimization: Functional Indexes
-- Makes Public Inquiry case-insensitive searches lightning fast
CREATE INDEX IF NOT EXISTS idx_employees_last_name_lower ON public.employees (LOWER(last_name));
CREATE INDEX IF NOT EXISTS idx_employees_no ON public.employees (employee_no);

-- 2. Security: Advanced RLS Enforcement
-- We move role-based logic into the database so it's impossible to bypass via the frontend.

-- Enable RLS on core tables (just in case they aren't already)
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_applications ENABLE ROW LEVEL SECURITY;

-- Employees Table Policies
DROP POLICY IF EXISTS "Admins can view all employees" ON public.employees;
CREATE POLICY "Admins can view all employees" ON public.employees
FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'super_admin' OR role = 'admin'))
);

DROP POLICY IF EXISTS "Admins can insert employees" ON public.employees;
CREATE POLICY "Admins can insert employees" ON public.employees
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'super_admin' OR role = 'admin'))
);

DROP POLICY IF EXISTS "Admins can update employees" ON public.employees;
CREATE POLICY "Admins can update employees" ON public.employees
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'super_admin' OR role = 'admin'))
);

DROP POLICY IF EXISTS "Super Admins can delete employees" ON public.employees;
CREATE POLICY "Super Admins can delete employees" ON public.employees
FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- 3. Audit System: Track all administrative changes
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    performed_by UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generic Audit Trigger Function
CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    v_old_data JSONB := NULL;
    v_new_data JSONB := NULL;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        v_old_data := to_jsonb(OLD);
    ELSIF (TG_OP = 'UPDATE') THEN
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
    ELSIF (TG_OP = 'INSERT') THEN
        v_new_data := to_jsonb(NEW);
    END IF;

    INSERT INTO public.audit_logs (performed_by, action, table_name, record_id, old_data, new_data)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, COALESCE(OLD.id, NEW.id), v_old_data, v_new_data);
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply Audit to Employees
DROP TRIGGER IF EXISTS audit_employees_trigger ON public.employees;
CREATE TRIGGER audit_employees_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.employees
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- Apply Audit to Leave Applications
DROP TRIGGER IF EXISTS audit_leaves_trigger ON public.leave_applications;
CREATE TRIGGER audit_leaves_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.leave_applications
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

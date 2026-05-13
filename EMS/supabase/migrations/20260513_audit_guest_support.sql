-- 1. Add guest_actor_name to audit_logs
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS guest_actor_name TEXT;

-- 2. Update process_audit_log trigger to handle web submissions
CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    v_old_data JSONB := NULL;
    v_new_data JSONB := NULL;
    v_guest_name TEXT := NULL;
    v_emp_row RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        v_old_data := to_jsonb(OLD);
    ELSIF (TG_OP = 'UPDATE') THEN
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
    ELSIF (TG_OP = 'INSERT') THEN
        v_new_data := to_jsonb(NEW);
        
        -- Special handling for public leave submissions
        IF (TG_TABLE_NAME = 'leave_applications' AND (NEW.is_web_submission = true)) THEN
            SELECT first_name, last_name INTO v_emp_row FROM public.employees WHERE id = NEW.employee_id;
            IF FOUND THEN
                v_guest_name := v_emp_row.first_name || ' ' || v_emp_row.last_name;
            END IF;
        END IF;
    END IF;

    INSERT INTO public.audit_logs (
        performed_by, 
        action, 
        table_name, 
        record_id, 
        old_data, 
        new_data,
        guest_actor_name
    )
    VALUES (
        CASE WHEN v_guest_name IS NOT NULL THEN NULL ELSE auth.uid() END, 
        TG_OP, 
        TG_TABLE_NAME, 
        COALESCE(OLD.id, NEW.id), 
        v_old_data, 
        v_new_data,
        v_guest_name
    );
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

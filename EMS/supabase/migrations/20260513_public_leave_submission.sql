-- Add is_web_submission column
ALTER TABLE public.leave_applications ADD COLUMN IF NOT EXISTS is_web_submission BOOLEAN DEFAULT false;

-- Create secure RPC for public leave submission
CREATE OR REPLACE FUNCTION submit_public_leave_application(
    p_emp_no TEXT,
    p_last_name TEXT,
    p_leave_data JSONB
)
RETURNS UUID AS $$
DECLARE
    v_emp_id UUID;
    v_new_app_id UUID;
BEGIN
    -- 1. Verify Employee
    SELECT id INTO v_emp_id
    FROM employees
    WHERE employee_no = p_emp_no
    AND LOWER(last_name) = LOWER(p_last_name);

    IF v_emp_id IS NULL THEN
        RAISE EXCEPTION 'Identity verification failed.';
    END IF;

    -- 2. Insert Application
    INSERT INTO public.leave_applications (
        employee_id,
        date_of_filing,
        type_of_leave,
        other_leave_purpose,
        vacation_location,
        vacation_abroad_dest,
        sick_leave_type,
        sick_leave_illness,
        women_leave_illness,
        study_leave_type,
        start_date,
        end_date,
        working_days,
        inclusive_dates,
        status,
        is_web_submission
    ) VALUES (
        v_emp_id,
        (p_leave_data->>'date_of_filing')::DATE,
        p_leave_data->>'type_of_leave',
        p_leave_data->>'other_leave_purpose',
        p_leave_data->>'vacation_location',
        p_leave_data->>'vacation_abroad_dest',
        p_leave_data->>'sick_leave_type',
        p_leave_data->>'sick_leave_illness',
        p_leave_data->>'women_leave_illness',
        p_leave_data->>'study_leave_type',
        (p_leave_data->>'start_date')::DATE,
        (p_leave_data->>'end_date')::DATE,
        (p_leave_data->>'working_days')::INTEGER,
        p_leave_data->>'inclusive_dates',
        'Pending',
        true
    )
    RETURNING id INTO v_new_app_id;

    RETURN v_new_app_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

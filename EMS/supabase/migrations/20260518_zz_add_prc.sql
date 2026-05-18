-- Migration: Add PRC fields to employees table and update public inquiry RPC
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS prc_number TEXT,
ADD COLUMN IF NOT EXISTS prc_expiration DATE;

CREATE OR REPLACE FUNCTION get_public_personnel_data(p_emp_no TEXT, p_last_name TEXT)
RETURNS JSONB AS $$
DECLARE
  v_personnel JSONB;
BEGIN
  -- Get Personnel Info (Filtered for Privacy, including Employment & Personal/Contact details, salary parameters, and PRC info)
  SELECT jsonb_build_object(
    'employee_no', employee_no,
    'first_name', first_name,
    'last_name', last_name,
    'middle_name', middle_name,
    'position', position,
    'department', department,
    'school_level', school_level,
    'photo_url', photo_url,
    'personnel_category', personnel_category,
    'gender', gender,
    'birthdate', birthdate,
    'civil_status', civil_status,
    'contact_no', contact_no,
    'edu_email', edu_email,
    'personal_email', personal_email,
    'item_no', item_no,
    'original_appointment_date', original_appointment_date,
    'last_promotion_date', last_promotion_date,
    'salary_grade', salary_grade,
    'step', step,
    'prc_number', prc_number,
    'prc_expiration', prc_expiration
  ) INTO v_personnel
  FROM employees
  WHERE employee_no = p_emp_no 
  AND LOWER(last_name) = LOWER(p_last_name);

  IF v_personnel IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'personnel', v_personnel
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

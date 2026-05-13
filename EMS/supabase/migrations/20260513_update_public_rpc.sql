-- Update public inquiry RPC to include leave balances
CREATE OR REPLACE FUNCTION get_public_personnel_data(p_emp_no TEXT, p_last_name TEXT)
RETURNS JSONB AS $$
DECLARE
  v_personnel JSONB;
  v_leaves JSONB;
BEGIN
  -- Get Personnel Info (Filtered for Privacy, now including leave balances)
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
    'local_leave_balance', local_leave_balance,
    'do_leave_balance', do_leave_balance
  ) INTO v_personnel
  FROM employees
  WHERE employee_no = p_emp_no 
  AND LOWER(last_name) = LOWER(p_last_name);

  IF v_personnel IS NULL THEN
    RETURN NULL;
  END IF;

  -- Get Recent Leaves
  SELECT jsonb_agg(jsonb_build_object(
    'leave_type', l.type_of_leave,
    'start_date', l.start_date,
    'end_date', l.end_date,
    'status', l.status,
    'created_at', l.created_at
  )) INTO v_leaves
  FROM (
    SELECT la.* FROM leave_applications la
    JOIN employees e ON la.employee_id = e.id
    WHERE e.employee_no = p_emp_no
    ORDER BY la.created_at DESC
    LIMIT 10
  ) l;

  RETURN jsonb_build_object(
    'personnel', v_personnel,
    'leaves', COALESCE(v_leaves, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Create Roles Enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('super_admin', 'admin');
    END IF;
END $$;

-- 2. Create Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    role user_role DEFAULT 'admin' NOT NULL,
    full_name TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 3. Trigger for new user
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (new.id, 'admin');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only create trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    END IF;
END $$;

-- 4. Public Inquiry RPC
CREATE OR REPLACE FUNCTION get_public_personnel_data(p_emp_no TEXT, p_last_name TEXT)
RETURNS JSONB AS $$
DECLARE
  v_personnel JSONB;
  v_leaves JSONB;
BEGIN
  -- Get Personnel Info (Filtered for Privacy)
  SELECT jsonb_build_object(
    'employee_no', employee_no,
    'first_name', first_name,
    'last_name', last_name,
    'middle_name', middle_name,
    'position', position,
    'department', department,
    'school_level', school_level,
    'photo_url', photo_url,
    'personnel_category', personnel_category
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

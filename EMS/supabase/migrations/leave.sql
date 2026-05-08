-- Create the leave_applications table
CREATE TABLE IF NOT EXISTS public.leave_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    date_of_filing DATE NOT NULL DEFAULT CURRENT_DATE,
    type_of_leave TEXT NOT NULL,
    leave_details TEXT,
    working_days INTEGER NOT NULL,
    inclusive_dates TEXT NOT NULL,
    commutation_requested BOOLEAN DEFAULT false,
    status TEXT NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.leave_applications ENABLE ROW LEVEL SECURITY;

-- Create policy for all operations (for development purposes, adjust as needed)
CREATE POLICY "Enable all operations for authenticated users" ON public.leave_applications FOR ALL USING (true);

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leave_applications_modtime
    BEFORE UPDATE ON public.leave_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();


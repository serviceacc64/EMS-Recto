-- Add Edu Email and Personal Email columns to employees table
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS edu_email TEXT,
ADD COLUMN IF NOT EXISTS personal_email TEXT;
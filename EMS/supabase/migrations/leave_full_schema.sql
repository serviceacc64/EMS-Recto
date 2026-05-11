-- CSC Form No. 6 — Full Schema Migration
-- Run this in Supabase SQL Editor

-- Section 6.B — Conditional Leave Details
ALTER TABLE public.leave_applications ADD COLUMN IF NOT EXISTS vacation_location TEXT;
ALTER TABLE public.leave_applications ADD COLUMN IF NOT EXISTS vacation_abroad_dest TEXT;
ALTER TABLE public.leave_applications ADD COLUMN IF NOT EXISTS sick_leave_type TEXT;
ALTER TABLE public.leave_applications ADD COLUMN IF NOT EXISTS sick_leave_illness TEXT;
ALTER TABLE public.leave_applications ADD COLUMN IF NOT EXISTS women_leave_illness TEXT;
ALTER TABLE public.leave_applications ADD COLUMN IF NOT EXISTS study_leave_type TEXT;
ALTER TABLE public.leave_applications ADD COLUMN IF NOT EXISTS other_leave_purpose TEXT;

-- Section 6.C — Leave Schedule
ALTER TABLE public.leave_applications ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE public.leave_applications ADD COLUMN IF NOT EXISTS end_date DATE;

-- Applicant signature date
ALTER TABLE public.leave_applications ADD COLUMN IF NOT EXISTS date_signed DATE;

-- Section 7.A — HR Certification of Leave Credits
ALTER TABLE public.leave_applications ADD COLUMN IF NOT EXISTS as_of_date DATE;
ALTER TABLE public.leave_applications ADD COLUMN IF NOT EXISTS vl_total_earned NUMERIC(8,3);
ALTER TABLE public.leave_applications ADD COLUMN IF NOT EXISTS vl_less_application NUMERIC(8,3);
ALTER TABLE public.leave_applications ADD COLUMN IF NOT EXISTS vl_balance NUMERIC(8,3);
ALTER TABLE public.leave_applications ADD COLUMN IF NOT EXISTS sl_total_earned NUMERIC(8,3);
ALTER TABLE public.leave_applications ADD COLUMN IF NOT EXISTS sl_less_application NUMERIC(8,3);
ALTER TABLE public.leave_applications ADD COLUMN IF NOT EXISTS sl_balance NUMERIC(8,3);
ALTER TABLE public.leave_applications ADD COLUMN IF NOT EXISTS hr_officer_name TEXT;
ALTER TABLE public.leave_applications ADD COLUMN IF NOT EXISTS hr_officer_position TEXT;

-- Section 7.B — Recommendation
ALTER TABLE public.leave_applications ADD COLUMN IF NOT EXISTS recommendation TEXT;
ALTER TABLE public.leave_applications ADD COLUMN IF NOT EXISTS rec_disapproval_reason TEXT;
ALTER TABLE public.leave_applications ADD COLUMN IF NOT EXISTS recommending_officer_name TEXT;
ALTER TABLE public.leave_applications ADD COLUMN IF NOT EXISTS recommending_officer_position TEXT;

-- Section 7.C — Final Decision
ALTER TABLE public.leave_applications ADD COLUMN IF NOT EXISTS final_decision TEXT;
ALTER TABLE public.leave_applications ADD COLUMN IF NOT EXISTS approving_officer_name TEXT;
ALTER TABLE public.leave_applications ADD COLUMN IF NOT EXISTS approving_officer_position TEXT;

-- Section 7.D — Approved Leave Details
ALTER TABLE public.leave_applications ADD COLUMN IF NOT EXISTS days_with_pay NUMERIC(6,3);
ALTER TABLE public.leave_applications ADD COLUMN IF NOT EXISTS days_without_pay NUMERIC(6,3);
ALTER TABLE public.leave_applications ADD COLUMN IF NOT EXISTS days_others TEXT;

-- Section 7.E — Disapproval
ALTER TABLE public.leave_applications ADD COLUMN IF NOT EXISTS disapproval_reason TEXT;

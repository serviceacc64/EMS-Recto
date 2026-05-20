const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '../src/lib/salaryData.js');
const destPath = path.join(__dirname, '../supabase/migrations/20260520_salary_rates.sql');

const content = fs.readFileSync(srcPath, 'utf8');

// Find start of SALARY_TABLE object
const startMarker = 'export const SALARY_TABLE = {';
const startIdx = content.indexOf(startMarker);
if (startIdx === -1) {
  console.error("Could not find start marker");
  process.exit(1);
}

// Find the closing brace of SALARY_TABLE (the }; after the start marker)
const endIdx = content.indexOf('};', startIdx);
if (endIdx === -1) {
  console.error("Could not find end marker");
  process.exit(1);
}

// Extract only the object part (excluding the closing semicolon)
const objectStr = content.substring(startIdx + 'export const SALARY_TABLE ='.length, endIdx + 1).trim();

// Evaluate it in a safe context
let salaryTable;
try {
  salaryTable = eval('(' + objectStr + ')');
} catch (e) {
  console.error("Failed to parse SALARY_TABLE:", e);
  process.exit(1);
}

// Generate SQL
let sql = `-- Migration to create salary_rates table and populate seed data
CREATE TABLE IF NOT EXISTS salary_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salary_grade INT NOT NULL,
  step INT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (salary_grade, step)
);

-- Enable RLS
ALTER TABLE salary_rates ENABLE ROW LEVEL SECURITY;

-- Select policy: Authenticated users and Guests (anon) can read rates
CREATE POLICY "Allow public read salary_rates" ON salary_rates
  FOR SELECT TO anon, authenticated USING (true);

-- Write policy: Only Super Admins can insert/update/delete
CREATE POLICY "Allow write salary_rates for super_admin" ON salary_rates
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Apply Audit Trigger
DROP TRIGGER IF EXISTS audit_salary_rates_trigger ON public.salary_rates;
CREATE TRIGGER audit_salary_rates_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.salary_rates
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- Populate Seed Data
INSERT INTO salary_rates (id, salary_grade, step, amount) VALUES
`;

const valueRows = [];
for (const grade in salaryTable) {
  for (const step in salaryTable[grade]) {
    const amount = salaryTable[grade][step];
    valueRows.push(`  (gen_random_uuid(), ${grade}, ${step}, ${amount})`);
  }
}

sql += valueRows.join(',\n') + '\nON CONFLICT (salary_grade, step) DO UPDATE SET amount = EXCLUDED.amount;\n';

fs.writeFileSync(destPath, sql, 'utf8');
console.log(`Successfully generated migration file: ${destPath}`);

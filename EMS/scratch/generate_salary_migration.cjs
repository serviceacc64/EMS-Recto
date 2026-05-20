const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '../src/lib/salaryData.js');
const destPath = path.join(__dirname, '../supabase/migrations/20260520_salary_rates.sql');

const content = fs.readFileSync(srcPath, 'utf8');

// Simple extractor for the SALARY_TABLE constant
const startIdx = content.indexOf('export const SALARY_TABLE = {');
const endIdx = content.indexOf('};', startIdx);
const objectStr = content.substring(startIdx + 'export const SALARY_TABLE ='.length, endIdx + 2);

// Evaluate it in a safe context to get the object
let salaryTable;
try {
  // Replace export statement and convert to standard JS object notation
  salaryTable = eval('(' + objectStr + ')');
} catch (e) {
  console.error("Evaluation failed:", e);
  process.exit(1);
}

// Generate SQL
let sql = `-- Migration to create salary_rates table and populate seed data
CREATE TABLE IF NOT EXISTS salary_rates (
  salary_grade INT NOT NULL,
  step INT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (salary_grade, step)
);

-- Enable RLS
ALTER TABLE salary_rates ENABLE ROW LEVEL SECURITY;

-- Select policy: Authenticated users and Guests (anon) can read rates
CREATE POLICY "Allow public read salary_rates" ON salary_rates
  FOR SELECT TO anon, authenticated USING (true);

-- Write policy: Only Admins and Super Admins can insert/update/delete
CREATE POLICY "Allow write salary_rates for admin and super_admin" ON salary_rates
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Populate Seed Data
INSERT INTO salary_rates (salary_grade, step, amount) VALUES
`;

const valueRows = [];
for (const grade in salaryTable) {
  for (const step in salaryTable[grade]) {
    const amount = salaryTable[grade][step];
    valueRows.push(`  (${grade}, ${step}, ${amount})`);
  }
}

sql += valueRows.join(',\n') + '\nON CONFLICT (salary_grade, step) DO UPDATE SET amount = EXCLUDED.amount;\n';

fs.writeFileSync(destPath, sql, 'utf8');
console.log(`Successfully generated migration file: ${destPath}`);

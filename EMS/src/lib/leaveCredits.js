import { supabase } from "../lib/supabaseClient";

/**
 * Add a leave credit entry and update the employee's leave balance.
 *
 * @param {Object} params
 * @param {string} params.employeeId   - Supabase `employees.id`
 * @param {"local"|"do"} params.leaveType - Which balance to affect
 * @param {number} params.amount       - Number of days to credit (positive)
 * @param {"service_credit"|"event"|"other"} params.sourceType - Origin category
 * @param {string} [params.sourceDesc]  - Free‑text description for "other"
 * @param {string} params.startDate    - ISO date string (YYYY‑MM‑DD)
 * @param {string} params.endDate      - ISO date string (YYYY‑MM‑DD)
 */
export async function addLeaveCredit({
  employeeId,
  leaveType,
  amount,
  sourceType,
  sourceDesc = null,
  startDate,
  endDate,
}) {
  if (!employeeId) throw new Error("employeeId is required");
  if (!['local', 'do'].includes(leaveType)) throw new Error("Invalid leaveType");
  if (amount <= 0) throw new Error("Amount must be positive");
  if (new Date(endDate) < new Date(startDate)) {
    throw new Error("endDate cannot be before startDate");
  }

  // 1️⃣ Insert credit entry
  const { data: entry, error: insErr } = await supabase
    .from("leave_credit_entries")
    .insert([
      {
        employee_id: employeeId,
        leave_type: leaveType,
        amount_days: amount,
        source_type: sourceType,
        source_desc: sourceDesc,
        start_date: startDate,
        end_date: endDate,
      },
    ])
    .single();

  if (insErr) throw insErr;

  // 2️⃣ Update employee balance (read‑modify‑write to keep it simple)
  const balanceField = leaveType === "local" ? "local_leave_balance" : "do_leave_balance";
  const { data: emp, error: empErr } = await supabase
    .from("employees")
    .select(balanceField)
    .eq("id", employeeId)
    .single();

  if (empErr) throw empErr;

  const currentBal = Number(emp[balanceField] ?? 0);
  const newBal = currentBal + Number(amount);

  const { error: updErr } = await supabase
    .from("employees")
    .update({ [balanceField]: newBal })
    .eq("id", employeeId);

  if (updErr) throw updErr;

  return entry;
}

/**
 * Directly set (overwrite) an employee's leave balance baselines.
 * Does NOT create a leave_credit_entries row — this is a simple,
 * one‑shot "set the starting values" operation.
 *
 * @param {Object} params
 * @param {string} params.employeeId - Supabase `employees.id`
 * @param {number} params.localBalance - New Local Leave balance
 * @param {number} params.doBalance    - New D.O. Leave balance
 */
export async function setLeaveBaseline({ employeeId, localBalance, doBalance }) {
  if (!employeeId) throw new Error("employeeId is required");
  if (localBalance < 0 || doBalance < 0) {
    throw new Error("Balance values cannot be negative");
  }

  const { error } = await supabase
    .from("employees")
    .update({
      local_leave_balance: Number(localBalance),
      do_leave_balance: Number(doBalance),
    })
    .eq("id", employeeId);

  if (error) throw error;
}

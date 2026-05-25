import React, { useState } from "react";
import { addLeaveCredit } from "../lib/leaveCredits";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";

/**
 * Modal component used by super admins to add a credit entry to an employee.
 * Props:
 *   - isOpen (bool)   : show/hide modal
 *   - onClose (func)  : callback to close the modal
 *   - employeeId (string) : Supabase employee id (UUID)
 *   - afterAdd (func) : optional callback after successful add (e.g., refresh list)
 */
export default function LeaveCreditModal({ isOpen, onClose, employeeId, afterAdd }) {
  const { isSuperAdmin } = useAuth();
  const [leaveType, setLeaveType] = useState("local"); // "local" | "do"
  const [sourceType, setSourceType] = useState("service_credit"); // "service_credit" | "event" | "other"
  const [sourceDesc, setSourceDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isSuperAdmin) return null;

  const resetForm = () => {
    setLeaveType("local");
    setSourceType("service_credit");
    setSourceDesc("");
    setAmount("");
    setStartDate("");
    setEndDate("");
    setErrorMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    // Basic validation
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setErrorMsg("Please enter a valid positive number of days.");
      return;
    }
    if (!startDate || !endDate) {
      setErrorMsg("Both start and end dates are required.");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setErrorMsg("Start date cannot be after end date.");
      return;
    }
    setIsSubmitting(true);
    try {
      await addLeaveCredit({
        employeeId,
        leaveType,
        amount: Number(amount),
        sourceType,
        sourceDesc: sourceType === "other" ? sourceDesc : null,
        startDate,
        endDate,
      });
      // Optionally refresh parent data
      if (afterAdd) await afterAdd();
      resetForm();
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to add credit.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-surface rounded-[24px] shadow-xl w-full max-w-md p-6 animate-[slideIn_0.2s_ease-out]">
        <h2 className="text-text-main text-xl font-bold mb-4">Add Leave Credit</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Leave Type */}
          <div>
            <label className="block text-sm font-medium mb-1">Leave Type</label>
            <select
              className="w-full bg-surface border border-border-subtle rounded-xl p-2"
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
            >
              <option value="local">Local Leave</option>
              <option value="do">D.O. Leave</option>
            </select>
          </div>
          {/* Source Type */}
          <div>
            <label className="block text-sm font-medium mb-1">Source</label>
            <select
              className="w-full bg-surface border border-border-subtle rounded-xl p-2"
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value)}
            >
              <option value="service_credit">Service Credits</option>
              <option value="event">Event (e.g., Brigada)</option>
              <option value="other">Other (custom)</option>
            </select>
          </div>
          {/* Custom description for Other */}
          {sourceType === "other" && (
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <input
                type="text"
                className="w-full bg-surface border border-border-subtle rounded-xl p-2"
                value={sourceDesc}
                onChange={(e) => setSourceDesc(e.target.value)}
                placeholder="Enter source description"
                required
              />
            </div>
          )}
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium mb-1">Days</label>
            <input
              type="number"
              min="0.5"
              step="0.5"
              className="w-full bg-surface border border-border-subtle rounded-xl p-2"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g., 3"
              required
            />
          </div>
          {/* Date range */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input
                type="date"
                className="w-full bg-surface border border-border-subtle rounded-xl p-2"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="date"
                className="w-full bg-surface border border-border-subtle rounded-xl p-2"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>
          {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}
          <div className="flex justify-end space-x-2 mt-4">
            <button
              type="button"
              onClick={() => { resetForm(); onClose(); }}
              className="px-4 py-2 bg-surface-alt text-text-muted rounded-md border border-border-subtle hover:bg-surface"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-accent text-accent-text rounded-md font-bold hover:bg-accent-dark transition"
            >
              {isSubmitting ? "Saving…" : "Save Credit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useTransition } from "react";
import { supabase } from "../lib/supabaseClient";
import { getActiveSalaryTable, initSalaryTable } from "../lib/salaryData";
import { useNotifications } from "../context/NotificationContext";

const SalaryRates = () => {
  const { showToast } = useNotifications();
  const [isPending, startTransition] = useTransition();

  // Load the initial salary table from the library cache
  const [salaryTable, setSalaryTable] = useState(() => getActiveSalaryTable());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Tracks edits: { [grade]: { [step]: newValue } }
  const [draftTable, setDraftTable] = useState({});
  // Tracks currently focused input: { grade, step }
  const [editingCell, setEditingCell] = useState(null);
  // Temporary string value during editing
  const [editValue, setEditValue] = useState("");

  // Bulk adjustment states
  const [adjustMode, setAdjustMode] = useState("percentage"); // 'percentage' or 'fixed'
  const [adjustValue, setAdjustValue] = useState("");
  const [adjustGradeStart, setAdjustGradeStart] = useState("1");
  const [adjustGradeEnd, setAdjustGradeEnd] = useState("33");
  const [adjustStep, setAdjustStep] = useState("all"); // 'all' or '1'-'8'

  // Fetch from DB to make sure we are in sync
  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    setLoading(true);
    try {
      const refreshed = await initSalaryTable();
      setSalaryTable({ ...refreshed });
      setDraftTable({});
    } catch (err) {
      console.error("Error reloading rates:", err);
      showToast("Failed to reload salary rates from database.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCellClick = (grade, step, currentValue) => {
    // Grade 33 only has steps 1 and 2
    if (grade === 33 && step > 2) return;

    setEditingCell({ grade, step });
    setEditValue(String(currentValue));
  };

  const handleCellSave = () => {
    if (!editingCell) return;
    const { grade, step } = editingCell;

    const numValue = parseFloat(editValue);
    if (isNaN(numValue) || numValue < 0) {
      showToast("Please enter a valid positive number.", "warning");
      setEditingCell(null);
      return;
    }

    const roundedValue = Math.round(numValue * 100) / 100;
    const originalValue = salaryTable[grade]?.[step] || 0;

    if (roundedValue === originalValue) {
      // Remove from drafts if value matches original
      const updatedDraft = { ...draftTable };
      if (updatedDraft[grade]) {
        delete updatedDraft[grade][step];
        if (Object.keys(updatedDraft[grade]).length === 0) {
          delete updatedDraft[grade];
        }
      }
      setDraftTable(updatedDraft);
    } else {
      // Add to drafts
      setDraftTable((prev) => ({
        ...prev,
        [grade]: {
          ...(prev[grade] || {}),
          [step]: roundedValue,
        },
      }));
    }

    setEditingCell(null);
  };

  const handleCellKeyDown = (e) => {
    if (e.key === "Enter") {
      handleCellSave();
    } else if (e.key === "Escape") {
      setEditingCell(null);
    }
  };

  // Run the bulk calculation and load into draftTable
  const applyBulkAdjustment = () => {
    const value = parseFloat(adjustValue);
    if (isNaN(value) || value === 0) {
      showToast("Please enter a non-zero adjustment value.", "warning");
      return;
    }

    const startG = parseInt(adjustGradeStart, 10);
    const endG = parseInt(adjustGradeEnd, 10);

    if (startG > endG || startG < 1 || endG > 33) {
      showToast("Please enter a valid Salary Grade range (1 to 33).", "warning");
      return;
    }

    const updatedDraft = { ...draftTable };

    for (let grade = startG; grade <= endG; grade++) {
      const maxStep = grade === 33 ? 2 : 8;
      const stepsToAdjust = adjustStep === "all" 
        ? Array.from({ length: maxStep }, (_, i) => i + 1)
        : [parseInt(adjustStep, 10)];

      stepsToAdjust.forEach((step) => {
        if (step > maxStep) return;

        // Base rate is draft value if it exists, otherwise original DB value
        const baseVal = updatedDraft[grade]?.[step] !== undefined
          ? updatedDraft[grade][step]
          : (salaryTable[grade]?.[step] || 0);

        let newVal = baseVal;
        if (adjustMode === "percentage") {
          newVal = baseVal * (1 + value / 100);
        } else {
          newVal = baseVal + value;
        }

        newVal = Math.round(newVal);
        if (newVal < 0) newVal = 0;

        const originalValue = salaryTable[grade]?.[step] || 0;

        if (newVal === originalValue) {
          if (updatedDraft[grade]) {
            delete updatedDraft[grade][step];
            if (Object.keys(updatedDraft[grade]).length === 0) {
              delete updatedDraft[grade];
            }
          }
        } else {
          if (!updatedDraft[grade]) updatedDraft[grade] = {};
          updatedDraft[grade][step] = newVal;
        }
      });
    }

    setDraftTable(updatedDraft);
    showToast("Bulk adjustment preview applied to grid.", "info");
  };

  const handleReset = () => {
    setDraftTable({});
    setEditingCell(null);
    showToast("All draft changes discarded.", "info");
  };

  const handleSaveChanges = async () => {
    const upsertRows = [];
    const changeLogDetails = [];

    for (const grade in draftTable) {
      for (const step in draftTable[grade]) {
        const val = draftTable[grade][step];
        const originalVal = salaryTable[grade]?.[step] || 0;
        upsertRows.push({
          salary_grade: parseInt(grade, 10),
          step: parseInt(step, 10),
          amount: val,
        });
        changeLogDetails.push(`SG ${grade} Step ${step}: ₱${originalVal} ➔ ₱${val}`);
      }
    }

    if (upsertRows.length === 0) return;

    setSaving(true);
    try {
      // 1. Bulk Upsert in Supabase
      const { error } = await supabase
        .from("salary_rates")
        .upsert(upsertRows, { onConflict: "salary_grade,step" });

      if (error) throw error;

      // 2. Refresh local library cache
      const refreshed = await initSalaryTable();
      setSalaryTable({ ...refreshed });
      setDraftTable({});
      showToast("Salary rates updated successfully.", "success");
    } catch (err) {
      console.error("Error saving salary rates:", err);
      showToast("Failed to save changes to database.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Helper to get active value (draft value if exists, else loaded database value)
  const getCellValue = (grade, step) => {
    if (draftTable[grade]?.[step] !== undefined) {
      return draftTable[grade][step];
    }
    return salaryTable[grade]?.[step] || 0;
  };

  const isCellDirty = (grade, step) => {
    return draftTable[grade]?.[step] !== undefined;
  };

  const countDraftChanges = () => {
    let count = 0;
    Object.values(draftTable).forEach((steps) => {
      count += Object.keys(steps).length;
    });
    return count;
  };

  const totalChanges = countDraftChanges();

  return (
    <div className="flex flex-col h-full animate-[fadeIn_0.4s_ease-out] relative">
      {/* Header section */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-1 h-4 bg-accent rounded-full opacity-50"></div>
            <span className="text-[10px] font-black text-text-placeholder uppercase tracking-[0.3em]">
              System Configuration
            </span>
          </div>
          <h2 className="text-text-main text-lg font-black tracking-tight mt-1 m-0">
            Salary Grade Rates Configuration
          </h2>
        </div>
        <button
          onClick={fetchRates}
          disabled={loading || saving}
          className="w-10 h-10 rounded-xl bg-surface border border-border-subtle text-text-main hover:bg-surface-alt transition-all flex items-center justify-center shadow-sm disabled:opacity-50"
          title="Reload from Database"
        >
          <i className={`fas fa-sync-alt text-xs ${loading ? "animate-spin" : ""}`}></i>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start flex-1 min-h-0 mb-20">
        {/* Bulk Adjustment Card */}
        <div className="xl:col-span-1 bg-surface border border-border-subtle rounded-[24px] p-5 shadow-sm space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <i className="fas fa-sliders text-accent text-sm"></i>
            <h3 className="text-text-main text-sm font-black uppercase tracking-wider m-0">
              Bulk Adjustments
            </h3>
          </div>
          
          <p className="text-text-muted text-[11px] font-medium leading-relaxed m-0">
            Apply changes to multiple rows at once. Changes are loaded as drafts in the table grid below. Review the values, then click **Save** to apply them permanently.
          </p>

          <div className="space-y-4">
            {/* Adjustment Mode */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-text-placeholder uppercase tracking-wider block">
                Adjustment Type
              </label>
              <div className="flex bg-surface-alt/50 border border-border-subtle p-1 rounded-xl shadow-sm">
                <button
                  onClick={() => setAdjustMode("percentage")}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                    adjustMode === "percentage"
                      ? "bg-surface shadow-sm text-accent border border-border-subtle"
                      : "text-text-muted hover:text-text-main"
                  }`}
                >
                  Percentage (%)
                </button>
                <button
                  onClick={() => setAdjustMode("fixed")}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                    adjustMode === "fixed"
                      ? "bg-surface shadow-sm text-accent border border-border-subtle"
                      : "text-text-muted hover:text-text-main"
                  }`}
                >
                  Fixed (₱)
                </button>
              </div>
            </div>

            {/* Value */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-text-placeholder uppercase tracking-wider block">
                Adjustment Value
              </label>
              <div className="relative group">
                <input
                  type="number"
                  placeholder={adjustMode === "percentage" ? "e.g., 5 for +5%" : "e.g., 1500 for +₱1,500"}
                  value={adjustValue}
                  onChange={(e) => setAdjustValue(e.target.value)}
                  className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-[12px] text-text-main font-bold placeholder:text-text-placeholder/60 outline-none focus:border-accent focus:ring-4 focus:ring-accent/5 shadow-sm transition-all"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-placeholder font-black text-[11px] pointer-events-none">
                  {adjustMode === "percentage" ? "%" : "₱"}
                </div>
              </div>
            </div>

            {/* Salary Grade Range */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-text-placeholder uppercase tracking-wider block">
                Salary Grade Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <select
                    value={adjustGradeStart}
                    onChange={(e) => setAdjustGradeStart(e.target.value)}
                    className="w-full bg-surface border border-border-subtle rounded-xl pl-3 pr-8 py-2.5 text-[11px] font-black uppercase tracking-wider outline-none focus:border-accent shadow-sm appearance-none cursor-pointer"
                  >
                    {Array.from({ length: 33 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>SG {i + 1}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-placeholder pointer-events-none text-[8px]">
                    <i className="fas fa-chevron-down"></i>
                  </div>
                </div>

                <div className="relative">
                  <select
                    value={adjustGradeEnd}
                    onChange={(e) => setAdjustGradeEnd(e.target.value)}
                    className="w-full bg-surface border border-border-subtle rounded-xl pl-3 pr-8 py-2.5 text-[11px] font-black uppercase tracking-wider outline-none focus:border-accent shadow-sm appearance-none cursor-pointer"
                  >
                    {Array.from({ length: 33 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>SG {i + 1}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-placeholder pointer-events-none text-[8px]">
                    <i className="fas fa-chevron-down"></i>
                  </div>
                </div>
              </div>
            </div>

            {/* Steps Range */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-text-placeholder uppercase tracking-wider block">
                Steps Affected
              </label>
              <div className="relative">
                <select
                  value={adjustStep}
                  onChange={(e) => setAdjustStep(e.target.value)}
                  className="w-full bg-surface border border-border-subtle rounded-xl pl-4 pr-10 py-2.5 text-[11px] font-black uppercase tracking-wider outline-none focus:border-accent shadow-sm appearance-none cursor-pointer"
                >
                  <option value="all">All Steps (1 to 8)</option>
                  {Array.from({ length: 8 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>Step {i + 1}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-placeholder pointer-events-none text-[8px]">
                  <i className="fas fa-chevron-down"></i>
                </div>
              </div>
            </div>

            <button
              onClick={applyBulkAdjustment}
              disabled={loading || saving}
              className="w-full py-2.5 rounded-xl bg-accent/5 hover:bg-accent hover:text-accent-text border border-accent/20 text-accent font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-sm mt-2 disabled:opacity-50"
            >
              Apply Adjustment Preview
            </button>
          </div>
        </div>

        {/* Dynamic Matrix Configuration Grid */}
        <div className="xl:col-span-3 bg-surface border border-border-subtle rounded-[24px] overflow-hidden shadow-sm flex flex-col min-h-0 h-[600px]">
          <div className="overflow-auto custom-scrollbar flex-1">
            <table className="w-full text-left border-collapse text-[13px] table-fixed min-w-[900px]">
              <thead className="sticky top-0 bg-surface/90 backdrop-blur-md z-10 border-b border-border-subtle">
                <tr>
                  <th className="p-4 w-[12%] font-black uppercase tracking-widest text-[10px] text-text-placeholder">
                    Grade
                  </th>
                  {Array.from({ length: 8 }, (_, i) => (
                    <th key={i} className="p-4 w-[11%] font-black uppercase tracking-widest text-[10px] text-text-placeholder text-right">
                      Step {i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/50">
                {loading ? (
                  Array(12)
                    .fill(0)
                    .map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan="9" className="p-4 h-12 bg-surface-alt/10"></td>
                      </tr>
                    ))
                ) : (
                  Array.from({ length: 33 }, (_, i) => {
                    const gradeNum = i + 1;
                    return (
                      <tr key={gradeNum} className="hover:bg-surface-alt/30 transition-colors group">
                        <td className="p-4 font-black text-text-main text-[12px] bg-surface-alt/20">
                          SG-{gradeNum}
                        </td>
                        {Array.from({ length: 8 }, (_, sIdx) => {
                          const stepNum = sIdx + 1;
                          const isEditable = !(gradeNum === 33 && stepNum > 2);
                          const activeVal = getCellValue(gradeNum, stepNum);
                          const dirty = isCellDirty(gradeNum, stepNum);
                          const isEditing =
                            editingCell?.grade === gradeNum && editingCell?.step === stepNum;

                          if (!isEditable) {
                            return (
                              <td
                                key={stepNum}
                                className="p-4 text-right text-text-placeholder/30 font-bold text-[10px] uppercase italic bg-surface-alt/5 select-none"
                              >
                                —
                              </td>
                            );
                          }

                          return (
                            <td
                              key={stepNum}
                              onClick={() => handleCellClick(gradeNum, stepNum, activeVal)}
                              className={`p-4 text-right font-black text-[12px] cursor-pointer transition-all border border-transparent hover:bg-accent/5 hover:border-accent/10 relative ${
                                dirty
                                  ? "bg-amber-500/5 text-amber-500 hover:bg-amber-500/10"
                                  : "text-text-main"
                              }`}
                            >
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onBlur={handleCellSave}
                                  onKeyDown={handleCellKeyDown}
                                  autoFocus
                                  className="w-full bg-surface border-2 border-accent text-right outline-none px-2 py-1 rounded-lg text-text-main font-bold shadow-md text-[12px]"
                                />
                              ) : (
                                <div className="flex items-center justify-end gap-1.5 h-6">
                                  {dirty && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                  )}
                                  <span>
                                    {new Intl.NumberFormat("en-PH", {
                                      style: "currency",
                                      currency: "PHP",
                                      maximumFractionDigits: 0,
                                    }).format(activeVal)}
                                  </span>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Floating Bottom Drawer for Unsaved Changes */}
      {totalChanges > 0 && (
        <div className="sticky bottom-0 w-full bg-surface/95 backdrop-blur-md border border-border-subtle px-6 py-4 rounded-3xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 z-30 animate-[slideUp_0.3s_ease-out] transition-all mt-4">
          <div className="flex items-center gap-3 self-start sm:self-center">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
              <i className="fas fa-triangle-exclamation text-sm"></i>
            </div>
            <div>
              <h4 className="text-[12px] font-black text-text-main uppercase tracking-wider leading-none mb-1">
                Unsaved Matrix Changes
              </h4>
              <p className="text-[10px] text-text-placeholder font-medium m-0">
                You have <strong className="text-amber-500 font-bold">{totalChanges}</strong> unsaved salary rate modification{totalChanges > 1 ? "s" : ""}.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={handleReset}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl border border-border-subtle text-text-muted hover:text-text-main hover:bg-surface-alt transition-all font-black text-[10px] uppercase tracking-widest active:scale-95 disabled:opacity-50"
            >
              Reset Changes
            </button>
            <button
              onClick={handleSaveChanges}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-accent text-accent-text font-black text-[10px] uppercase tracking-widest shadow-lg shadow-accent/20 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all flex items-center gap-2 border border-accent/20 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <i className="fas fa-circle-notch animate-spin"></i>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-cloud-arrow-up"></i>
                  <span>Save Rates</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryRates;

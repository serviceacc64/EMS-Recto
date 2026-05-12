import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import LeaveFormModal from "../components/LeaveFormModal";
import LeaveStatusModal from "../components/LeaveStatusModal";
import LeaveViewModal from "../components/LeaveViewModal";

const LEAVE_TYPES_FILTER = [
  "All Types",
  "Vacation Leave",
  "Mandatory/Forced Leave",
  "Sick Leave",
  "Maternity Leave",
  "Paternity Leave",
  "Special Privilege Leave",
  "Solo Parent Leave",
  "Study Leave",
  "10-Day VAWC Leave",
  "Rehabilitation Privilege",
  "Special Leave Benefits for Women",
  "Special Emergency (Calamity) Leave",
  "Wellness Leave",
  "Adoption Leave",
  "Others",
];

const STATUS_CONFIG = {
  Pending: {
    label: "Pending",
    pillClass: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    dotClass: "bg-amber-400",
  },
  Approved: {
    label: "Approved",
    pillClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    dotClass: "bg-emerald-400",
  },
  Rejected: {
    label: "Rejected",
    pillClass: "bg-red-500/10 text-red-400 border-red-500/30",
    dotClass: "bg-red-400",
  },
};

const ITEMS_PER_PAGE = 10;

const LeaveTracker = () => {
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All Types");

  // Modals
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    action: null,
    record: null,
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("leave_applications")
      .select(
        `*, employees ( first_name, last_name, middle_name, position, employee_no )`
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching leave applications:", error);
    } else {
      setApplications(data || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // --- Stats ---
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "Pending").length,
    approvedThisMonth: applications.filter((a) => {
      if (a.status !== "Approved") return false;
      const filed = new Date(a.date_of_filing);
      return (
        filed.getMonth() === currentMonth && filed.getFullYear() === currentYear
      );
    }).length,
  };

  // --- Filtering ---
  const filtered = applications.filter((a) => {
    const empName = a.employees
      ? `${a.employees.last_name} ${a.employees.first_name} ${a.employees.middle_name || ""}`.toLowerCase()
      : "";
    const matchSearch =
      !searchTerm ||
      empName.includes(searchTerm.toLowerCase()) ||
      a.type_of_leave.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.employees?.employee_no || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus =
      statusFilter === "All"
        ? true
        : statusFilter === "Approved This Month"
        ? a.status === "Approved" &&
          new Date(a.date_of_filing).getMonth() === currentMonth &&
          new Date(a.date_of_filing).getFullYear() === currentYear
        : a.status === statusFilter;
    const matchType =
      typeFilter === "All Types" || a.type_of_leave === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter]);

  // --- Status Update ---
  const handleStatusUpdate = async (id, updates) => {
    const isApproving = updates.status === "Approved";

    // If approving, we need to handle the balance deduction logic
    if (isApproving) {
      const { data: app, error: fetchErr } = await supabase
        .from("leave_applications")
        .select("working_days, employee_id")
        .eq("id", id)
        .single();

      if (fetchErr || !app) {
        console.error("Error fetching application for deduction:", fetchErr);
        alert("Failed to process deduction: Application not found.");
        return;
      }

      // Fetch employee current balances
      const { data: emp, error: empErr } = await supabase
        .from("employees")
        .select("local_leave_balance, do_leave_balance")
        .eq("id", app.employee_id)
        .single();

      if (empErr || !emp) {
        console.error("Error fetching employee balances:", empErr);
        alert("Failed to process deduction: Employee balances not found.");
        return;
      }

      const requested = Number(app.working_days) || 0;
      let localBal = Number(emp.local_leave_balance) || 0;
      let doBal = Number(emp.do_leave_balance) || 0;

      // Deduction Logic:
      // 1. Deduct from Local Leave first
      const localDeduct = Math.min(requested, localBal);
      localBal -= localDeduct;

      // 2. Excess from D.O. Leave
      const remaining = requested - localDeduct;
      const doDeduct = Math.min(remaining, doBal);
      doBal -= doDeduct;

      // Update employee balances
      const { error: updateEmpErr } = await supabase
        .from("employees")
        .update({
          local_leave_balance: localBal,
          do_leave_balance: doBal
        })
        .eq("id", app.employee_id);

      if (updateEmpErr) {
        console.error("Error updating employee balances:", updateEmpErr);
        alert("Failed to update employee leave balances: " + updateEmpErr.message);
        return;
      }

      // Add the deduction info to the updates object for Section 7.D (Others)
      if (localDeduct > 0 || doDeduct > 0) {
        const deductionMsg = `[Auto-Deducted: ${Number(localDeduct)} from Local, ${Number(doDeduct)} from D.O.]`;
        updates.days_others = updates.days_others
          ? `${updates.days_others} ${deductionMsg}`
          : deductionMsg;
      }
    }

    const { error } = await supabase
      .from("leave_applications")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("Status update error:", error);
      alert("Failed to update status: " + error.message);
    } else {
      fetchApplications();
    }
  };

  const openStatusModal = (action, record) => {
    setStatusModal({ isOpen: true, action, record });
  };

  const closeStatusModal = () => {
    setStatusModal({ isOpen: false, action: null, record: null });
  };

  // --- Delete ---
  const promptDelete = (record) => {
    setDeletingRecord(record);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingRecord) return;
    setIsDeleting(true);
    const { error } = await supabase
      .from("leave_applications")
      .delete()
      .eq("id", deletingRecord.id);
    if (error) {
      alert("Failed to delete: " + error.message);
    } else {
      fetchApplications();
    }
    setIsDeleting(false);
    setIsDeleteModalOpen(false);
    setDeletingRecord(null);
  };

  // --- Helpers ---
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getInitials = (emp) => {
    if (!emp) return "??";
    return `${emp.last_name?.[0] || ""}${emp.first_name?.[0] || ""}`;
  };

  const getEmployeeName = (emp) => {
    if (!emp) return "Unknown";
    const mid = emp.middle_name ? ` ${emp.middle_name[0]}.` : "";
    return `${emp.last_name}, ${emp.first_name}${mid}`;
  };

  // --- Render ---
  return (
    <div className="flex flex-col h-full relative animate-[fadeIn_0.4s_ease-out]">

      {/* ── Summary Strip ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 shrink-0">
        {[
          {
            label: "Total Applications",
            value: stats.total,
            icon: "fa-file-alt",
            color: "text-accent",
            bg: "bg-accent/10",
            border: "border-accent/20",
            sub: "All time",
            filterValue: "All",
          },
          {
            label: "Pending Review",
            value: stats.pending,
            icon: "fa-clock",
            color: "text-amber-400",
            bg: "bg-amber-500/10",
            border: "border-amber-500/20",
            sub: "Awaiting action",
            filterValue: "Pending",
          },
          {
            label: "Approved This Month",
            value: stats.approvedThisMonth,
            icon: "fa-check-circle",
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/20",
            sub: new Date().toLocaleString("en-PH", { month: "long", year: "numeric" }),
            filterValue: "Approved This Month",
          },
        ].map((card, i) => {
          const isActive = statusFilter === card.filterValue;
          return (
            <div
              key={i}
              onClick={() => setStatusFilter(card.filterValue)}
              className={`bg-surface border rounded-[20px] p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group flex items-center gap-4 cursor-pointer ${
                isActive ? "border-accent ring-4 ring-accent/10" : "border-border-subtle"
              }`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 ${card.bg} ${card.border} transition-transform group-hover:scale-110`}>
                <i className={`fas ${card.icon} text-lg ${card.color}`}></i>
              </div>
              <div>
                <p className="text-text-placeholder text-[10px] font-black uppercase tracking-widest m-0">{card.label}</p>
                <h3 className={`text-3xl font-black m-0 ${card.color}`}>{card.value}</h3>
                <p className="text-text-placeholder text-[11px] font-medium m-0">{card.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4 shrink-0">
        {/* Search */}
        <div className="flex-1 flex items-center gap-3 bg-surface border border-border-subtle rounded-[14px] px-4 py-3 shadow-sm focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/10 transition-all">
          <i className="fas fa-search text-text-placeholder text-[15px]"></i>
          <input
            type="text"
            placeholder="Search by name or leave type…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-none outline-none w-full text-[14px] text-text-main bg-transparent font-medium placeholder:text-text-placeholder"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="text-text-placeholder hover:text-text-main transition-colors cursor-pointer"
            >
              <i className="fas fa-times text-[13px]"></i>
            </button>
          )}
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-surface border border-border-subtle text-text-main text-[13px] font-bold rounded-[12px] px-4 py-2.5 outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 shadow-sm cursor-pointer transition-all hover:border-accent/50"
        >
          {["All", "Pending", "Approved", "Rejected", "Approved This Month"].map((s) => (
            <option key={s} value={s}>{s === "All" ? "All Statuses" : s}</option>
          ))}
        </select>

        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-surface border border-border-subtle text-text-main text-[13px] font-bold rounded-[12px] px-4 py-2.5 outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 shadow-sm cursor-pointer transition-all hover:border-accent/50 max-w-[220px]"
        >
          {LEAVE_TYPES_FILTER.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <button
          onClick={() => setIsFileModalOpen(true)}
          className="inline-flex justify-center items-center gap-2 bg-emerald-500 text-white border border-emerald-600 px-5 py-2.5 rounded-[12px] cursor-pointer text-[13px] font-semibold transition-all duration-200 shadow-sm hover:bg-emerald-600 hover:scale-105 hover:shadow-md shrink-0 sm:ml-auto"
        >
          <i className="fas fa-file-signature"></i> File Leave Application
        </button>
      </div>

      {/* ── Table / States ── */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-surface border border-border-subtle rounded-[32px] p-16 shadow-sm text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-sm mb-2">
            <i className="fas fa-calendar-check text-emerald-500 text-[28px]"></i>
          </div>
          <h2 className="text-text-main text-xl font-black m-0">
            {applications.length === 0 ? "No Leave Records Yet" : "No Matching Records"}
          </h2>
          <p className="text-text-muted text-sm font-medium m-0 max-w-[360px]">
            {applications.length === 0
              ? 'Use the "File Leave Application" button to get started.'
              : "Try adjusting your search or filter criteria."}
          </p>
          {applications.length > 0 && (
            <button
              onClick={() => { setSearchTerm(""); setStatusFilter("All"); setTypeFilter("All Types"); }}
              className="mt-2 px-4 py-2 rounded-xl text-sm font-bold border border-border-subtle bg-surface text-text-muted hover:bg-surface-hover transition-all cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="flex-1 w-full min-h-0 overflow-auto border border-border-subtle rounded-[20px] bg-surface shadow-sm mb-4">
            <table className="w-full min-w-[900px] table-auto border-collapse text-[13px]">
              <thead className="bg-surface-alt sticky top-0 z-10 border-b border-border-subtle">
                <tr>
                  {["Employee", "Date Filed", "Leave Type", "Inclusive Dates", "Days", "Commutation", "Status", "Actions"].map((col) => (
                    <th
                      key={col}
                      className={`px-4 py-4 text-text-muted text-[11px] font-black uppercase tracking-widest whitespace-nowrap ${col === "Actions" ? "text-center" : "text-left"}`}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((app, i) => {
                  const sc = STATUS_CONFIG[app.status] || STATUS_CONFIG.Pending;
                  const isPending = app.status === "Pending";
                  const isApproved = app.status === "Approved";
                  const isRejected = app.status === "Rejected";

                  return (
                    <tr
                      key={app.id}
                      className={`transition-colors hover:bg-surface-hover ${i % 2 === 0 ? "bg-surface" : "bg-surface-alt/30"}`}
                    >
                      {/* Employee */}
                      <td className="px-4 py-3.5 border-b border-border-subtle">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-[10px] font-black text-accent shrink-0">
                            {getInitials(app.employees)}
                          </div>
                          <div>
                            <p className="text-text-main text-[13px] font-bold m-0 leading-tight whitespace-nowrap">
                              {getEmployeeName(app.employees)}
                            </p>
                            <p className="text-text-placeholder text-[10px] font-medium m-0">
                              {app.employees?.position || "—"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Date Filed */}
                      <td className="px-4 py-3.5 border-b border-border-subtle text-text-muted font-medium whitespace-nowrap">
                        {formatDate(app.date_of_filing)}
                      </td>

                      {/* Leave Type */}
                      <td className="px-4 py-3.5 border-b border-border-subtle text-text-main font-semibold">
                        {app.type_of_leave}
                        {app.leave_details && (
                          <span className="ml-1.5 text-[10px] text-text-placeholder font-medium">
                            ({app.leave_details})
                          </span>
                        )}
                      </td>

                      {/* Inclusive Dates */}
                      <td className="px-4 py-3.5 border-b border-border-subtle text-text-muted font-medium whitespace-nowrap">
                        {app.inclusive_dates}
                      </td>

                      {/* Days */}
                      <td className="px-4 py-3.5 border-b border-border-subtle text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-surface-alt border border-border-subtle text-text-main font-black text-[13px]">
                          {app.working_days}
                        </span>
                      </td>

                      {/* Commutation */}
                      <td className="px-4 py-3.5 border-b border-border-subtle text-center">
                        {app.commutation_requested ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-accent/10 text-accent border border-accent/20">
                            <i className="fas fa-check text-[9px]"></i> Yes
                          </span>
                        ) : (
                          <span className="text-text-placeholder text-[11px] font-medium">No</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 border-b border-border-subtle">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${sc.pillClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dotClass}`}></span>
                          {sc.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 border-b border-border-subtle">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* View */}
                          <button
                            onClick={() => setViewingRecord(app)}
                            title="View Details"
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-surface-alt text-accent border border-border-subtle hover:bg-accent/10 hover:border-accent/30 transition-all cursor-pointer"
                          >
                            <i className="fas fa-eye text-[12px]"></i>
                          </button>
                          {/* Approve */}
                          {(isPending || isRejected) && (
                            <button
                              onClick={() => openStatusModal("approve", app)}
                              title="Approve"
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all cursor-pointer"
                            >
                              <i className="fas fa-check text-[12px]"></i>
                            </button>
                          )}
                          {/* Reject */}
                          {(isPending || isApproved) && (
                            <button
                              onClick={() => openStatusModal("reject", app)}
                              title="Reject"
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all cursor-pointer"
                            >
                              <i className="fas fa-times text-[12px]"></i>
                            </button>
                          )}
                          {/* Delete (only on non-pending) */}
                          {!isPending && (
                            <button
                              onClick={() => promptDelete(app)}
                              title="Delete Record"
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-surface-alt text-text-muted border border-border-subtle hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all cursor-pointer"
                            >
                              <i className="fas fa-trash text-[12px]"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center shrink-0 mt-auto pt-2">
              <p className="text-text-muted text-[13px] font-medium">
                Showing{" "}
                <span className="font-bold text-text-main">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}
                </span>{" "}
                of{" "}
                <span className="font-bold text-text-main">{filtered.length}</span>{" "}
                applications
              </p>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-9 h-9 rounded-xl border border-border-subtle bg-surface text-text-muted flex items-center justify-center transition-all hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <i className="fas fa-chevron-left text-[12px]"></i>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) =>
                    p === "..." ? (
                      <span key={`dot-${idx}`} className="w-9 h-9 flex items-center justify-center text-text-placeholder text-sm">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`w-9 h-9 rounded-xl border text-[13px] font-bold flex items-center justify-center transition-all cursor-pointer ${currentPage === p
                          ? "bg-accent border-accent text-accent-text shadow-sm"
                          : "border-border-subtle bg-surface text-text-muted hover:bg-surface-hover"
                          }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-9 h-9 rounded-xl border border-border-subtle bg-surface text-text-muted flex items-center justify-center transition-all hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <i className="fas fa-chevron-right text-[12px]"></i>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── File Leave Modal ── */}
      <LeaveFormModal
        isOpen={isFileModalOpen}
        onClose={() => setIsFileModalOpen(false)}
        onSuccess={() => {
          setIsFileModalOpen(false);
          fetchApplications();
        }}
      />

      {/* ── View Details Modal ── */}
      <LeaveViewModal
        isOpen={!!viewingRecord}
        record={viewingRecord}
        onClose={() => setViewingRecord(null)}
      />

      {/* ── Status Confirm Modal ── */}
      <LeaveStatusModal
        isOpen={statusModal.isOpen}
        action={statusModal.action}
        record={statusModal.record}
        onConfirm={handleStatusUpdate}
        onClose={closeStatusModal}
      />

      {/* ── Delete Confirm Modal ── */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-[24px] shadow-2xl w-full max-w-sm border border-border-subtle animate-[slideUp_0.3s_ease-out] overflow-hidden">
            <div className="px-6 py-5 border-b border-border-subtle bg-surface-alt flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                <i className="fas fa-trash text-red-400 text-lg"></i>
              </div>
              <div>
                <h2 className="text-[16px] font-black text-text-main m-0">Delete Record?</h2>
                <p className="text-xs font-medium text-text-muted mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <div className="p-6">
              <p className="text-text-muted text-sm font-medium">
                You are about to permanently delete the{" "}
                <span className="font-bold text-text-main">{deletingRecord?.type_of_leave}</span>{" "}
                application for{" "}
                <span className="font-bold text-text-main">
                  {getEmployeeName(deletingRecord?.employees)}
                </span>.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-border-subtle bg-surface-alt flex justify-end gap-3">
              <button
                onClick={() => { setIsDeleteModalOpen(false); setDeletingRecord(null); }}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl font-bold text-[13px] border border-border-subtle bg-surface text-text-muted hover:bg-surface-hover transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl font-bold text-[13px] border border-red-600 bg-red-500 text-white hover:bg-red-600 hover:scale-105 transition-all cursor-pointer flex items-center gap-2"
              >
                {isDeleting ? (
                  <><i className="fas fa-spinner fa-spin"></i> Deleting…</>
                ) : (
                  <><i className="fas fa-trash"></i> Delete</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveTracker;

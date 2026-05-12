import React from "react";
import { getSalary } from "../lib/salaryData";
import { useAuth } from "../context/AuthContext";

const PersonnelGrid = ({
  employees,
  onView,
  onEdit,
  onDelete,
  openDropdownIndex,
  setOpenDropdownIndex,
}) => {
  const { isSuperAdmin } = useAuth();
  
  return (
    <div className="flex-1 min-h-0 overflow-y-auto mb-4 pr-1">
      {employees.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 bg-surface border border-border-subtle rounded-[16px] text-text-muted">
          <i className="fas fa-folder-open text-[28px] mb-2 opacity-50"></i>
          <p className="text-sm">No employee records found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {employees.map((emp) => {
            const fullName = [emp.lastName, emp.firstName, emp.middleName]
              .filter(Boolean)
              .join(" ");
            const avatarUrl =
              emp.photoUrl ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.lastName + " " + emp.firstName)}&background=random&color=fff&bold=true`;
            const isOpen = openDropdownIndex === emp.employeeNo;

            return (
              <div
                key={emp.employeeNo}
                className="bg-surface border border-border-subtle rounded-[16px] p-4 shadow-sm hover:shadow-md hover:border-accent/30 transition-all duration-300 group flex flex-col relative"
              >
                {/* Top Row: Avatar & Options */}
                <div className="flex justify-between items-start mb-4">
                  <div className="relative">
                    <img
                      src={avatarUrl}
                      alt={fullName}
                      className="w-14 h-14 rounded-full border-2 border-surface object-cover shadow-sm"
                    />
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-surface rounded-full"></span>
                  </div>

                  <div className="relative">
                    <button
                      onClick={() =>
                        setOpenDropdownIndex(isOpen ? null : emp.employeeNo)
                      }
                      onBlur={() =>
                        setTimeout(() => setOpenDropdownIndex(null), 200)
                      }
                      className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-text-main hover:bg-surface-alt rounded-full transition-colors"
                    >
                      <i className="fas fa-ellipsis-h"></i>
                    </button>

                    {/* Dropdown Menu */}
                    {isOpen && (
                      <div className="absolute right-0 top-10 w-36 bg-surface border border-border-subtle rounded-[12px] shadow-lg overflow-hidden z-20 animate-[fadeIn_0.1s_ease]">
                        <button
                          onMouseDown={() => onEdit(emp)}
                          className="w-full text-left px-4 py-2.5 text-[13px] font-semibold text-text-main hover:bg-surface-alt flex items-center gap-2"
                        >
                          <i className="fas fa-pen text-icon-cyan w-4"></i>{" "}
                          Edit
                        </button>
                        {isSuperAdmin && (
                          <button
                            onMouseDown={() => onDelete(emp)}
                            className="w-full text-left px-4 py-2.5 text-[13px] font-semibold text-red-500 hover:bg-red-500/10 flex items-center gap-2 border-t border-border-subtle"
                          >
                            <i className="fas fa-trash w-4"></i> Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Middle: Name & Title */}
                <div className="mb-4 flex-1">
                  <div className="flex items-center gap-2">
                    <h3
                      className="text-text-main font-extrabold text-[16px] truncate m-0"
                      title={fullName}
                    >
                      {fullName}
                    </h3>
                    {(() => {
                      const missing = [];
                      if (!emp.photoUrl) missing.push("Photo");
                      if (!emp.philhealthNo) missing.push("PhilHealth");
                      if (!emp.tin) missing.push("TIN");
                      if (!emp.pagibigNo) missing.push("Pag-IBIG");

                      if (missing.length > 0) {
                        return (
                          <i
                            className="fas fa-exclamation-circle text-red-500 text-sm animate-pulse cursor-help"
                            title={`Missing Requirements: ${missing.join(", ")}`}
                          ></i>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <p className="text-text-muted text-[12px] font-bold mt-0.5 truncate m-0 uppercase tracking-tight">
                    {emp.position}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-3 min-h-[48px] content-start">
                    <span className="px-2 py-1 rounded-md bg-accent/10 text-accent text-[9px] font-black uppercase tracking-wider border border-accent/20">
                      {emp.personnelCategory}
                    </span>
                    <span className="px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 text-[9px] font-black uppercase tracking-wider border border-blue-500/20">
                      {emp.schoolLevel}
                    </span>
                    <span className="px-2 py-1 rounded-md bg-surface-alt text-text-muted text-[9px] font-black uppercase tracking-wider border border-border-subtle">
                      {emp.department}
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-y-3 gap-x-3 bg-surface-alt/50 p-4 rounded-[16px] mb-4 text-[12px] border border-border-subtle/50">
                  <div>
                    <span className="text-text-placeholder block text-[10px] font-bold uppercase tracking-widest mb-1 opacity-70">
                      Emp No
                    </span>
                    <span
                      className="text-text-main font-bold truncate block"
                      title={emp.employeeNo}
                    >
                      {emp.employeeNo}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-placeholder block text-[10px] font-bold uppercase tracking-widest mb-1 opacity-70">
                      Joined
                    </span>
                    <span className="text-text-main font-bold truncate block">
                      {emp.originalAppointmentDate
                        ? new Date(
                          emp.originalAppointmentDate,
                        ).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-placeholder block text-[10px] font-bold uppercase tracking-widest mb-1 opacity-70">
                      Gender
                    </span>
                    <span
                      className={`font-black uppercase text-[11px] ${emp.gender === "Male" ? "text-icon-cyan" : emp.gender === "Female" ? "text-icon-pink" : "text-text-main"}`}
                    >
                      {emp.gender}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-placeholder block text-[10px] font-bold uppercase tracking-widest mb-1 opacity-70">
                      SG / Step
                    </span>
                    <span className="text-accent font-black truncate block uppercase text-[11px]">
                      {String(emp.salaryGrade).toUpperCase().replace("SG ", "")} / {emp.step}
                    </span>
                  </div>
                  <div className="col-span-2 pt-1">
                    <span className="text-text-placeholder block text-[10px] font-bold uppercase tracking-widest mb-1 opacity-70">
                      Monthly Base Salary
                    </span>
                    <span className="text-green-500 font-black text-[14px] truncate block tracking-tight">
                      {getSalary(emp.salaryGrade, emp.step)}
                    </span>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-auto pt-4 border-t border-border-subtle flex items-center justify-between gap-2 text-text-muted text-[13px] font-medium">
                  <div className="flex items-center gap-2 truncate">
                    <i className="fas fa-phone-alt opacity-70"></i>
                    <span className="truncate">{emp.contactNo}</span>
                  </div>
                  <button
                    onClick={() => onView(emp)}
                    className="shrink-0 text-accent hover:text-accent-hover font-bold text-[12px] flex items-center gap-1.5 transition-colors group/view"
                  >
                    View More{" "}
                    <i className="fas fa-arrow-right text-[10px] transition-transform group-hover/view:translate-x-0.5"></i>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PersonnelGrid;

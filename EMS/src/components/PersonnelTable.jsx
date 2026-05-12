import React from "react";
import { getSalary } from "../lib/salaryData";
import { useAuth } from "../context/AuthContext";

const PersonnelTable = ({ employees, onView, onEdit, onDelete, sortConfig, onSort }) => {
  const { isSuperAdmin } = useAuth();
  
  return (
    <div className="flex-1 w-full min-h-0 overflow-auto border border-border-subtle rounded-[16px] bg-surface shadow-sm mb-4">
      <table className="w-full min-w-[980px] table-fixed border-collapse text-[13px]">
        <thead className="bg-surface-alt sticky top-0 z-10 border-b border-border-subtle">
          <tr>
            <th
              className="p-3.5 w-[14%] text-center align-middle font-bold text-text-muted uppercase tracking-wider text-[11px] whitespace-nowrap cursor-pointer hover:bg-surface-hover transition-colors"
              onClick={() => onSort("employeeNo")}
            >
              Employee No.{" "}
              {sortConfig.key === "employeeNo" && (
                <i
                  className={`fas fa-sort-${sortConfig.direction === "asc" ? "up" : "down"} ml-1`}
                ></i>
              )}
            </th>
            <th
              className="p-3.5 w-[20%] text-center align-middle font-bold text-text-muted uppercase tracking-wider text-[11px] whitespace-nowrap cursor-pointer hover:bg-surface-hover transition-colors"
              onClick={() => onSort("lastName")}
            >
              Name{" "}
              {sortConfig.key === "lastName" && (
                <i
                  className={`fas fa-sort-${sortConfig.direction === "asc" ? "up" : "down"} ml-1`}
                ></i>
              )}
            </th>
            <th
              className="p-3.5 w-[10%] text-center align-middle font-bold text-text-muted uppercase tracking-wider text-[11px] whitespace-nowrap cursor-pointer hover:bg-surface-hover transition-colors"
              onClick={() => onSort("gender")}
            >
              Gender{" "}
              {sortConfig.key === "gender" && (
                <i
                  className={`fas fa-sort-${sortConfig.direction === "asc" ? "up" : "down"} ml-1`}
                ></i>
              )}
            </th>
            <th
              className="p-3.5 w-[16%] text-center align-middle font-bold text-text-muted uppercase tracking-wider text-[11px] whitespace-nowrap cursor-pointer hover:bg-surface-hover transition-colors"
              onClick={() => onSort("position")}
            >
              Position{" "}
              {sortConfig.key === "position" && (
                <i
                  className={`fas fa-sort-${sortConfig.direction === "asc" ? "up" : "down"} ml-1`}
                ></i>
              )}
              {sortConfig.key !== "position" && (
                <i className="fas fa-sort ml-1 opacity-30"></i>
              )}
            </th>
            <th
              className="p-3.5 w-[10%] text-center align-middle font-bold text-text-muted uppercase tracking-wider text-[11px] whitespace-nowrap cursor-pointer hover:bg-surface-hover transition-colors"
              onClick={() => onSort("step")}
            >
              Step{" "}
              {sortConfig.key === "step" && (
                <i
                  className={`fas fa-sort-${sortConfig.direction === "asc" ? "up" : "down"} ml-1`}
                ></i>
              )}
            </th>
            <th className="p-3.5 w-[10%] text-center align-middle font-bold text-text-muted uppercase tracking-wider text-[11px] whitespace-nowrap">
              Salary Grade
            </th>
            <th className="p-3.5 w-[12%] text-center align-middle font-bold text-text-muted uppercase tracking-wider text-[11px] whitespace-nowrap">
              Base Salary
            </th>
            <th className="p-3.5 w-[12%] text-center align-middle font-bold text-text-muted uppercase tracking-wider text-[11px] whitespace-nowrap">
              Contact Number
            </th>
            <th className="p-3.5 w-[12%] text-center align-middle font-bold text-text-muted uppercase tracking-wider text-[11px] whitespace-nowrap">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {employees.length === 0 ? (
            <tr>
              <td
                colSpan="9"
                className="p-[16px_18px] text-center text-text-muted"
              >
                No employee records found.
              </td>
            </tr>
          ) : (
            employees.map((emp, i) => (
              <tr
                key={emp.employeeNo}
                className={`transition-all duration-200 hover:bg-surface-hover ${i % 2 === 0 ? "bg-surface" : "bg-surface-alt"}`}
              >
                <td className="p-3.5 text-text-muted text-center font-medium align-middle whitespace-nowrap overflow-hidden text-ellipsis border-b border-border-subtle">
                  {emp.employeeNo}
                </td>
                <td className="p-3.5 text-text-main text-center font-bold align-middle whitespace-nowrap overflow-hidden text-ellipsis border-b border-border-subtle">
                  {[emp.lastName, emp.firstName, emp.middleName]
                    .filter(Boolean)
                    .join(", ")}
                </td>
                <td className="p-3.5 text-center align-middle whitespace-nowrap overflow-hidden text-ellipsis border-b border-border-subtle">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${emp.gender === "Male" ? "bg-surface-alt text-icon-cyan border border-icon-cyan/30" : emp.gender === "Female" ? "bg-surface-alt text-icon-pink border border-icon-pink/30" : "bg-surface-alt text-text-muted border border-border-subtle"}`}
                  >
                    {emp.gender}
                  </span>
                </td>
                <td className="p-3.5 text-text-muted text-center font-medium align-middle whitespace-nowrap overflow-hidden text-ellipsis border-b border-border-subtle">
                  {emp.position}
                </td>
                <td className="p-3.5 text-text-muted text-center font-medium align-middle whitespace-nowrap overflow-hidden text-ellipsis border-b border-border-subtle">
                  {emp.step}
                </td>
                <td className="p-3.5 text-text-muted text-center font-medium align-middle whitespace-nowrap overflow-hidden text-ellipsis border-b border-border-subtle">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-surface-alt text-accent border border-accent/30">
                    {emp.salaryGrade}
                  </span>
                </td>
                <td className="p-3.5 text-text-main text-center font-bold align-middle whitespace-nowrap overflow-hidden text-ellipsis border-b border-border-subtle">
                  {getSalary(emp.salaryGrade, emp.step)}
                </td>
                <td className="p-3.5 text-text-muted text-center font-medium align-middle whitespace-nowrap overflow-hidden text-ellipsis border-b border-border-subtle">
                  {emp.contactNo}
                </td>
                <td className="p-3.5 text-center align-middle whitespace-nowrap border-b border-border-subtle">
                  <div className="flex justify-center gap-1.5">
                    <button
                      onClick={() => onView(emp)}
                      className="inline-flex items-center justify-center w-7 h-7 bg-surface-alt text-accent rounded-lg cursor-pointer transition-all duration-200 hover:bg-accent/20 border border-border-subtle"
                      title="View Details"
                    >
                      <i className="fas fa-eye text-[12px]"></i>
                    </button>
                    <button
                      onClick={() => onEdit(emp)}
                      className="inline-flex items-center justify-center w-7 h-7 bg-surface-alt text-icon-cyan rounded-lg cursor-pointer transition-all duration-200 hover:bg-icon-cyan/20 border border-border-subtle"
                      title="Edit"
                    >
                      <i className="fas fa-pen text-[12px]"></i>
                    </button>
                    {isSuperAdmin && (
                      <button
                        onClick={() => onDelete(emp)}
                        className="inline-flex items-center justify-center w-7 h-7 bg-surface-alt text-red-500 rounded-lg cursor-pointer transition-all duration-200 hover:bg-red-500/20 hover:text-red-600 border border-border-subtle"
                        title="Delete"
                      >
                        <i className="fas fa-trash text-[12px]"></i>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PersonnelTable;

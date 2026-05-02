import React, { useState, useEffect } from 'react';

const EMPLOYEE_STORAGE_KEY = 'emsEmployees';

const Export = () => {
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem(EMPLOYEE_STORAGE_KEY);
    if (stored) {
      try {
        setEmployees(JSON.parse(stored) || []);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const exportToCSV = () => {
    if (employees.length === 0) return;
    const headers = [
      'Employee No.', 'Last Name', 'First Name', 'Middle Name', 'Gender', 'Birthdate', 
      'Civil Status', 'Contact Number', 'BP No.', 'PhilHealth No.', 'Pag-IBIG No.', 
      'Bank Account No.', 'Item No.', 'TIN', 'Position', 'Salary Grade', 'Step', 
      'Date of Original Appointment', 'Date of Last Promotion'
    ];
    
    const rows = employees.map(emp => [
      emp.employeeNo, emp.lastName, emp.firstName, emp.middleName, emp.gender, emp.birthdate,
      emp.civilStatus, emp.contactNo, emp.bpNo, emp.philhealthNo, emp.pagibigNo,
      emp.bankAccountNo, emp.itemNo, emp.tin, emp.position, emp.salaryGrade, emp.step,
      emp.originalAppointmentDate, emp.lastPromotionDate
    ].map(v => `"${v || '-'}"`).join(','));

    const csvContent = headers.join(',') + '\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `employees_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 mb-6 p-6 md:p-8 bg-surface border border-border-subtle rounded-[20px] shadow-sm shrink-0 transition-colors duration-300">
        <div>
          <span className="inline-flex mb-2 text-accent text-[12px] font-extrabold uppercase tracking-widest">Data Export</span>
          <h1 className="text-text-main text-[28px] md:text-[32px] font-extrabold leading-tight tracking-tight m-0">Export Employee Data</h1>
        </div>
        <span className="self-start md:self-auto shrink-0 inline-flex items-center gap-2 px-4 py-2.5 text-text-main text-[13px] font-bold border border-border-subtle rounded-full bg-surface-alt shadow-sm">
          <i className="fas fa-file-export text-accent text-[13px]"></i> Report-ready data
        </span>
      </div>

      <div className="flex flex-col md:flex-row gap-3 justify-end mb-6 shrink-0">
        <button onClick={exportToCSV} className="inline-flex justify-center items-center gap-2 bg-surface text-text-muted border border-border-subtle px-5 py-2.5 rounded-[12px] cursor-pointer text-[14px] font-semibold transition-all duration-200 shadow-sm hover:bg-surface-hover hover:text-text-main hover:-translate-y-0.5">
          <i className="fas fa-file-pdf text-accent"></i> Export PDF
        </button>
        <button onClick={exportToCSV} className="inline-flex justify-center items-center gap-2 bg-surface text-text-muted border border-border-subtle px-5 py-2.5 rounded-[12px] cursor-pointer text-[14px] font-semibold transition-all duration-200 shadow-sm hover:bg-surface-hover hover:text-text-main hover:-translate-y-0.5">
          <i className="fas fa-file-excel text-accent"></i> Export Excel
        </button>
      </div>

      <div className="flex-1 w-full min-h-0 overflow-auto border border-border-subtle rounded-[20px] bg-surface shadow-sm">
        <table className="w-full min-w-max table-auto border-collapse text-[14px]">
          <thead className="bg-surface-alt sticky top-0 z-10 border-b border-border-subtle">
            <tr>
              {['Employee No.', 'Last Name', 'First Name', 'Middle Name', 'Gender', 'Birthdate', 'Civil Status', 'Contact Number', 'BP No.', 'PhilHealth No.', 'Pag-IBIG No.', 'Bank Account No.', 'Item No.', 'TIN', 'Position', 'Salary Grade', 'Step', 'Date of Original Appointment', 'Date of Last Promotion'].map(th => (
                <th key={th} className="p-4 md:p-5 text-center align-middle font-bold text-text-muted uppercase tracking-wider text-[12px] whitespace-nowrap">
                  {th}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan="19" className="p-5 text-center text-text-muted">No employee data available</td>
              </tr>
            ) : (
              employees.map((emp, i) => (
                <tr key={i} className={`transition-all duration-200 hover:bg-surface-hover ${i % 2 === 0 ? 'bg-surface' : 'bg-surface-alt'}`}>
                  {[emp.employeeNo, emp.lastName, emp.firstName, emp.middleName, emp.gender, emp.birthdate, emp.civilStatus, emp.contactNo, emp.bpNo, emp.philhealthNo, emp.pagibigNo, emp.bankAccountNo, emp.itemNo, emp.tin, emp.position, emp.salaryGrade, emp.step, emp.originalAppointmentDate, emp.lastPromotionDate].map((val, idx) => (
                    <td key={idx} className="p-4 md:p-5 text-text-muted text-center align-middle whitespace-nowrap overflow-hidden text-ellipsis border-b border-border-subtle">
                      {val || '-'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Export;

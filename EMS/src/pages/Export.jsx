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
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 mb-6 p-6 md:p-8 bg-white border border-[#e2e8f0] rounded-[20px] shadow-sm shrink-0">
        <div>
          <span className="inline-flex mb-2 text-blue-600 text-[12px] font-extrabold uppercase tracking-widest">Data Export</span>
          <h1 className="text-[#0f172a] text-[28px] md:text-[32px] font-extrabold leading-tight tracking-tight m-0">Export Employee Data</h1>
        </div>
        <span className="self-start md:self-auto shrink-0 inline-flex items-center gap-2 px-4 py-2.5 text-[#0f172a] text-[13px] font-bold border border-[#e2e8f0] rounded-full bg-[#f8fafc] shadow-sm">
          <i className="fas fa-file-export text-emerald-500 text-[13px]"></i> Report-ready data
        </span>
      </div>

      <div className="flex flex-col md:flex-row gap-3 justify-end mb-6 shrink-0">
        <button onClick={exportToCSV} className="inline-flex justify-center items-center gap-2 bg-white text-[#334155] border border-[#e2e8f0] px-5 py-2.5 rounded-[12px] cursor-pointer text-[14px] font-semibold transition-all duration-200 shadow-sm hover:bg-[#f8fafc] hover:text-[#0f172a] hover:-translate-y-0.5">
          <i className="fas fa-file-pdf text-blue-600"></i> Export PDF
        </button>
        <button onClick={exportToCSV} className="inline-flex justify-center items-center gap-2 bg-white text-[#334155] border border-[#e2e8f0] px-5 py-2.5 rounded-[12px] cursor-pointer text-[14px] font-semibold transition-all duration-200 shadow-sm hover:bg-[#f8fafc] hover:text-[#0f172a] hover:-translate-y-0.5">
          <i className="fas fa-file-excel text-green-500"></i> Export Excel
        </button>
      </div>

      <div className="flex-1 w-full min-h-0 overflow-auto border border-[#e2e8f0] rounded-[20px] bg-white shadow-sm">
        <table className="w-full min-w-max table-auto border-collapse text-[14px]">
          <thead className="bg-[#f8fafc] sticky top-0 z-10 border-b border-[#e2e8f0]">
            <tr>
              {['Employee No.', 'Last Name', 'First Name', 'Middle Name', 'Gender', 'Birthdate', 'Civil Status', 'Contact Number', 'BP No.', 'PhilHealth No.', 'Pag-IBIG No.', 'Bank Account No.', 'Item No.', 'TIN', 'Position', 'Salary Grade', 'Step', 'Date of Original Appointment', 'Date of Last Promotion'].map(th => (
                <th key={th} className="p-4 md:p-5 text-center align-middle font-bold text-[#64748b] uppercase tracking-wider text-[12px] whitespace-nowrap">
                  {th}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan="19" className="p-5 text-center text-[#334155]">No employee data available</td>
              </tr>
            ) : (
              employees.map((emp, i) => (
                <tr key={i} className={`transition-all duration-200 hover:bg-blue-50/50 ${i % 2 === 0 ? 'bg-white' : 'bg-[#f8fafc]'}`}>
                  {[emp.employeeNo, emp.lastName, emp.firstName, emp.middleName, emp.gender, emp.birthdate, emp.civilStatus, emp.contactNo, emp.bpNo, emp.philhealthNo, emp.pagibigNo, emp.bankAccountNo, emp.itemNo, emp.tin, emp.position, emp.salaryGrade, emp.step, emp.originalAppointmentDate, emp.lastPromotionDate].map((val, idx) => (
                    <td key={idx} className="p-4 md:p-5 text-[#475569] text-center align-middle whitespace-nowrap overflow-hidden text-ellipsis border-b border-[#e2e8f0]">
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

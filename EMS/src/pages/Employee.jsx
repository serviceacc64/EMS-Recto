import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const EMPLOYEE_STORAGE_KEY = 'emsEmployees';

const Employee = () => {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [deletingIndex, setDeletingIndex] = useState(null);

  const initialFormState = {
    lastName: '', firstName: '', middleName: '', gender: '', birthdate: '', civilStatus: '', contactNo: '',
    bpNo: '', philhealthNo: '', pagibigNo: '', bankAccountNo: '', itemNo: '', tin: '',
    employeeNo: '', position: '', salaryGrade: '', step: '', originalAppointmentDate: '', lastPromotionDate: ''
  };
  const [formData, setFormData] = useState(initialFormState);

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

  const saveEmployees = (newEmployees) => {
    setEmployees(newEmployees);
    localStorage.setItem(EMPLOYEE_STORAGE_KEY, JSON.stringify(newEmployees));
  };

  const filteredEmployees = employees.filter((emp) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    const searchString = [
      emp.employeeNo, emp.lastName, emp.firstName, emp.middleName,
      emp.gender, emp.position, emp.step, emp.salaryGrade, emp.contactNo
    ].filter(Boolean).join(' ').toLowerCase();

    return searchString.includes(s);
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAdd = () => {
    setFormData(initialFormState);
    setEditingIndex(null);
    setIsModalOpen(true);
  };

  const handleEdit = (emp) => {
    const realIndex = employees.findIndex(e => e.employeeNo === emp.employeeNo);
    setFormData(employees[realIndex]);
    setEditingIndex(realIndex);
    setIsModalOpen(true);
  };

  const handleDeletePrompt = (emp) => {
    const realIndex = employees.findIndex(e => e.employeeNo === emp.employeeNo);
    setDeletingIndex(realIndex);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deletingIndex !== null) {
      const newEmployees = [...employees];
      newEmployees.splice(deletingIndex, 1);
      saveEmployees(newEmployees);
    }
    setIsDeleteModalOpen(false);
    setDeletingIndex(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Require core fields
    const required = ['lastName', 'firstName', 'gender', 'birthdate', 'civilStatus', 'contactNo', 'employeeNo', 'position', 'salaryGrade', 'step', 'originalAppointmentDate'];
    for (let field of required) {
      if (!formData[field] || formData[field].trim() === '') {
        alert('Please fill in all required fields.');
        return;
      }
    }

    const isDuplicate = employees.some((emp, idx) => emp.employeeNo === formData.employeeNo && idx !== editingIndex);
    if (isDuplicate) {
      alert('Employee number already exists.');
      return;
    }

    const newEmployees = [...employees];
    if (editingIndex !== null) {
      newEmployees[editingIndex] = formData;
    } else {
      newEmployees.push(formData);
    }
    saveEmployees(newEmployees);
    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 mb-6 p-6 md:p-8 bg-white border border-[#e2e8f0] rounded-[20px] shadow-sm shrink-0">
        <div>
          <span className="inline-flex mb-2 text-blue-600 text-[12px] font-extrabold uppercase tracking-widest">Employee Records</span>
          <h1 className="text-[#0f172a] text-[28px] md:text-[32px] font-extrabold leading-tight tracking-tight m-0">Employee Management</h1>
        </div>
        <span className="self-start md:self-auto shrink-0 inline-flex items-center gap-2 px-4 py-2.5 text-[#0f172a] text-[13px] font-bold border border-[#e2e8f0] rounded-full bg-[#f8fafc] shadow-sm">
          <i className="fas fa-users text-blue-500 text-[14px]"></i> Personnel directory
        </span>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6 shrink-0">
        <div className="w-full md:w-[480px] flex items-center gap-3 bg-white border border-[#e2e8f0] rounded-[14px] px-4 py-3 shadow-sm focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
          <i className="fas fa-search text-[#94a3b8] text-[16px]"></i>
          <input
            type="text"
            placeholder="Search by employee no., name, gender, position..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-none outline-none w-full text-[15px] text-[#0f172a] bg-transparent font-medium placeholder:text-[#94a3b8]"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Link to="/export" className="inline-flex justify-center items-center gap-2 bg-white text-[#334155] border border-[#e2e8f0] px-5 py-2.5 rounded-[12px] cursor-pointer text-[14px] font-semibold transition-all duration-200 shadow-sm hover:bg-[#f8fafc] hover:text-[#0f172a] hover:-translate-y-0.5 group">
            <i className="fas fa-file-excel text-green-600"></i> Create Report
          </Link>
          <button onClick={handleAdd} className="inline-flex justify-center items-center gap-2 bg-blue-600 text-white border border-blue-700 px-5 py-2.5 rounded-[12px] cursor-pointer text-[14px] font-semibold transition-all duration-200 shadow-sm hover:bg-blue-700 hover:-translate-y-0.5 group">
            <i className="fas fa-plus"></i> Add Employee
          </button>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0 overflow-auto border border-[#e2e8f0] rounded-[20px] bg-white shadow-sm">
        <table className="w-full min-w-[980px] table-fixed border-collapse text-[14px]">
          <thead className="bg-[#f8fafc] sticky top-0 z-10 border-b border-[#e2e8f0]">
            <tr>
              <th className="p-4 md:p-5 w-[14%] text-center align-middle font-bold text-[#64748b] uppercase tracking-wider text-[12px] whitespace-nowrap">Employee No.</th>
              <th className="p-4 md:p-5 w-[20%] text-center align-middle font-bold text-[#64748b] uppercase tracking-wider text-[12px] whitespace-nowrap">Name</th>
              <th className="p-4 md:p-5 w-[10%] text-center align-middle font-bold text-[#64748b] uppercase tracking-wider text-[12px] whitespace-nowrap">Gender</th>
              <th className="p-4 md:p-5 w-[16%] text-center align-middle font-bold text-[#64748b] uppercase tracking-wider text-[12px] whitespace-nowrap">Position</th>
              <th className="p-4 md:p-5 w-[10%] text-center align-middle font-bold text-[#64748b] uppercase tracking-wider text-[12px] whitespace-nowrap">Step</th>
              <th className="p-4 md:p-5 w-[10%] text-center align-middle font-bold text-[#64748b] uppercase tracking-wider text-[12px] whitespace-nowrap">Salary Grade</th>
              <th className="p-4 md:p-5 w-[14%] text-center align-middle font-bold text-[#64748b] uppercase tracking-wider text-[12px] whitespace-nowrap">Contact Number</th>
              <th className="p-4 md:p-5 w-[16%] text-center align-middle font-bold text-[#64748b] uppercase tracking-wider text-[12px] whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan="8" className="p-[16px_18px] text-center text-[#1f2933]">No employee records found.</td>
              </tr>
            ) : (
              filteredEmployees.map((emp, i) => (
                <tr key={emp.employeeNo} className={`transition-all duration-200 hover:bg-blue-50/50 ${i % 2 === 0 ? 'bg-white' : 'bg-[#f8fafc]'}`}>
                  <td className="p-4 md:p-5 text-[#334155] text-center font-medium align-middle whitespace-nowrap overflow-hidden text-ellipsis border-b border-[#e2e8f0]">{emp.employeeNo}</td>
                  <td className="p-4 md:p-5 text-[#0f172a] text-center font-bold align-middle whitespace-nowrap overflow-hidden text-ellipsis border-b border-[#e2e8f0]">
                    {[emp.lastName, emp.firstName, emp.middleName].filter(Boolean).join(', ')}
                  </td>
                  <td className="p-4 md:p-5 text-center align-middle whitespace-nowrap overflow-hidden text-ellipsis border-b border-[#e2e8f0]">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-bold ${emp.gender === 'Male' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : emp.gender === 'Female' ? 'bg-pink-50 text-pink-700 border border-pink-200' : 'bg-gray-100 text-gray-700'}`}>
                      {emp.gender}
                    </span>
                  </td>
                  <td className="p-4 md:p-5 text-[#475569] text-center font-medium align-middle whitespace-nowrap overflow-hidden text-ellipsis border-b border-[#e2e8f0]">{emp.position}</td>
                  <td className="p-4 md:p-5 text-[#475569] text-center font-medium align-middle whitespace-nowrap overflow-hidden text-ellipsis border-b border-[#e2e8f0]">{emp.step}</td>
                  <td className="p-4 md:p-5 text-[#475569] text-center font-medium align-middle whitespace-nowrap overflow-hidden text-ellipsis border-b border-[#e2e8f0]">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {emp.salaryGrade}
                    </span>
                  </td>
                  <td className="p-4 md:p-5 text-[#475569] text-center font-medium align-middle whitespace-nowrap overflow-hidden text-ellipsis border-b border-[#e2e8f0]">{emp.contactNo}</td>
                  <td className="p-4 md:p-5 text-center align-middle whitespace-nowrap border-b border-[#e2e8f0]">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => handleEdit(emp)} className="inline-flex items-center justify-center w-8 h-8 bg-blue-50 text-blue-600 rounded-lg cursor-pointer transition-all duration-200 hover:bg-blue-600 hover:text-white" title="Edit">
                        <i className="fas fa-pen text-[13px]"></i>
                      </button>
                      <button onClick={() => handleDeletePrompt(emp)} className="inline-flex items-center justify-center w-8 h-8 bg-red-50 text-red-600 rounded-lg cursor-pointer transition-all duration-200 hover:bg-red-600 hover:text-white" title="Delete">
                        <i className="fas fa-trash text-[13px]"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0f172a]/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease]" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative z-[1000] w-full max-w-[840px] max-h-[90vh] overflow-y-auto bg-white border border-[#e2e8f0] rounded-[24px] shadow-2xl animate-[slideIn_0.2s_ease]">
            <div className="p-6 md:p-8">
              <div className="mb-6">
                <h2 className="text-[#0f172a] text-[24px] md:text-[28px] mb-1 font-extrabold tracking-tight">{editingIndex !== null ? 'Edit Employee' : 'Add Employee'}</h2>
                <p className="text-[#64748b] text-[15px] m-0">Fill in the employee information below.</p>
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col">
                <div className="grid grid-cols-1 gap-6 mb-8">
                  
                  {/* Personal Information */}
                  <div className="flex flex-col bg-[#f8fafc] border border-[#e2e8f0] rounded-[16px] p-5 md:p-6 shadow-sm">
                    <h3 className="text-[#334155] text-[15px] mb-5 font-bold border-b border-[#e2e8f0] pb-3">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                      <div className="flex flex-col">
                        <label className="text-[13px] font-semibold text-[#475569] mb-2">Last Name <span className="text-red-500">*</span></label>
                        <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required className="px-4 py-2.5 border border-[#cbd5e1] rounded-[10px] text-[14px] text-[#0f172a] bg-white shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-[#94a3b8]" placeholder="e.g., Santos" />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[13px] font-semibold text-[#475569] mb-2">First Name <span className="text-red-500">*</span></label>
                        <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required className="px-4 py-2.5 border border-[#cbd5e1] rounded-[10px] text-[14px] text-[#0f172a] bg-white shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-[#94a3b8]" placeholder="e.g., Maria" />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[13px] font-semibold text-[#475569] mb-2">Middle Name</label>
                        <input type="text" name="middleName" value={formData.middleName} onChange={handleInputChange} className="px-4 py-2.5 border border-[#cbd5e1] rounded-[10px] text-[14px] text-[#0f172a] bg-white shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-[#94a3b8]" placeholder="e.g., Reyes" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                      <div className="flex flex-col">
                        <label className="text-[13px] font-semibold text-[#475569] mb-2">Gender <span className="text-red-500">*</span></label>
                        <select name="gender" value={formData.gender} onChange={handleInputChange} required className="px-4 py-2.5 border border-[#cbd5e1] rounded-[10px] text-[14px] text-[#0f172a] bg-white shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer">
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[13px] font-semibold text-[#475569] mb-2">Birthdate <span className="text-red-500">*</span></label>
                        <input type="date" name="birthdate" value={formData.birthdate} onChange={handleInputChange} required className="px-4 py-2.5 border border-[#cbd5e1] rounded-[10px] text-[14px] text-[#0f172a] bg-white shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[13px] font-semibold text-[#475569] mb-2">Civil Status <span className="text-red-500">*</span></label>
                        <select name="civilStatus" value={formData.civilStatus} onChange={handleInputChange} required className="px-4 py-2.5 border border-[#cbd5e1] rounded-[10px] text-[14px] text-[#0f172a] bg-white shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer">
                          <option value="">Select Civil Status</option>
                          <option value="Single">Single</option>
                          <option value="Married">Married</option>
                          <option value="Widowed">Widowed</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div className="flex flex-col">
                        <label className="text-[13px] font-semibold text-[#475569] mb-2">Contact No. <span className="text-red-500">*</span></label>
                        <input type="tel" name="contactNo" value={formData.contactNo} onChange={handleInputChange} required className="px-4 py-2.5 border border-[#cbd5e1] rounded-[10px] text-[14px] text-[#0f172a] bg-white shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-[#94a3b8]" placeholder="e.g., 0917 123 4567" />
                      </div>
                    </div>
                  </div>

                  {/* Government IDs */}
                  <div className="flex flex-col bg-[#f8fafc] border border-[#e2e8f0] rounded-[16px] p-5 md:p-6 shadow-sm">
                    <h3 className="text-[#334155] text-[15px] mb-5 font-bold border-b border-[#e2e8f0] pb-3">Government IDs & Numbers</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                      <div className="flex flex-col">
                        <label className="text-[13px] font-semibold text-[#475569] mb-2">BP No.</label>
                        <input type="text" name="bpNo" value={formData.bpNo} onChange={handleInputChange} className="px-4 py-2.5 border border-[#cbd5e1] rounded-[10px] text-[14px] text-[#0f172a] bg-white shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-[#94a3b8]" placeholder="Enter BP reference number" />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[13px] font-semibold text-[#475569] mb-2">PhilHealth No.</label>
                        <input type="text" name="philhealthNo" value={formData.philhealthNo} onChange={handleInputChange} className="px-4 py-2.5 border border-[#cbd5e1] rounded-[10px] text-[14px] text-[#0f172a] bg-white shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-[#94a3b8]" placeholder="Enter PhilHealth number" />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[13px] font-semibold text-[#475569] mb-2">Pag-IBIG No.</label>
                        <input type="text" name="pagibigNo" value={formData.pagibigNo} onChange={handleInputChange} className="px-4 py-2.5 border border-[#cbd5e1] rounded-[10px] text-[14px] text-[#0f172a] bg-white shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-[#94a3b8]" placeholder="Enter Pag-IBIG number" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div className="flex flex-col">
                        <label className="text-[13px] font-semibold text-[#475569] mb-2">Bank Account No.</label>
                        <input type="text" name="bankAccountNo" value={formData.bankAccountNo} onChange={handleInputChange} className="px-4 py-2.5 border border-[#cbd5e1] rounded-[10px] text-[14px] text-[#0f172a] bg-white shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-[#94a3b8]" placeholder="Enter bank account number" />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[13px] font-semibold text-[#475569] mb-2">Item No.</label>
                        <input type="text" name="itemNo" value={formData.itemNo} onChange={handleInputChange} className="px-4 py-2.5 border border-[#cbd5e1] rounded-[10px] text-[14px] text-[#0f172a] bg-white shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-[#94a3b8]" placeholder="Enter plantilla item number" />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[13px] font-semibold text-[#475569] mb-2">TIN</label>
                        <input type="text" name="tin" value={formData.tin} onChange={handleInputChange} className="px-4 py-2.5 border border-[#cbd5e1] rounded-[10px] text-[14px] text-[#0f172a] bg-white shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-[#94a3b8]" placeholder="Enter TIN" />
                      </div>
                    </div>
                  </div>

                  {/* Employment Details */}
                  <div className="flex flex-col bg-[#f8fafc] border border-[#e2e8f0] rounded-[16px] p-5 md:p-6 shadow-sm">
                    <h3 className="text-[#334155] text-[15px] mb-5 font-bold border-b border-[#e2e8f0] pb-3">Employment Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-5">
                      <div className="flex flex-col">
                        <label className="text-[13px] font-semibold text-[#475569] mb-2">Employee No. <span className="text-red-500">*</span></label>
                        <input type="text" name="employeeNo" value={formData.employeeNo} onChange={handleInputChange} required className="px-4 py-2.5 border border-[#cbd5e1] rounded-[10px] text-[14px] text-[#0f172a] bg-white shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-[#94a3b8]" placeholder="e.g., EMS-2026-001" />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[13px] font-semibold text-[#475569] mb-2">Position <span className="text-red-500">*</span></label>
                        <input type="text" name="position" value={formData.position} onChange={handleInputChange} required className="px-4 py-2.5 border border-[#cbd5e1] rounded-[10px] text-[14px] text-[#0f172a] bg-white shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-[#94a3b8]" placeholder="e.g., Admin" />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[13px] font-semibold text-[#475569] mb-2">Salary Grade <span className="text-red-500">*</span></label>
                        <input type="text" name="salaryGrade" value={formData.salaryGrade} onChange={handleInputChange} required className="px-4 py-2.5 border border-[#cbd5e1] rounded-[10px] text-[14px] text-[#0f172a] bg-white shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-[#94a3b8]" placeholder="e.g., SG-11" />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[13px] font-semibold text-[#475569] mb-2">Step <span className="text-red-500">*</span></label>
                        <select name="step" value={formData.step} onChange={handleInputChange} required className="px-4 py-2.5 border border-[#cbd5e1] rounded-[10px] text-[14px] text-[#0f172a] bg-white shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer">
                          <option value="">Select Step</option>
                          {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>Step {n}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="flex flex-col">
                        <label className="text-[13px] font-semibold text-[#475569] mb-2">Date of Original Appointment <span className="text-red-500">*</span></label>
                        <input type="date" name="originalAppointmentDate" value={formData.originalAppointmentDate} onChange={handleInputChange} required className="px-4 py-2.5 border border-[#cbd5e1] rounded-[10px] text-[14px] text-[#0f172a] bg-white shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[13px] font-semibold text-[#475569] mb-2">Date of Last Promotion</label>
                        <input type="date" name="lastPromotionDate" value={formData.lastPromotionDate} onChange={handleInputChange} className="px-4 py-2.5 border border-[#cbd5e1] rounded-[10px] text-[14px] text-[#0f172a] bg-white shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-5 border-t border-[#e2e8f0]">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#334155] border border-[#e2e8f0] rounded-[12px] cursor-pointer text-[14px] font-semibold transition-all duration-200 shadow-sm hover:bg-[#f8fafc] hover:text-[#0f172a] group">
                    <i className="fas fa-times text-[#64748b]"></i> Cancel
                  </button>
                  <button type="submit" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white border border-blue-700 rounded-[12px] cursor-pointer text-[14px] font-semibold transition-all duration-200 shadow-sm hover:bg-blue-700 hover:-translate-y-0.5 group">
                    <i className="fas fa-save text-white/90"></i> {editingIndex !== null ? 'Update Employee' : 'Save Employee'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0f172a]/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease]" onClick={() => setIsDeleteModalOpen(false)}></div>
          <div className="relative z-[1000] w-full max-w-[460px] bg-white border border-[#e2e8f0] rounded-[24px] shadow-2xl animate-[slideIn_0.2s_ease]">
            <div className="p-8">
              <h2 className="text-[#0f172a] text-[24px] mb-3 font-extrabold tracking-tight">Confirm Delete</h2>
              <p className="text-[#64748b] text-[15px] leading-relaxed m-0">Are you sure you want to delete this employee? This action cannot be undone.</p>
              <div className="flex justify-end gap-3 mt-8">
                <button onClick={() => setIsDeleteModalOpen(false)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#334155] border border-[#e2e8f0] rounded-[12px] cursor-pointer text-[14px] font-semibold transition-all duration-200 shadow-sm hover:bg-[#f8fafc] hover:text-[#0f172a] group">
                  Cancel
                </button>
                <button onClick={handleDeleteConfirm} className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white border border-red-700 rounded-[12px] cursor-pointer text-[14px] font-semibold transition-all duration-200 shadow-sm hover:bg-red-700 hover:-translate-y-0.5 group">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Employee;

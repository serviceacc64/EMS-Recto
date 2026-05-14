import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { getSalary } from "../lib/salaryData";
import { DEPARTMENT_OPTIONS } from "../utils/personnelUtils";

const PersonnelFormModal = ({ isOpen, onClose, onSave, employee = null }) => {
  const [isUploading, setIsUploading] = useState(false);

  const initialFormState = {
    lastName: "",
    firstName: "",
    middleName: "",
    gender: "",
    birthdate: "",
    civilStatus: "",
    contactNo: "",
    eduEmail: "",
    personalEmail: "",
    bpNo: "",
    philhealthNo: "",
    pagibigNo: "",
    bankAccountNo: "",
    itemNo: "",
    tin: "",
    employeeNo: "",
    position: "",
    basePosition: "",
    positionRank: "",
    salaryGrade: "",
    step: "",
    originalAppointmentDate: "",
    lastPromotionDate: "",
    photoUrl: "",
    department: "",
    personnelCategory: "",
    schoolLevel: "",
    localLeaveBalance: 0,
    doLeaveBalance: 0,
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if (employee) {
      const empData = { ...employee };
      // Parse position for the UI
      if (empData.position) {
        const match = empData.position.match(
          /(.*?)\s+(I|II|III|IV|V|VI|VII|VIII|IX|X)$/i,
        );
        if (match) {
          empData.basePosition = match[1];
          empData.positionRank = match[2].toUpperCase();
        } else {
          empData.basePosition = empData.position;
          empData.positionRank = "";
        }
      } else {
        empData.basePosition = "";
        empData.positionRank = "";
      }
      setFormData(empData);
    } else {
      setFormData(initialFormState);
    }
  }, [employee, isOpen]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("employee-photos")
      .upload(fileName, file);

    if (uploadError) {
      alert("Error uploading photo: " + uploadError.message);
      setIsUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from("employee-photos")
      .getPublicUrl(fileName);

    setFormData((prev) => ({ ...prev, photoUrl: data.publicUrl }));
    setIsUploading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      // If school level changes, reset department
      if (name === "schoolLevel") {
        newData.department = "";
      }
      return newData;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const finalBase = formData.basePosition
      ? formData.basePosition.trim().toUpperCase()
      : "";
    const finalPosition = formData.positionRank
      ? `${finalBase} ${formData.positionRank}`
      : finalBase;

    const dataToSave = { ...formData, position: finalPosition };
    delete dataToSave.basePosition;
    delete dataToSave.positionRank;

    onSave(dataToSave);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease]"
        onClick={onClose}
      ></div>
      <div className="relative z-[1000] w-full max-w-[840px] max-h-[90vh] overflow-y-auto bg-surface border border-border-subtle rounded-[24px] shadow-2xl animate-[slideIn_0.2s_ease] transition-colors duration-300">
        <div className="p-6 md:p-8">
          <div className="mb-6">
            <h2 className="text-text-main text-[24px] md:text-[28px] mb-1 font-extrabold tracking-tight">
              {employee ? "Edit Employee" : "Add Employee"}
            </h2>
            <p className="text-text-muted text-[15px] m-0">
              Fill in the employee information below.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="grid grid-cols-1 gap-6 mb-8">
              {/* Personal Information */}
              <div className="flex flex-col bg-surface-alt border border-border-subtle rounded-[16px] p-5 md:p-6 shadow-sm transition-colors duration-300">
                <h3 className="text-text-main text-[15px] mb-5 font-bold border-b border-border-subtle pb-3">
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-1 gap-5 mb-5">
                  <div className="flex flex-col">
                    <label className="text-[13px] font-semibold text-text-muted mb-2">
                      Employee Photo <span className="text-[11px] text-text-placeholder font-normal ml-1">(Optional)</span>
                    </label>
                    <div className="flex items-center gap-4">
                      {formData.photoUrl && (
                        <img
                          src={formData.photoUrl}
                          alt="Preview"
                          className="w-12 h-12 rounded-full object-cover border border-border-subtle"
                        />
                      )}
                      <div className="flex-1 relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          disabled={isUploading}
                          className="w-full px-4 py-2 border border-border-subtle rounded-[10px] text-[14px] text-text-main bg-surface shadow-sm focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[13px] file:font-semibold file:bg-surface-alt file:text-accent hover:file:bg-surface-hover cursor-pointer disabled:opacity-50"
                        />
                        {isUploading && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <i className="fas fa-spinner fa-spin text-accent"></i>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                  <div className="flex flex-col">
                    <label className="text-[13px] font-semibold text-text-muted mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="px-4 py-2.5 border border-border-subtle rounded-[10px] text-[14px] text-text-main bg-surface shadow-sm focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all placeholder:text-text-placeholder"
                      placeholder="e.g., Santos"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[13px] font-semibold text-text-muted mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="px-4 py-2.5 border border-border-subtle rounded-[10px] text-[14px] text-text-main bg-surface shadow-sm focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all placeholder:text-text-placeholder"
                      placeholder="e.g., Maria"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[13px] font-semibold text-text-muted mb-2">
                      Middle Name <span className="text-[11px] text-text-placeholder font-normal ml-1">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      name="middleName"
                      value={formData.middleName}
                      onChange={handleInputChange}
                      className="px-4 py-2.5 border border-border-subtle rounded-[10px] text-[14px] text-text-main bg-surface shadow-sm focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all placeholder:text-text-placeholder"
                      placeholder="e.g., Reyes"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                  <div className="flex flex-col">
                    <label className="text-[13px] font-semibold text-text-muted mb-2">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="px-4 py-2.5 border border-border-subtle rounded-[10px] text-[14px] text-text-main bg-surface shadow-sm focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all cursor-pointer"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[13px] font-semibold text-text-muted mb-2">
                      Birthdate
                    </label>
                    <input
                      type="date"
                      name="birthdate"
                      value={formData.birthdate}
                      onChange={handleInputChange}
                      className="px-4 py-2.5 border border-border-subtle rounded-[10px] text-[14px] text-text-main bg-surface shadow-sm focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[13px] font-semibold text-text-muted mb-2">
                      Civil Status
                    </label>
                    <select
                      name="civilStatus"
                      value={formData.civilStatus}
                      onChange={handleInputChange}
                      className="px-4 py-2.5 border border-border-subtle rounded-[10px] text-[14px] text-text-main bg-surface shadow-sm focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all cursor-pointer"
                    >
                      <option value="">Select Civil Status</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="flex flex-col">
                    <label className="text-[13px] font-semibold text-text-muted mb-2">
                      Contact No. <span className="text-[11px] text-text-placeholder font-normal ml-1">(Optional)</span>
                    </label>
                    <input
                      type="tel"
                      name="contactNo"
                      value={formData.contactNo}
                      onChange={handleInputChange}
                      className="px-4 py-2.5 border border-border-subtle rounded-[10px] text-[14px] text-text-main bg-surface shadow-sm focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all placeholder:text-text-placeholder"
                      placeholder="e.g., 0917 123 4567"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[13px] font-semibold text-text-muted mb-2">
                      Edu Email <span className="text-[11px] text-text-placeholder font-normal ml-1">(Optional)</span>
                    </label>
                    <input
                      type="email"
                      name="eduEmail"
                      value={formData.eduEmail || ""}
                      onChange={handleInputChange}
                      className="px-4 py-2.5 border border-border-subtle rounded-[10px] text-[14px] text-text-main bg-surface shadow-sm focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all placeholder:text-text-placeholder"
                      placeholder="e.g., juan.santos@deped.gov.ph"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[13px] font-semibold text-text-muted mb-2">
                      Personal Email <span className="text-[11px] text-text-placeholder font-normal ml-1">(Optional)</span>
                    </label>
                    <input
                      type="email"
                      name="personalEmail"
                      value={formData.personalEmail || ""}
                      onChange={handleInputChange}
                      className="px-4 py-2.5 border border-border-subtle rounded-[10px] text-[14px] text-text-main bg-surface shadow-sm focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all placeholder:text-text-placeholder"
                      placeholder="e.g., juan.santos@gmail.com"
                    />
                  </div>
                </div>
              </div>

              {/* Government IDs */}
              <div className="flex flex-col bg-surface-alt border border-border-subtle rounded-[16px] p-5 md:p-6 shadow-sm transition-colors duration-300">
                <h3 className="text-text-main text-[15px] mb-5 font-bold border-b border-border-subtle pb-3">
                  Government IDs & Numbers
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                  <div className="flex flex-col">
                    <label className="text-[13px] font-semibold text-text-muted mb-2">
                      BP No. <span className="text-[11px] text-text-placeholder font-normal ml-1">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      name="bpNo"
                      value={formData.bpNo}
                      onChange={handleInputChange}
                      className="px-4 py-2.5 border border-border-subtle rounded-[10px] text-[14px] text-text-main bg-surface shadow-sm focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all placeholder:text-text-placeholder"
                      placeholder="Enter BP reference number"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[13px] font-semibold text-text-muted mb-2">
                      PhilHealth No. <span className="text-[11px] text-text-placeholder font-normal ml-1">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      name="philhealthNo"
                      value={formData.philhealthNo}
                      onChange={handleInputChange}
                      className="px-4 py-2.5 border border-border-subtle rounded-[10px] text-[14px] text-text-main bg-surface shadow-sm focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all placeholder:text-text-placeholder"
                      placeholder="Enter PhilHealth number"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[13px] font-semibold text-text-muted mb-2">
                      Pag-IBIG No. <span className="text-[11px] text-text-placeholder font-normal ml-1">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      name="pagibigNo"
                      value={formData.pagibigNo}
                      onChange={handleInputChange}
                      className="px-4 py-2.5 border border-border-subtle rounded-[10px] text-[14px] text-text-main bg-surface shadow-sm focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all placeholder:text-text-placeholder"
                      placeholder="Enter Pag-IBIG number"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="flex flex-col">
                    <label className="text-[13px] font-semibold text-text-muted mb-2">
                      Bank Account No. <span className="text-[11px] text-text-placeholder font-normal ml-1">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      name="bankAccountNo"
                      value={formData.bankAccountNo}
                      onChange={handleInputChange}
                      className="px-4 py-2.5 border border-border-subtle rounded-[10px] text-[14px] text-text-main bg-surface shadow-sm focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all placeholder:text-text-placeholder"
                      placeholder="Enter bank account number"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[13px] font-semibold text-text-muted mb-2">
                      Item No. <span className="text-[11px] text-text-placeholder font-normal ml-1">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      name="itemNo"
                      value={formData.itemNo}
                      onChange={handleInputChange}
                      className="px-4 py-2.5 border border-border-subtle rounded-[10px] text-[14px] text-text-main bg-surface shadow-sm focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all placeholder:text-text-placeholder"
                      placeholder="Enter plantilla item number"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[13px] font-semibold text-text-muted mb-2">
                      TIN <span className="text-[11px] text-text-placeholder font-normal ml-1">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      name="tin"
                      value={formData.tin}
                      onChange={handleInputChange}
                      className="px-4 py-2.5 border border-border-subtle rounded-[10px] text-[14px] text-text-main bg-surface shadow-sm focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all placeholder:text-text-placeholder"
                      placeholder="Enter TIN"
                    />
                  </div>
                </div>
              </div>

              {/* Employment Details */}
              <div className="flex flex-col bg-surface-alt border border-border-subtle rounded-[16px] p-5 md:p-6 shadow-sm transition-colors duration-300">
                <h3 className="text-text-main text-[15px] mb-5 font-bold border-b border-border-subtle pb-3">
                  Employment Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <div className="flex flex-col">
                    <label className="text-[13px] font-semibold text-text-muted mb-2">
                      Personnel Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="personnelCategory"
                      value={formData.personnelCategory}
                      onChange={handleInputChange}
                      required
                      className="px-4 py-2.5 border border-border-subtle rounded-[10px] text-[14px] text-text-main bg-surface shadow-sm focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all cursor-pointer"
                    >
                      <option value="">Select Category</option>
                      <option value="Teaching">Teaching</option>
                      <option value="Non-Teaching">Non-Teaching</option>
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[13px] font-semibold text-text-muted mb-2">
                      School Level <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="schoolLevel"
                      value={formData.schoolLevel}
                      onChange={handleInputChange}
                      required
                      className="px-4 py-2.5 border border-border-subtle rounded-[10px] text-[14px] text-text-main bg-surface shadow-sm focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all cursor-pointer"
                    >
                      <option value="">Select Level</option>
                      <option value="Junior High">Junior High</option>
                      <option value="Senior High">Senior High</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-1 gap-5 mb-5">
                  <div className="flex flex-col">
                    <label className="text-[13px] font-semibold text-text-muted mb-2">
                      Department <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      required
                      disabled={!formData.schoolLevel}
                      className="px-4 py-2.5 border border-border-subtle rounded-[10px] text-[14px] text-text-main bg-surface shadow-sm focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {!formData.schoolLevel
                          ? "Select School Level First"
                          : `Select ${formData.schoolLevel} Department`}
                      </option>
                      {formData.schoolLevel && DEPARTMENT_OPTIONS[formData.schoolLevel]?.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                      {!DEPARTMENT_OPTIONS[formData.schoolLevel] && formData.department && (
                        <option value={formData.department}>{formData.department}</option>
                      )}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                  <div className="flex flex-col">
                    <label className="text-[13px] font-semibold text-text-muted mb-2">
                      Employee No. <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="employeeNo"
                      value={formData.employeeNo}
                      onChange={handleInputChange}
                      required
                      className="px-4 py-2.5 border border-border-subtle rounded-[10px] text-[14px] text-text-main bg-surface shadow-sm focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all placeholder:text-text-placeholder"
                      placeholder="e.g., EMS-2026-001"
                    />
                  </div>
                  <div className="flex flex-col md:col-span-2">
                    <label className="text-[13px] font-semibold text-text-muted mb-2">
                      Position <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        name="basePosition"
                        value={formData.basePosition || ""}
                        onChange={handleInputChange}
                        required
                        list="positionList"
                        className="flex-1 px-4 py-2.5 border border-border-subtle rounded-[10px] text-[14px] text-text-main bg-surface shadow-sm focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all placeholder:text-text-placeholder uppercase"
                        placeholder="e.g., TEACHER"
                      />
                      <datalist id="positionList">
                        <option value="TEACHER" />
                        <option value="MASTER TEACHER" />
                        <option value="ADMINISTRATIVE ASSISTANT" />
                        <option value="PRINCIPAL" />
                      </datalist>
                      <select
                        name="positionRank"
                        value={formData.positionRank || ""}
                        onChange={handleInputChange}
                        className="w-20 sm:w-24 px-3 py-2.5 border border-border-subtle rounded-[10px] text-[14px] text-text-main bg-surface shadow-sm focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all cursor-pointer"
                      >
                        <option value="">None</option>
                        <option value="I">I</option>
                        <option value="II">II</option>
                        <option value="III">III</option>
                        <option value="IV">IV</option>
                        <option value="V">V</option>
                        <option value="VI">VI</option>
                        <option value="VII">VII</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <div className="flex flex-col">
                    <label className="text-[13px] font-semibold text-text-muted mb-2">
                      Salary Grade <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="salaryGrade"
                      value={formData.salaryGrade}
                      onChange={handleInputChange}
                      required
                      className="px-4 py-2.5 border border-border-subtle rounded-[10px] text-[14px] text-text-main bg-surface shadow-sm focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all placeholder:text-text-placeholder"
                      placeholder="e.g., SG-11"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[13px] font-semibold text-text-muted mb-2">
                      Step <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="step"
                      value={formData.step}
                      onChange={handleInputChange}
                      required
                      className="px-4 py-2.5 border border-border-subtle rounded-[10px] text-[14px] text-text-main bg-surface shadow-sm focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all cursor-pointer"
                    >
                      <option value="">Select Step</option>
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <option key={n} value={n}>
                          Step {n}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <div className="flex flex-col">
                    <label className="text-[13px] font-semibold text-text-muted mb-2">
                      Date of Original Appointment{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="originalAppointmentDate"
                      value={formData.originalAppointmentDate}
                      onChange={handleInputChange}
                      required
                      className="px-4 py-2.5 border border-border-subtle rounded-[10px] text-[14px] text-text-main bg-surface shadow-sm focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[13px] font-semibold text-text-muted mb-2">
                      Date of Last Promotion
                    </label>
                    <input
                      type="date"
                      name="lastPromotionDate"
                      value={formData.lastPromotionDate}
                      onChange={handleInputChange}
                      className="px-4 py-2.5 border border-border-subtle rounded-[10px] text-[14px] text-text-main bg-surface shadow-sm focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all"
                    />
                  </div>
                </div>

                {/* Leave Balances */}
                <h3 className="text-text-main text-[13px] mb-4 font-bold border-t border-border-subtle pt-4">
                  Initial Leave Balances
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col">
                    <label className="text-[13px] font-semibold text-text-muted mb-2">
                      Local Leave Balance
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      name="localLeaveBalance"
                      value={formData.localLeaveBalance}
                      onChange={handleInputChange}
                      className="px-4 py-2.5 border border-border-subtle rounded-[10px] text-[14px] text-text-main bg-surface shadow-sm focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all"
                      placeholder="0.000"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[13px] font-semibold text-text-muted mb-2">
                      D.O. Leave Balance
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      name="doLeaveBalance"
                      value={formData.doLeaveBalance}
                      onChange={handleInputChange}
                      className="px-4 py-2.5 border border-border-subtle rounded-[10px] text-[14px] text-text-main bg-surface shadow-sm focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all"
                      placeholder="0.000"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-5 border-t border-border-subtle">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface-alt text-text-muted border border-border-subtle rounded-[12px] cursor-pointer text-[14px] font-semibold transition-all duration-200 shadow-sm hover:bg-surface-hover hover:text-text-main group"
              >
                <i className="fas fa-times text-text-placeholder"></i>{" "}
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-accent-text border border-accent rounded-[12px] cursor-pointer text-[14px] font-semibold transition-all duration-200 shadow-sm hover:bg-accent-hover hover:-translate-y-0.5 group disabled:opacity-50 disabled:cursor-wait"
              >
                <i className="fas fa-save text-accent-text/80"></i>{" "}
                {employee ? "Update Employee" : "Save Employee"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PersonnelFormModal;

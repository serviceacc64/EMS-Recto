import React, { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext";
import { supabase } from "../lib/supabaseClient";
import { getSalary } from "../lib/salaryData";

const EMPLOYEE_STORAGE_KEY = "emsEmployees";

const DEPARTMENT_OPTIONS = {
  "Junior High": [
    "ENGLISH",
    "FILIPINO",
    "MATHEMATICS",
    "SCIENCE",
    "ARALING PANLIPUNAN",
    "MAPEH",
    "ESP",
    "TLE"
  ],
  "Senior High": [
    "HUMMS",
    "ARTS & DESIGN",
    "STEM",
    "ABM",
    "TECH"
  ]
};

const JuniorHigh = () => {
  const { showToast } = useNotifications();
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [deletingIndex, setDeletingIndex] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [openDropdownIndex, setOpenDropdownIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "desc",
  });
  const [departmentFilter, setDepartmentFilter] = useState("All Departments");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const itemsPerPage = 8;

  const [itemHistory, setItemHistory] = useState([]);
  const [isLastHolderModalOpen, setIsLastHolderModalOpen] = useState(false);
  const [isLoadingLastHolder, setIsLoadingLastHolder] = useState(false);

  const fetchItemHistory = async (itemNo) => {
    setIsLoadingLastHolder(true);
    setIsLastHolderModalOpen(true);
    setItemHistory([]);

    const { data: history, error: historyError } = await supabase
      .from("item_history")
      .select("*")
      .eq("item_no", itemNo)
      .order("assigned_at", { ascending: false });

    if (historyError || !history || history.length === 0) {
      setItemHistory([{ notFound: true, itemNo }]);
      setIsLoadingLastHolder(false);
      return;
    }

    const historyWithDetails = await Promise.all(
      history.map(async (entry) => {
        const { data: emp, error: empError } = await supabase
          .from("employees")
          .select("*")
          .eq("employee_no", entry.employee_no)
          .single();

        if (empError || !emp) {
          return { ...entry, deleted: true };
        } else {
          return { ...entry, ...toCamelCase(emp) };
        }
      })
    );

    setItemHistory(historyWithDetails);
    setIsLoadingLastHolder(false);
  };

  const initialFormState = {
    lastName: "",
    firstName: "",
    middleName: "",
    gender: "",
    birthdate: "",
    civilStatus: "",
    contactNo: "",
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
    schoolLevel: "Junior High",
    localLeaveBalance: 0,
    doLeaveBalance: 0,
  };
  const [formData, setFormData] = useState(initialFormState);

  const toSnakeCase = (obj) => {
    if (!obj) return obj;
    const newObj = {};
    for (const key in obj) {
      if (key === "id") {
        newObj[key] = obj[key];
        continue;
      }
      const snakeKey = key.replace(
        /[A-Z]/g,
        (letter) => "_" + letter.toLowerCase(),
      );
      newObj[snakeKey] = obj[key];
    }
    return newObj;
  };

  const toCamelCase = (obj) => {
    if (!obj) return obj;
    const newObj = {};
    for (const key in obj) {
      if (key === "id") {
        newObj[key] = obj[key];
        continue;
      }
      const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      newObj[camelKey] = obj[key];
    }
    return newObj;
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // PERSISTENCE: Save draft to sessionStorage when adding new personnel
  useEffect(() => {
    if (isModalOpen && editingIndex === null) {
      const draftData = { ...formData };
      sessionStorage.setItem("junior_high_draft", JSON.stringify(draftData));
    }
  }, [formData, isModalOpen, editingIndex]);

  const fetchEmployees = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("school_level", "Junior High")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching employees:", error);
    } else {
      setEmployees(data ? data.map(toCamelCase) : []);
    }
    setIsLoading(false);
  };

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const empId = searchParams.get("id");
    const action = searchParams.get("action");

    if (empId && action === "view" && employees.length > 0) {
      const emp = employees.find((e) => e.employeeNo === empId);
      if (emp) {
        handleView(emp);
      }
    }
  }, [searchParams, employees]);

  const filteredEmployees = employees.filter((emp) => {
    if (
      departmentFilter !== "All Departments" &&
      emp.department?.toUpperCase() !== departmentFilter.toUpperCase()
    ) {
      return false;
    }

    if (
      categoryFilter !== "All Categories" &&
      emp.personnelCategory !== categoryFilter
    ) {
      return false;
    }

    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    const searchString = [
      emp.employeeNo,
      emp.lastName,
      emp.firstName,
      emp.middleName,
      emp.gender,
      emp.position,
      emp.step,
      emp.salaryGrade,
      emp.contactNo,
      emp.department,
      emp.personnelCategory,
      emp.schoolLevel,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchString.includes(s);
  });

  const departmentOptions = useMemo(() => {
    const officialDepts = DEPARTMENT_OPTIONS["Junior High"] || [];
    const existingDepts = employees
      .map((emp) => emp.department)
      .filter(Boolean);

    const allDepts = [...new Set([...officialDepts, ...existingDepts])].sort();

    return ["All Departments", ...allDepts];
  }, [employees]);

  const romanToInt = (roman) => {
    const map = {
      I: 1,
      II: 2,
      III: 3,
      IV: 4,
      V: 5,
      VI: 6,
      VII: 7,
      VIII: 8,
      IX: 9,
      X: 10,
    };
    return map[roman] || 0;
  };

  const getSortValue = (emp, key) => {
    if (key === "position" && emp.position) {
      const match = emp.position.match(
        /(.*?)\s+(I|II|III|IV|V|VI|VII|VIII|IX|X)$/i,
      );

      let base = emp.position.trim().toUpperCase();
      let rankNum = 0;

      if (match) {
        base = match[1].trim().toUpperCase();
        rankNum = romanToInt(match[2].toUpperCase());
      }

      // Rank mapping (lower number = higher rank)
      const hierarchy = {
        PRINCIPAL: "10",
        "MASTER TEACHER": "20",
        TEACHER: "30",
        "ADMINISTRATIVE ASSISTANT": "40",
      };

      const weight = hierarchy[base] || "99";

      // Invert rankNum so III (3) comes before I (1) when ascending
      const invertedRank = String(99 - rankNum).padStart(2, "0");

      return `${weight}-${invertedRank}-${base}`;
    }

    if (typeof emp[key] === "string") {
      return emp[key].toUpperCase();
    }

    return emp[key] || "";
  };

  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    const valA = getSortValue(a, sortConfig.key);
    const valB = getSortValue(b, sortConfig.key);

    if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
    if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEmployees = sortedEmployees.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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
      showToast("Error uploading photo: " + uploadError.message, "error");
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

  const handleAdd = () => {
    const savedDraft = sessionStorage.getItem("junior_high_draft");
    if (savedDraft) {
      try {
        setFormData(JSON.parse(savedDraft));
        showToast("Restored your unsaved draft", "info");
      } catch (e) {
        setFormData(initialFormState);
      }
    } else {
      setFormData(initialFormState);
    }
    setEditingIndex(null);
    setIsModalOpen(true);
  };

  const handleEdit = (emp) => {
    const realIndex = employees.findIndex(
      (e) => e.employeeNo === emp.employeeNo,
    );
    const empData = { ...employees[realIndex] };

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
    setEditingIndex(realIndex);
    setIsModalOpen(true);
  };

  const handleView = (emp) => {
    setViewingEmployee(emp);
    setIsViewModalOpen(true);
  };

  const handleDeletePrompt = (emp) => {
    const realIndex = employees.findIndex(
      (e) => e.employeeNo === emp.employeeNo,
    );
    setDeletingIndex(realIndex);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deletingIndex !== null) {
      const empToDelete = employees[deletingIndex];
      if (empToDelete.id) {
        const { error } = await supabase
          .from("employees")
          .delete()
          .eq("id", empToDelete.id);
        if (error) {
          showToast("Failed to delete: " + error.message, "error");
          return;
        }
        showToast("Employee record removed", "success");
      }
      const newEmployees = [...employees];
      newEmployees.splice(deletingIndex, 1);
      setEmployees(newEmployees);
    }
    setIsDeleteModalOpen(false);
    setDeletingIndex(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const finalBase = formData.basePosition
      ? formData.basePosition.trim().toUpperCase()
      : "";
    const finalPosition = formData.positionRank
      ? `${finalBase} ${formData.positionRank}`
      : finalBase;

    // Require core fields
    const required = [
      "lastName",
      "firstName",
      "employeeNo",
      "basePosition",
      "salaryGrade",
      "step",
      "originalAppointmentDate",
      "department",
      "personnelCategory",
      "schoolLevel",
    ];
    for (let field of required) {
      if (!formData[field] || String(formData[field]).trim() === "") {
        showToast(`Missing required field: ${field}`, "error");
        return;
      }
    }

    const isDuplicate = employees.some(
      (emp, idx) =>
        emp.employeeNo === formData.employeeNo && idx !== editingIndex,
    );
    if (isDuplicate) {
      showToast("Employee number already exists.", "error");
      return;
    }

    const dataToSave = { ...formData, position: finalPosition };
    delete dataToSave.basePosition;
    delete dataToSave.positionRank;

    const dbData = toSnakeCase(dataToSave);

    if (editingIndex !== null) {
      const oldEmp = employees[editingIndex];
      const oldItemNo = oldEmp.itemNo;

      const { error } = await supabase
        .from("employees")
        .update(dbData)
        .eq("id", formData.id);
      if (error) {
        showToast("Update failed: " + error.message, "error");
        return;
      }
      showToast("Profile updated successfully", "success");

      // TRACK ITEM HISTORY: If item number changed, update ledger
      if (oldItemNo !== formData.itemNo) {
        // Close old assignment record
        if (oldItemNo) {
          const { error: closeError } = await supabase
            .from("item_history")
            .update({ vacated_at: new Date().toISOString() })
            .eq("item_no", oldItemNo)
            .eq("employee_no", formData.employeeNo)
            .is("vacated_at", null);

          if (closeError) {
            // Handle error silently or notify user
          }
        }

        // Create new assignment record
        if (formData.itemNo) {
          const { error: openError } = await supabase.from("item_history").insert([
            {
              item_no: formData.itemNo,
              employee_no: formData.employeeNo,
              assigned_at: new Date().toISOString(),
            },
          ]);

          if (openError) {
            // Handle error silently or notify user
          }
        }
      }

      const newEmployees = [...employees];
      newEmployees[editingIndex] = dataToSave;
      setEmployees(newEmployees);
    } else {
      if (!dbData.id) delete dbData.id;
      const { data, error } = await supabase
        .from("employees")
        .insert([dbData])
        .select();
      if (error) {
        showToast("Insert failed: " + error.message, "error");
        return;
      }
      showToast("Personnel added successfully", "success");

      // Log initial item assignment
      if (formData.itemNo) {
        const { error: historyError } = await supabase.from("item_history").insert([
          {
            item_no: formData.itemNo,
            employee_no: formData.employeeNo,
            assigned_at: new Date().toISOString(),
          },
        ]);

        if (historyError) {
          // Handle error silently or notify user
        }
      }
      const newEmployees = [toCamelCase(data[0]), ...employees];
      setEmployees(newEmployees);
      // Clear draft on successful save
      sessionStorage.removeItem("junior_high_draft");
    }

    setIsModalOpen(false);
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const SkeletonList = () => (
    <div className="flex-1 overflow-hidden">
      {viewMode === "table" ? (
        <div className="border border-border-subtle rounded-[24px] bg-surface overflow-hidden">
          <div className="h-12 bg-surface-alt/50 border-b border-border-subtle"></div>
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="h-14 border-b border-border-subtle/50 flex items-center px-4 gap-4">
              <div className="w-24 h-4 skeleton"></div>
              <div className="flex-1 h-4 skeleton"></div>
              <div className="w-20 h-6 skeleton rounded-full"></div>
              <div className="w-32 h-4 skeleton"></div>
              <div className="w-24 h-4 skeleton"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="bg-surface border border-border-subtle rounded-[24px] p-5 h-[340px] flex flex-col justify-between">
              <div className="flex justify-between">
                <div className="w-14 h-14 rounded-full skeleton"></div>
                <div className="w-8 h-8 rounded-full skeleton"></div>
              </div>
              <div className="space-y-2 mt-4">
                <div className="w-3/4 h-5 skeleton"></div>
                <div className="w-1/2 h-3 skeleton"></div>
              </div>
              <div className="flex gap-2 mt-4">
                <div className="w-16 h-5 skeleton rounded-md"></div>
                <div className="w-16 h-5 skeleton rounded-md"></div>
              </div>
              <div className="mt-4 p-4 rounded-2xl bg-surface-alt/50 h-24 skeleton"></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full relative animate-[fadeIn_0.4s_ease-out]">
      {/* Search & Action Bar */}
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-stretch xl:items-center mb-6 shrink-0">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative group flex-1 max-w-md">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-placeholder group-focus-within:text-accent transition-colors">
              <i className="fas fa-search text-[14px]"></i>
            </div>
            <input
              type="text"
              placeholder="Search Junior High personnel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface border border-border-subtle rounded-[16px] pl-11 pr-4 py-3 text-[14px] text-text-main font-bold placeholder:text-text-placeholder/60 outline-none focus:border-accent focus:ring-4 focus:ring-accent/5 shadow-sm transition-all"
            />
          </div>

          {/* View Toggles */}
          <div className="flex bg-surface-alt/50 border border-border-subtle p-1 rounded-[14px] shadow-sm self-start">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3.5 py-2 rounded-[10px] flex items-center justify-center gap-2 transition-all font-black text-[10px] uppercase tracking-wider ${viewMode === "grid" ? "bg-surface shadow-sm text-accent border border-border-subtle" : "text-text-muted hover:text-text-main"}`}
            >
              <i className="fas fa-th-large"></i>
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3.5 py-2 rounded-[10px] flex items-center justify-center gap-2 transition-all font-black text-[10px] uppercase tracking-wider ${viewMode === "table" ? "bg-surface shadow-sm text-accent border border-border-subtle" : "text-text-muted hover:text-text-main"}`}
            >
              <i className="fas fa-list"></i>
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
            <div className="relative">
              <select
                value={departmentFilter}
                onChange={(e) => {
                  setDepartmentFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-surface border border-border-subtle text-text-main text-[11px] font-black uppercase tracking-wider rounded-[14px] pl-4 pr-10 py-3 outline-none focus:border-accent focus:ring-4 focus:ring-accent/5 shadow-sm appearance-none cursor-pointer transition-all hover:border-accent/30 min-w-[160px]"
              >
                {departmentOptions.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-placeholder pointer-events-none text-[10px]">
                <i className="fas fa-chevron-down"></i>
              </div>
            </div>

            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-surface border border-border-subtle text-text-main text-[11px] font-black uppercase tracking-wider rounded-[14px] pl-4 pr-10 py-3 outline-none focus:border-accent focus:ring-4 focus:ring-accent/5 shadow-sm appearance-none cursor-pointer transition-all hover:border-accent/30"
              >
                <option value="All Categories">All Categories</option>
                <option value="Teaching">Teaching</option>
                <option value="Non-Teaching">Non-Teaching</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-placeholder pointer-events-none text-[10px]">
                <i className="fas fa-chevron-down"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Add Button */}
        <button
          onClick={handleAdd}
          className="bg-accent text-accent-text px-6 py-3 rounded-[16px] font-black text-[12px] uppercase tracking-[0.1em] shadow-lg shadow-accent/20 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2.5 border border-accent/20"
        >
          <i className="fas fa-user-plus text-[14px]"></i>
          <span>Add Personnel</span>
        </button>
      </div>

      {isLoading ? (
        <SkeletonList />
      ) : viewMode === "table" ? (
        <div className="flex-1 w-full min-h-0 overflow-auto border border-border-subtle rounded-[24px] bg-surface shadow-sm mb-4 custom-scrollbar">
          <table className="w-full min-w-[1000px] table-fixed border-collapse text-[13px]">
            <thead className="bg-surface-alt/50 backdrop-blur-md sticky top-0 z-10 border-b border-border-subtle">
              <tr>
                <th
                   className="p-4 w-[14%] text-left font-black text-text-placeholder uppercase tracking-[0.2em] text-[10px] cursor-pointer hover:bg-surface-hover transition-colors"
                  onClick={() => handleSort("employeeNo")}
                >
                  <div className="flex items-center gap-2">
                    ID No.
                    {sortConfig.key === "employeeNo" && (
                      <i className={`fas fa-sort-${sortConfig.direction === "asc" ? "up" : "down"} text-accent`}></i>
                    )}
                  </div>
                </th>
                <th
                  className="p-4 w-[22%] text-left font-black text-text-placeholder uppercase tracking-[0.2em] text-[10px] cursor-pointer hover:bg-surface-hover transition-colors"
                  onClick={() => handleSort("lastName")}
                >
                   <div className="flex items-center gap-2">
                    Personnel Name
                    {sortConfig.key === "lastName" && (
                      <i className={`fas fa-sort-${sortConfig.direction === "asc" ? "up" : "down"} text-accent`}></i>
                    )}
                  </div>
                </th>
                <th className="p-4 w-[10%] text-left font-black text-text-placeholder uppercase tracking-[0.2em] text-[10px]">Gender</th>
                <th
                  className="p-4 w-[18%] text-left font-black text-text-placeholder uppercase tracking-[0.2em] text-[10px] cursor-pointer hover:bg-surface-hover transition-colors"
                  onClick={() => handleSort("position")}
                >
                   <div className="flex items-center gap-2">
                    Position
                    {sortConfig.key === "position" ? (
                      <i className={`fas fa-sort-${sortConfig.direction === "asc" ? "up" : "down"} text-accent`}></i>
                    ) : <i className="fas fa-sort opacity-20"></i>}
                  </div>
                </th>
                <th className="p-4 w-[12%] text-left font-black text-text-placeholder uppercase tracking-[0.2em] text-[10px]">SG/Step</th>
                <th className="p-4 w-[12%] text-left font-black text-text-placeholder uppercase tracking-[0.2em] text-[10px]">Salary</th>
                <th className="p-4 w-[12%] text-right font-black text-text-placeholder uppercase tracking-[0.2em] text-[10px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/50">
              {paginatedEmployees.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-text-placeholder font-bold">
                    No personnel records found.
                  </td>
                </tr>
              ) : (
                paginatedEmployees.map((emp) => (
                  <tr
                    key={emp.employeeNo}
                    className="hover:bg-surface-alt/50 transition-colors group"
                  >
                    <td className="p-4 text-text-muted font-bold tracking-tight">
                      {emp.employeeNo}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                         <img
                          src={emp.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.lastName)}&background=random&color=fff&bold=true`}
                          className="w-8 h-8 rounded-full border border-border-subtle object-cover"
                        />
                        <span className="text-text-main font-black">
                          {[emp.lastName, emp.firstName].filter(Boolean).join(", ")}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${emp.gender === "Male" ? "text-icon-cyan bg-icon-cyan/10" : "text-icon-pink bg-icon-pink/10"}`}>
                        {emp.gender}
                      </span>
                    </td>
                    <td className="p-4 text-text-main font-bold text-[12px] opacity-80 uppercase tracking-tight">
                      {emp.position}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 font-black text-[11px] text-accent">
                        <span>{emp.salaryGrade}</span>
                        <span className="opacity-30">/</span>
                        <span className="opacity-70">{emp.step}</span>
                      </div>
                    </td>
                    <td className="p-4 text-emerald-400 font-black text-[13px] tracking-tighter">
                      {getSalary(emp.salaryGrade, emp.step)}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleView(emp)}
                          className="w-8 h-8 rounded-lg bg-surface-alt text-text-placeholder hover:text-accent hover:bg-accent/10 transition-all flex items-center justify-center border border-border-subtle"
                          title="View Details"
                        >
                          <i className="fas fa-eye text-[12px]"></i>
                        </button>
                        <button
                          onClick={() => handleEdit(emp)}
                          className="w-8 h-8 rounded-lg bg-surface-alt text-text-placeholder hover:text-icon-cyan hover:bg-icon-cyan/10 transition-all flex items-center justify-center border border-border-subtle"
                          title="Edit"
                        >
                          <i className="fas fa-pen text-[12px]"></i>
                        </button>
                        <button
                          onClick={() => handleDeletePrompt(emp)}
                          className="w-8 h-8 rounded-lg bg-surface-alt text-text-placeholder hover:text-red-500 hover:bg-red-500/10 transition-all flex items-center justify-center border border-border-subtle"
                          title="Delete"
                        >
                          <i className="fas fa-trash text-[12px]"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto mb-4 pr-1 custom-scrollbar">
          {paginatedEmployees.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 bg-surface border border-border-subtle rounded-[32px] text-text-muted">
              <i className="fas fa-users-slash text-4xl mb-4 opacity-20"></i>
              <p className="text-sm font-bold opacity-60">No personnel found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedEmployees.map((emp, i) => {
                const fullName = [emp.lastName, emp.firstName].join(", ");
                const avatarUrl = emp.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.lastName)}&background=random&color=fff&bold=true`;
                const isOpen = openDropdownIndex === emp.employeeNo;

                return (
                  <div
                    key={emp.employeeNo}
                    className="bg-surface border border-border-subtle rounded-[28px] p-5 shadow-sm hover:shadow-2xl hover:border-accent/40 transition-all duration-500 group flex flex-col relative overflow-hidden stagger-item"
                    style={{"--delay": `${i * 0.05}s`}}
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-transparent to-white/5 dark:to-white/2 pointer-events-none"></div>
                    
                    {/* Header: Photo & Action */}
                    <div className="flex justify-between items-start mb-5">
                      <div className="relative">
                         <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-border-subtle shadow-md group-hover:scale-105 transition-transform duration-500">
                          <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                        </div>
                        <span className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-surface rounded-full ${emp.photoUrl ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                      </div>

                      <div className="relative">
                        <button
                          onClick={() => setOpenDropdownIndex(isOpen ? null : emp.employeeNo)}
                          className="w-9 h-9 flex items-center justify-center text-text-placeholder hover:text-text-main hover:bg-surface-alt rounded-xl border border-transparent hover:border-border-subtle transition-all"
                        >
                          <i className="fas fa-ellipsis-v text-sm"></i>
                        </button>

                        {isOpen && (
                          <div className="absolute right-0 top-11 w-44 bg-surface border border-border-subtle rounded-[18px] shadow-2xl overflow-hidden z-20 animate-[slideUp_0.2s_ease-out]">
                            <button
                              onMouseDown={() => handleEdit(emp)}
                              className="w-full text-left px-4 py-3 text-[12px] font-black uppercase tracking-wider text-text-main hover:bg-surface-alt flex items-center gap-3 transition-colors"
                            >
                              <i className="fas fa-edit text-icon-cyan"></i> Edit Profile
                            </button>
                            <button
                              onMouseDown={() => handleDeletePrompt(emp)}
                              className="w-full text-left px-4 py-3 text-[12px] font-black uppercase tracking-wider text-red-500 hover:bg-red-500/5 flex items-center gap-3 transition-colors border-t border-border-subtle/50"
                            >
                              <i className="fas fa-trash-alt"></i> Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 mb-5">
                      <h3 className="text-text-main font-black text-[17px] truncate tracking-tight m-0 group-hover:text-accent transition-colors" title={fullName}>
                        {fullName}
                      </h3>
                      <p className="text-text-placeholder text-[11px] font-black uppercase tracking-[0.1em] mt-1 opacity-80 truncate">
                        {emp.position}
                      </p>
                      
                      <div className="flex flex-wrap gap-1.5 mt-4">
                        <span className="px-2.5 py-1 rounded-full bg-accent/5 text-accent text-[9px] font-black uppercase tracking-widest border border-accent/10">
                          {emp.personnelCategory}
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-surface-alt text-text-muted text-[9px] font-black uppercase tracking-widest border border-border-subtle">
                          {emp.schoolLevel}
                        </span>
                      </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 bg-surface-alt/40 p-4 rounded-[22px] mb-5 border border-border-subtle/50">
                       <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-text-placeholder opacity-60">Salary</span>
                        <div className="text-[14px] font-black text-emerald-400 tracking-tight">{getSalary(emp.salaryGrade, emp.step)}</div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-text-placeholder opacity-60">ID Number</span>
                        <div className="text-[12px] font-black text-text-main opacity-80">{emp.employeeNo}</div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <button
                      onClick={() => handleView(emp)}
                      className="w-full py-3.5 bg-surface-alt border border-border-subtle rounded-2xl text-[11px] font-black uppercase tracking-widest text-text-main hover:bg-accent hover:text-accent-text hover:border-accent transition-all duration-300 flex items-center justify-center gap-2 group/btn shadow-sm"
                    >
                      <span>View Profile</span>
                      <i className="fas fa-chevron-right text-[10px] group-hover/btn:translate-x-1 transition-transform"></i>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Pagination Controls - Premium Refinement */}
      {filteredEmployees.length > itemsPerPage && (
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-surface border border-border-subtle rounded-[24px] shadow-sm shrink-0 gap-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-accent/5 flex items-center justify-center text-accent border border-accent/10">
               <i className="fas fa-users text-sm"></i>
             </div>
             <span className="text-text-muted text-[13px] font-bold">
               <span className="text-text-main">{filteredEmployees.length}</span> Total Personnel
             </span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-10 h-10 rounded-xl border border-border-subtle bg-surface-alt text-text-main flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-hover hover:border-accent/30 transition-all"
            >
              <i className="fas fa-chevron-left text-[12px]"></i>
            </button>

            <div className="flex items-center gap-1.5 px-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Simplified pagination for many pages
                if (totalPages > 5 && Math.abs(page - currentPage) > 1 && page !== 1 && page !== totalPages) return null;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-xl text-[13px] font-black transition-all ${currentPage === page ? "bg-accent text-accent-text border border-accent shadow-lg shadow-accent/20" : "border border-border-subtle bg-surface-alt text-text-muted hover:text-text-main hover:border-accent/30"}`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-10 h-10 rounded-xl border border-border-subtle bg-surface-alt text-text-main flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-hover hover:border-accent/30 transition-all"
            >
              <i className="fas fa-chevron-right text-[12px]"></i>
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease]"
            onClick={() => setIsModalOpen(false)}
          ></div>
          <div className="relative z-[1000] w-full max-w-[840px] max-h-[90vh] overflow-y-auto bg-surface border border-border-subtle rounded-[24px] shadow-2xl animate-[slideIn_0.2s_ease] transition-colors duration-300">
            <div className="p-6 md:p-8">
              <div className="mb-6">
                <h2 className="text-text-main text-[24px] md:text-[28px] mb-1 font-extrabold tracking-tight">
                  {editingIndex !== null ? "Edit Junior High Employee" : "Add Junior High Employee"}
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
                          Employee Photo
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
                          Middle Name
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
                          Gender <span className="text-text-placeholder font-normal">(Optional)</span>
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
                          Birthdate <span className="text-text-placeholder font-normal">(Optional)</span>
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
                          Civil Status <span className="text-text-placeholder font-normal">(Optional)</span>
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
                          Contact No. <span className="text-text-placeholder font-normal">(Optional)</span>
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
                          BP No.
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
                          PhilHealth No.
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
                          Pag-IBIG No.
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
                          Bank Account No.
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
                          Item No.
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
                          TIN
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                  </div>

                  {/* Leave Balances */}
                  <div className="flex flex-col bg-surface-alt border border-border-subtle rounded-[16px] p-5 md:p-6 shadow-sm transition-colors duration-300">
                    <h3 className="text-text-main text-[15px] mb-5 font-bold border-b border-border-subtle pb-3">
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
                    onClick={() => setIsModalOpen(false)}
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
                    {editingIndex !== null
                      ? "Update Junior High Record"
                      : "Save Junior High Record"}
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
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease]"
            onClick={() => setIsDeleteModalOpen(false)}
          ></div>
          <div className="relative z-[1000] w-full max-w-[420px] bg-surface border border-border-subtle rounded-[32px] shadow-2xl animate-[slideIn_0.2s_ease] overflow-hidden">
             <div className="p-8 text-center">
                <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl shadow-inner">
                  <i className="fas fa-exclamation-triangle"></i>
                </div>
                <h2 className="text-text-main text-[24px] mb-3 font-black tracking-tight">
                  Confirm Deletion
                </h2>
                <p className="text-text-muted text-[15px] leading-relaxed m-0 font-medium">
                  Are you sure you want to remove <span className="text-text-main font-bold">"{employees[deletingIndex]?.lastName}, {employees[deletingIndex]?.firstName}"</span>? This action cannot be undone and will permanently delete the record.
                </p>
                <div className="grid grid-cols-2 gap-3 mt-10">
                  <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="py-3.5 bg-surface-alt text-text-main border border-border-subtle rounded-2xl text-[13px] font-black uppercase tracking-widest hover:bg-surface-hover transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    className="py-3.5 bg-red-600 text-white border border-red-700 rounded-2xl text-[13px] font-black uppercase tracking-widest hover:bg-red-500 shadow-lg shadow-red-600/20 transition-all active:scale-95"
                  >
                    Delete Now
                  </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {isViewModalOpen && viewingEmployee && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease]"
            onClick={() => {
              setIsViewModalOpen(false);
              setSearchParams({});
            }}
          ></div>
          <div className="relative z-[1000] w-full max-w-[700px] max-h-[90vh] overflow-y-auto bg-surface border border-border-subtle rounded-[24px] shadow-2xl animate-[slideIn_0.2s_ease] transition-colors duration-300">
            <div className="p-6 md:p-8">
              {/* Header Profile */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-8 pb-6 border-b border-border-subtle">
                <img
                  src={
                    viewingEmployee.photoUrl ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(viewingEmployee.lastName + " " + viewingEmployee.firstName)}&background=random&color=fff&bold=true`
                  }
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-4 border-surface shadow-md"
                />
                <div className="flex-1 pr-10">
                  <div className="flex flex-wrap items-center gap-3 mb-1">
                    <h2 className="text-text-main text-[24px] font-extrabold tracking-tight">
                      {[
                        viewingEmployee.lastName,
                        viewingEmployee.firstName,
                        viewingEmployee.middleName,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </h2>
                    <span className="px-2.5 py-1 rounded-full text-[12px] font-bold bg-surface-alt text-accent border border-accent/30">
                      {viewingEmployee.employeeNo}
                    </span>
                  </div>
                  <p className="text-text-muted text-[15px] font-medium">
                    {viewingEmployee.position} • {viewingEmployee.gender}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setSearchParams({});
                  }}
                  className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-surface-alt text-text-muted hover:text-text-main hover:bg-surface-hover rounded-full transition-colors border border-border-subtle"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              {/* Detail Sections */}
              <div className="flex flex-col gap-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-text-main text-[14px] font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                    <i className="fas fa-user-circle text-accent opacity-80"></i>{" "}
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-surface-alt/50 p-5 rounded-[16px] border border-border-subtle">
                    <div>
                      <span className="text-text-placeholder block text-[11px] uppercase tracking-wider mb-1">
                        Birthdate
                      </span>
                      <span className="text-text-main font-semibold text-[13px]">
                        {new Date(viewingEmployee.birthdate).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-placeholder block text-[11px] uppercase tracking-wider mb-1">
                        Age
                      </span>
                      <span className="text-text-main font-semibold text-[13px]">
                        {(() => {
                          const birth = new Date(viewingEmployee.birthdate);
                          const now = new Date();
                          let age = now.getFullYear() - birth.getFullYear();
                          const m = now.getMonth() - birth.getMonth();
                          if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
                            age--;
                          }
                          return age;
                        })()} Years Old
                      </span>
                    </div>
                    <div>
                      <span className="text-text-placeholder block text-[11px] uppercase tracking-wider mb-1">
                        Civil Status
                      </span>
                      <span className="text-text-main font-semibold text-[13px]">
                        {viewingEmployee.civilStatus}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-placeholder block text-[11px] uppercase tracking-wider mb-1">
                        Contact Number
                      </span>
                      <span className="text-text-main font-semibold text-[13px]">
                        {viewingEmployee.contactNo}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Employment Details */}
                <div>
                  <h3 className="text-text-main text-[14px] font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                    <i className="fas fa-briefcase text-icon-cyan opacity-80"></i>{" "}
                    Employment Details
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-surface-alt/50 p-5 rounded-[16px] border border-border-subtle">
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-text-placeholder block text-[11px] uppercase tracking-wider mb-1">
                        Employee ID
                      </span>
                      <span className="text-accent font-bold text-[13px]">
                        {viewingEmployee.employeeNo}
                      </span>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-text-placeholder block text-[11px] uppercase tracking-wider mb-1">
                        Category
                      </span>
                      <span className="text-text-main font-semibold text-[13px]">
                        {viewingEmployee.personnelCategory}
                      </span>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-text-placeholder block text-[11px] uppercase tracking-wider mb-1">
                        School Level
                      </span>
                      <span className="text-text-main font-semibold text-[13px]">
                        {viewingEmployee.schoolLevel}
                      </span>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-text-placeholder block text-[11px] uppercase tracking-wider mb-1">
                        Department
                      </span>
                      <span className="text-text-main font-semibold text-[13px]">
                        {viewingEmployee.department}
                      </span>
                    </div>
                    <div className="col-span-2 sm:col-span-2">
                      <span className="text-text-placeholder block text-[11px] uppercase tracking-wider mb-1">
                        Position
                      </span>
                      <span className="text-text-main font-semibold text-[13px]">
                        {viewingEmployee.position}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-placeholder block text-[11px] uppercase tracking-wider mb-1">
                        Salary Grade
                      </span>
                      <span className="text-text-main font-semibold text-[13px]">
                        {viewingEmployee.salaryGrade}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-placeholder block text-[11px] uppercase tracking-wider mb-1">
                        Step
                      </span>
                      <span className="text-text-main font-semibold text-[13px]">
                        {viewingEmployee.step}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-text-placeholder block text-[11px] uppercase tracking-wider mb-1">
                        Monthly Base Salary
                      </span>
                      <span className="text-green-500 font-bold text-[15px]">
                        {getSalary(viewingEmployee.salaryGrade, viewingEmployee.step)}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-placeholder block text-[11px] uppercase tracking-wider mb-1">
                        Appointment Date
                      </span>
                      <span className="text-text-main font-semibold text-[13px]">
                        {new Date(viewingEmployee.originalAppointmentDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-placeholder block text-[11px] uppercase tracking-wider mb-1">
                        Last Promotion
                      </span>
                      <span className="text-text-main font-semibold text-[13px]">
                        {viewingEmployee.lastPromotionDate
                          ? new Date(viewingEmployee.lastPromotionDate).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Government IDs */}
                <div>
                  <h3 className="text-text-main text-[14px] font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                    <i className="fas fa-id-card text-icon-pink opacity-80"></i>{" "}
                    Government & Bank IDs
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-surface-alt/50 p-5 rounded-[16px] border border-border-subtle">
                    <div>
                      <span className="text-text-placeholder block text-[11px] uppercase tracking-wider mb-1">
                        BP Number
                      </span>
                      <span className="text-text-main font-semibold text-[13px]">
                        {viewingEmployee.bpNo || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-placeholder block text-[11px] uppercase tracking-wider mb-1">
                        PhilHealth
                      </span>
                      <span className="text-text-main font-semibold text-[13px]">
                        {viewingEmployee.philhealthNo || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-placeholder block text-[11px] uppercase tracking-wider mb-1">
                        Pag-IBIG
                      </span>
                      <span className="text-text-main font-semibold text-[13px]">
                        {viewingEmployee.pagibigNo || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-placeholder block text-[11px] uppercase tracking-wider mb-1">
                        TIN
                      </span>
                      <span className="text-text-main font-semibold text-[13px]">
                        {viewingEmployee.tin || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-placeholder block text-[11px] uppercase tracking-wider mb-1">
                        Item No.
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-text-main font-semibold text-[13px] break-all">
                          {viewingEmployee.itemNo || "-"}
                        </span>
                        {viewingEmployee.itemNo && (
                          <button
                            onClick={() => fetchItemHistory(viewingEmployee.itemNo)}
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-accent/10 text-accent text-[9px] font-black uppercase tracking-widest hover:bg-accent hover:text-black transition-all duration-200 border border-accent/20"
                            title="View Assignment History"
                          >
                            <i className="fas fa-history"></i> History
                          </button>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-text-placeholder block text-[11px] uppercase tracking-wider mb-1">
                        Bank Account
                      </span>
                      <span className="text-text-main font-semibold text-[13px]">
                        {viewingEmployee.bankAccountNo || "-"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* System Information */}
                <div className="pt-6 border-t border-border-subtle mt-4">
                  <p className="text-[10px] text-text-placeholder font-medium flex items-center gap-2">
                    <i className="fas fa-info-circle opacity-50"></i>
                    Record created on {new Date(viewingEmployee.createdAt).toLocaleString()} • System Reference ID: {viewingEmployee.id}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Item History Modal */}
      {isLastHolderModalOpen && (
        <div className="fixed inset-0 z-[1002] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease]"
            onClick={() => setIsLastHolderModalOpen(false)}
          ></div>
          <div className="relative z-[1003] w-full max-w-[460px] max-h-[80vh] bg-surface border border-border-subtle rounded-[24px] shadow-2xl animate-[slideIn_0.2s_ease] transition-colors duration-300 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-surface sticky top-0 z-10">
              <h2 className="text-text-main text-[20px] font-extrabold tracking-tight flex items-center gap-2">
                <i className="fas fa-history text-accent"></i> Item History
              </h2>
              <button
                onClick={() => setIsLastHolderModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-text-main hover:bg-surface-alt rounded-full transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              {isLoadingLastHolder ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-text-muted text-[14px] font-medium">Fetching timeline...</p>
                </div>
              ) : itemHistory.length === 0 || itemHistory[0]?.notFound ? (
                <div className="text-center py-12 text-text-muted bg-surface-alt/50 rounded-[20px] border border-dashed border-border-subtle">
                  <i className="fas fa-ghost text-4xl mb-4 opacity-20"></i>
                  <p className="text-[15px] font-semibold">No history found</p>
                  <p className="text-[13px] opacity-70">This item hasn't been logged in the ledger yet.</p>
                </div>
              ) : (
                <div className="relative flex flex-col gap-8 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-border-subtle before:opacity-50">
                  {itemHistory.map((entry, idx) => {
                    const isCurrent = !entry.vacated_at;
                    const startDate = new Date(entry.assigned_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric', day: 'numeric' });
                    const endDate = entry.vacated_at
                      ? new Date(entry.vacated_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric', day: 'numeric' })
                      : "Present";

                    return (
                      <div key={idx} className="relative pl-12 group">
                        {/* Timeline Dot */}
                        <div className={`absolute left-0 top-1 w-10 h-10 rounded-full border-4 border-surface z-10 flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 ${isCurrent ? 'bg-accent text-white' : 'bg-surface-alt text-text-muted border-border-subtle'}`}>
                          <i className={`fas ${isCurrent ? 'fa-user-check' : 'fa-user-clock'} text-[14px]`}></i>
                        </div>

                        <div className={`p-4 rounded-[18px] border transition-all duration-300 ${isCurrent ? 'bg-accent/5 border-accent/20 shadow-sm' : 'bg-surface border-border-subtle hover:border-accent/30'}`}>
                          <div className="flex items-center gap-3 mb-3">
                            <img
                              src={entry.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(entry.lastName + " " + entry.firstName)}&background=random&color=fff&bold=true`}
                              className="w-10 h-10 rounded-full object-cover border border-surface shadow-sm"
                              alt=""
                            />
                            <div>
                              <h4 className="text-text-main font-bold text-[14px] leading-tight">
                                {entry.deleted ? "Unknown Employee" : `${entry.lastName}, ${entry.firstName}`}
                              </h4>
                              <p className="text-text-muted text-[12px] font-medium">
                                {entry.deleted ? `ID: ${entry.employee_no}` : entry.position}
                              </p>
                            </div>
                            {isCurrent && (
                              <span className="ml-auto bg-accent text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                Active
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-text-muted text-[11px] font-bold bg-surface-alt/50 px-3 py-1.5 rounded-lg w-fit">
                            <i className="far fa-calendar-alt opacity-50"></i>
                            <span>{startDate} — {endDate}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JuniorHigh;

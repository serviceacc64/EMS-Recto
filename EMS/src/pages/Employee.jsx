import React, { useState, useEffect } from "react";
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

const Employee = () => {
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
  const [positionFilter, setPositionFilter] = useState("All Positions");
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
    schoolLevel: "",
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

  const fetchEmployees = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching employees:", error);
    } else {
      setEmployees(data ? data.map(toCamelCase) : []);
    }
    setIsLoading(false);
  };

  const [searchParams] = useSearchParams();

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
    if (positionFilter !== "All Positions" && emp.position !== positionFilter) {
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

  const uniquePositions = [
    "All Positions",
    ...new Set(
      employees
        .map((emp) => emp.position)
        .filter(Boolean)
        .sort(),
    ),
  ];

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

  const handleAdd = () => {
    setFormData(initialFormState);
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
        showToast("Employee record deleted successfully", "success");
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
      "gender",
      "birthdate",
      "civilStatus",
      "contactNo",
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
      showToast("Employee updated successfully", "success");

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
      showToast("Employee added successfully", "success");

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

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex flex-col md:flex-row gap-3 justify-between items-center mb-5 shrink-0">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-1">
          <div className="w-full md:w-[360px] flex items-center gap-2.5 bg-surface border border-border-subtle rounded-[12px] px-3.5 py-2.5 shadow-sm focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/10 transition-all">
            <i className="fas fa-search text-text-placeholder text-[14px]"></i>
            <input
              type="text"
              placeholder="Search employee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-none outline-none w-full text-[15px] text-text-main bg-transparent font-medium placeholder:text-text-placeholder"
            />
          </div>

          <div className="flex bg-surface-alt border border-border-subtle p-0.5 rounded-[10px] shadow-sm self-start sm:self-center">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-[6px] flex items-center justify-center transition-all ${viewMode === "grid" ? "bg-surface shadow-sm text-accent" : "text-text-muted hover:text-text-main"}`}
              title="Grid View"
            >
              <i className="fas fa-th-large text-[14px]"></i>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-[6px] flex items-center justify-center transition-all ${viewMode === "table" ? "bg-surface shadow-sm text-accent" : "text-text-muted hover:text-text-main"}`}
              title="Table View"
            >
              <i className="fas fa-list text-[14px]"></i>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 self-start sm:self-center">
            <select
              value={positionFilter}
              onChange={(e) => {
                setPositionFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-surface border border-border-subtle text-text-main text-[13px] font-medium rounded-[10px] px-3 py-2 outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 shadow-sm cursor-pointer transition-all hover:border-accent/50 max-w-[160px] truncate"
            >
              {uniquePositions.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>

            <select
              value={`${sortConfig.key}-${sortConfig.direction}`}
              onChange={(e) => {
                const [key, direction] = e.target.value.split("-");
                setSortConfig({ key, direction });
              }}
              className="bg-surface border border-border-subtle text-text-main text-[13px] font-medium rounded-[10px] px-3 py-2 outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 shadow-sm cursor-pointer transition-all hover:border-accent/50"
            >
              <option value="created_at-desc">Sort by: Default</option>
              <option value="position-asc">
                Sort by: Position (Highest First)
              </option>
              <option value="position-desc">
                Sort by: Position (Lowest First)
              </option>
              <option value="lastName-asc">Sort by: Name (A-Z)</option>
              <option value="employeeNo-asc">Sort by: Employee ID</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button
            onClick={handleAdd}
            className="inline-flex justify-center items-center gap-2 bg-accent text-accent-text border border-accent px-4 py-2 rounded-[10px] cursor-pointer text-[13px] font-semibold transition-all duration-200 shadow-sm hover:bg-accent-hover hover:scale-105 hover:shadow-md group"
          >
            <i className="fas fa-plus"></i> Add Employee
          </button>
        </div>
      </div>

      {viewMode === "table" ? (
        <div className="flex-1 w-full min-h-0 overflow-auto border border-border-subtle rounded-[16px] bg-surface shadow-sm mb-4">
          <table className="w-full min-w-[980px] table-fixed border-collapse text-[13px]">
            <thead className="bg-surface-alt sticky top-0 z-10 border-b border-border-subtle">
              <tr>
                <th
                  className="p-3.5 w-[14%] text-center align-middle font-bold text-text-muted uppercase tracking-wider text-[11px] whitespace-nowrap cursor-pointer hover:bg-surface-hover transition-colors"
                  onClick={() => handleSort("employeeNo")}
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
                  onClick={() => handleSort("lastName")}
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
                  onClick={() => handleSort("gender")}
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
                  onClick={() => handleSort("position")}
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
                  onClick={() => handleSort("step")}
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
              {paginatedEmployees.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    className="p-[16px_18px] text-center text-text-muted"
                  >
                    No employee records found.
                  </td>
                </tr>
              ) : (
                paginatedEmployees.map((emp, i) => (
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
                          onClick={() => handleView(emp)}
                          className="inline-flex items-center justify-center w-7 h-7 bg-surface-alt text-accent rounded-lg cursor-pointer transition-all duration-200 hover:bg-accent/20 border border-border-subtle"
                          title="View Details"
                        >
                          <i className="fas fa-eye text-[12px]"></i>
                        </button>
                        <button
                          onClick={() => handleEdit(emp)}
                          className="inline-flex items-center justify-center w-7 h-7 bg-surface-alt text-icon-cyan rounded-lg cursor-pointer transition-all duration-200 hover:bg-icon-cyan/20 border border-border-subtle"
                          title="Edit"
                        >
                          <i className="fas fa-pen text-[12px]"></i>
                        </button>
                        <button
                          onClick={() => handleDeletePrompt(emp)}
                          className="inline-flex items-center justify-center w-7 h-7 bg-surface-alt text-red-500 rounded-lg cursor-pointer transition-all duration-200 hover:bg-red-500/20 hover:text-red-600 border border-border-subtle"
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
        <div className="flex-1 min-h-0 overflow-y-auto mb-4 pr-1">
          {paginatedEmployees.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 bg-surface border border-border-subtle rounded-[16px] text-text-muted">
              <i className="fas fa-folder-open text-[28px] mb-2 opacity-50"></i>
              <p className="text-sm">No employee records found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedEmployees.map((emp, i) => {
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
                              onMouseDown={() => handleEdit(emp)}
                              className="w-full text-left px-4 py-2.5 text-[13px] font-semibold text-text-main hover:bg-surface-alt flex items-center gap-2"
                            >
                              <i className="fas fa-pen text-icon-cyan w-4"></i>{" "}
                              Edit
                            </button>
                            <button
                              onMouseDown={() => handleDeletePrompt(emp)}
                              className="w-full text-left px-4 py-2.5 text-[13px] font-semibold text-red-500 hover:bg-red-500/10 flex items-center gap-2 border-t border-border-subtle"
                            >
                              <i className="fas fa-trash w-4"></i> Delete
                            </button>
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
                        onClick={() => handleView(emp)}
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
      )}

      {/* Pagination Controls */}
      {filteredEmployees.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between py-3 px-5 bg-surface border border-border-subtle rounded-[16px] shadow-sm shrink-0 gap-4">
          <span className="text-text-muted text-[13px] font-medium text-center sm:text-left">
            Showing {startIndex + 1} to{" "}
            {Math.min(startIndex + itemsPerPage, filteredEmployees.length)} of{" "}
            {filteredEmployees.length} employees
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-border-subtle bg-surface-alt text-text-main text-[13px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-hover transition-colors shrink-0"
            >
              Previous
            </button>

            <div className="flex gap-1.5 shrink-0">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-[13px] font-bold transition-colors ${currentPage === page ? "bg-accent text-accent-text border border-accent shadow-sm" : "border border-border-subtle bg-surface-alt text-text-main hover:bg-surface-hover"}`}
                  >
                    {page}
                  </button>
                ),
              )}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-border-subtle bg-surface-alt text-text-main text-[13px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-hover transition-colors shrink-0"
            >
              Next
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
                  {editingIndex !== null ? "Edit Employee" : "Add Employee"}
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
                          Gender <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleInputChange}
                          required
                          className="px-4 py-2.5 border border-border-subtle rounded-[10px] text-[14px] text-text-main bg-surface shadow-sm focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all cursor-pointer"
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[13px] font-semibold text-text-muted mb-2">
                          Birthdate <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          name="birthdate"
                          value={formData.birthdate}
                          onChange={handleInputChange}
                          required
                          className="px-4 py-2.5 border border-border-subtle rounded-[10px] text-[14px] text-text-main bg-surface shadow-sm focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[13px] font-semibold text-text-muted mb-2">
                          Civil Status <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="civilStatus"
                          value={formData.civilStatus}
                          onChange={handleInputChange}
                          required
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
                          Contact No. <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          name="contactNo"
                          value={formData.contactNo}
                          onChange={handleInputChange}
                          required
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
                      ? "Update Employee"
                      : "Save Employee"}
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
          <div className="relative z-[1000] w-full max-w-[460px] bg-surface border border-border-subtle rounded-[24px] shadow-2xl animate-[slideIn_0.2s_ease] transition-colors duration-300">
            <div className="p-8">
              <h2 className="text-text-main text-[24px] mb-3 font-extrabold tracking-tight">
                Confirm Delete
              </h2>
              <p className="text-text-muted text-[15px] leading-relaxed m-0">
                Are you sure you want to delete this employee? This action
                cannot be undone.
              </p>
              <div className="flex justify-end gap-3 mt-8">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface-alt text-text-muted border border-border-subtle rounded-[12px] cursor-pointer text-[14px] font-semibold transition-all duration-200 shadow-sm hover:bg-surface-hover hover:text-text-main group"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white border border-red-700 rounded-[12px] cursor-pointer text-[14px] font-semibold transition-all duration-200 shadow-sm hover:bg-red-500 hover:-translate-y-0.5 group"
                >
                  Delete
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
            onClick={() => setIsViewModalOpen(false)}
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
                  onClick={() => setIsViewModalOpen(false)}
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

                {/* Leave Balances */}
                <div>
                  <h3 className="text-text-main text-[14px] font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                    <i className="fas fa-calendar-check text-emerald-500 opacity-80"></i>{" "}
                    Leave Balances
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-[16px] flex flex-col items-center text-center">
                      <span className="text-text-placeholder block text-[10px] uppercase tracking-widest font-black mb-1">
                        Local Leave
                      </span>
                      <span className="text-emerald-500 font-black text-[24px] leading-none">
                        {Number(viewingEmployee.localLeaveBalance || 0)}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-500/60 mt-1 uppercase tracking-tighter">Days Available</span>
                    </div>
                    <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-[16px] flex flex-col items-center text-center">
                      <span className="text-text-placeholder block text-[10px] uppercase tracking-widest font-black mb-1">
                        D.O. Leave
                      </span>
                      <span className="text-blue-500 font-black text-[24px] leading-none">
                        {Number(viewingEmployee.doLeaveBalance || 0)}
                      </span>
                      <span className="text-[10px] font-bold text-blue-500/60 mt-1 uppercase tracking-tighter">Days Available</span>
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

export default Employee;

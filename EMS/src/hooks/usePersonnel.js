import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { toCamelCase, toSnakeCase } from "../utils/personnelUtils";
import { useNotifications } from "../context/NotificationContext";

export const usePersonnel = () => {
  const { showToast } = useNotifications();
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [itemHistory, setItemHistory] = useState([]);
  const [isLoadingLastHolder, setIsLoadingLastHolder] = useState(false);

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching employees:", error);
      showToast("Error fetching employees", "error");
    } else {
      setEmployees(data ? data.map(toCamelCase) : []);
    }
    setIsLoading(false);
  }, [showToast]);

  const fetchItemHistory = useCallback(async (itemNo) => {
    setIsLoadingLastHolder(true);
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
  }, []);

  const deleteEmployee = async (id) => {
    const { error } = await supabase
      .from("employees")
      .delete()
      .eq("id", id);
    
    if (error) {
      if (error.code === '42501' || error.message.includes('permission denied')) {
        showToast("Access Denied: You do not have permission to delete records.", "error");
      } else {
        showToast("Failed to delete: " + error.message, "error");
      }
      return false;
    }
    
    showToast("Employee record deleted successfully", "success");
    setEmployees(prev => prev.filter(emp => emp.id !== id));
    return true;
  };

  const saveEmployee = async (formData, editingId) => {
    const dbData = toSnakeCase(formData);
    
    if (editingId) {
      // Find old employee for item history check
      const oldEmp = employees.find(e => e.id === editingId);
      const oldItemNo = oldEmp?.itemNo;

      const { error } = await supabase
        .from("employees")
        .update(dbData)
        .eq("id", editingId);

      if (error) {
        showToast("Update failed: " + error.message, "error");
        return null;
      }

      // Track item history if changed
      if (oldItemNo !== formData.itemNo) {
        if (oldItemNo) {
          await supabase
            .from("item_history")
            .update({ vacated_at: new Date().toISOString() })
            .eq("item_no", oldItemNo)
            .eq("employee_no", formData.employeeNo)
            .is("vacated_at", null);
        }
        if (formData.itemNo) {
          await supabase.from("item_history").insert([
            {
              item_no: formData.itemNo,
              employee_no: formData.employeeNo,
              assigned_at: new Date().toISOString(),
            },
          ]);
        }
      }

      showToast("Employee updated successfully", "success");
      const updated = { ...formData, id: editingId };
      setEmployees(prev => prev.map(e => e.id === editingId ? updated : e));
      return updated;
    } else {
      if (!dbData.id) delete dbData.id;
      const { data, error } = await supabase
        .from("employees")
        .insert([dbData])
        .select();

      if (error) {
        showToast("Insert failed: " + error.message, "error");
        return null;
      }

      if (formData.itemNo) {
        await supabase.from("item_history").insert([
          {
            item_no: formData.itemNo,
            employee_no: formData.employeeNo,
            assigned_at: new Date().toISOString(),
          },
        ]);
      }

      showToast("Employee added successfully", "success");
      const newEmp = toCamelCase(data[0]);
      setEmployees(prev => [newEmp, ...prev]);
      return newEmp;
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return {
    employees,
    setEmployees,
    isLoading,
    fetchEmployees,
    itemHistory,
    isLoadingLastHolder,
    fetchItemHistory,
    deleteEmployee,
    saveEmployee,
  };
};

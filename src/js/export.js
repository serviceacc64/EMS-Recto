const EMPLOYEE_STORAGE_KEY = 'emsEmployees';

// Export page functionality
document.addEventListener('DOMContentLoaded', function () {
    loadEmployeeDataForExport();
    setupExportButtons();
});

function getStoredEmployees() {
    try {
        const storedEmployees = localStorage.getItem(EMPLOYEE_STORAGE_KEY);
        if (!storedEmployees) {
            return [];
        }

        const parsedEmployees = JSON.parse(storedEmployees);
        return Array.isArray(parsedEmployees) ? parsedEmployees : [];
    } catch (error) {
        console.error('Unable to load employee records for export.', error);
        return [];
    }
}

// Load employee data and populate the export table
function loadEmployeeDataForExport() {
    const tableBody = document.getElementById('exportEmployeeTableBody');
    const employees = getStoredEmployees();

    if (employees.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="19" style="text-align: center; padding: 20px;">No employee data available</td></tr>';
        return;
    }

    tableBody.innerHTML = employees.map(emp => `
        <tr>
            <td>${emp.employeeNo || '-'}</td>
            <td>${emp.lastName || '-'}</td>
            <td>${emp.firstName || '-'}</td>
            <td>${emp.middleName || '-'}</td>
            <td>${emp.gender || '-'}</td>
            <td>${emp.birthdate || '-'}</td>
            <td>${emp.civilStatus || '-'}</td>
            <td>${emp.contactNo || '-'}</td>
            <td>${emp.bpNo || '-'}</td>
            <td>${emp.philhealthNo || '-'}</td>
            <td>${emp.pagibigNo || '-'}</td>
            <td>${emp.bankAccountNo || '-'}</td>
            <td>${emp.itemNo || '-'}</td>
            <td>${emp.tin || '-'}</td>
            <td>${emp.position || '-'}</td>
            <td>${emp.salaryGrade || '-'}</td>
            <td>${emp.step || '-'}</td>
            <td>${emp.originalAppointmentDate || '-'}</td>
            <td>${emp.lastPromotionDate || '-'}</td>
        </tr>
    `).join('');
}

// Setup export button functionality
function setupExportButtons() {
    const exportPdfBtn = document.querySelector('.export-pdf-btn');
    const exportExcelBtn = document.querySelector('.export-excel-btn');
    
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', exportToPDF);
    }
    
    if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', exportToExcel);
    }
}

// Export table to PDF
function exportToPDF() {
    const table = document.querySelector('.employee-table');
    const rows = table.querySelectorAll('tr');
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('th, td');
        const rowContent = Array.from(cells)
            .map(cell => `"${cell.textContent.trim()}"`)
            .join(',');
        csvContent += rowContent + '\n';
    });
    
    // For PDF export, we'll save as CSV for now (full PDF library would be needed)
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `employees_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
}

// Export table to Excel (CSV format)
function exportToExcel() {
    const table = document.querySelector('.employee-table');
    const rows = table.querySelectorAll('tr');
    let csvContent = '';
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('th, td');
        const rowContent = Array.from(cells)
            .map(cell => `"${cell.textContent.trim()}"`)
            .join(',');
        csvContent += rowContent + '\n';
    });
    
    const link = document.createElement('a');
    link.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
    link.setAttribute('download', `employees_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
}

// Logout functionality
document.addEventListener('DOMContentLoaded', function () {
    const logoutBtn = document.querySelector('.sidebar-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            localStorage.removeItem('userToken');
            window.location.href = '../../index.html';
        });
    }
});

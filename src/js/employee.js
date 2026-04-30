// Get modal elements
const addEmployeeBtn = document.querySelector('.add-btn');
const addEmployeeModal = document.getElementById('addEmployeeModal');
const modalOverlay = document.getElementById('addEmployeeOverlay');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const employeeForm = document.getElementById('employeeForm');
const employeeTableBody = document.getElementById('employeeTableBody');
const employeeModalTitle = document.getElementById('employeeModalTitle');
const submitEmployeeBtn = document.getElementById('submitEmployeeBtn');
const employeeSearch = document.getElementById('employeeSearch');
const feedbackOverlay = document.getElementById('feedbackOverlay');
const feedbackModal = document.getElementById('feedbackModal');
const feedbackTitle = document.getElementById('feedbackTitle');
const feedbackMessage = document.getElementById('feedbackMessage');
const feedbackCancelBtn = document.getElementById('feedbackCancelBtn');
const feedbackConfirmBtn = document.getElementById('feedbackConfirmBtn');
const EMPLOYEE_STORAGE_KEY = 'emsEmployees';

const employees = loadEmployees();
let editingEmployeeIndex = null;
let feedbackResolver = null;
let searchTerm = '';

function loadEmployees() {
    try {
        const storedEmployees = localStorage.getItem(EMPLOYEE_STORAGE_KEY);
        if (!storedEmployees) {
            return [];
        }

        const parsedEmployees = JSON.parse(storedEmployees);
        return Array.isArray(parsedEmployees) ? parsedEmployees : [];
    } catch (error) {
        console.error('Unable to load employee records from local storage.', error);
        return [];
    }
}

function saveEmployees() {
    localStorage.setItem(EMPLOYEE_STORAGE_KEY, JSON.stringify(employees));
}

function openFeedbackModal({ title, message, type = 'success', confirmText = 'OK', cancelText = 'Cancel', showCancel = false }) {
    feedbackTitle.textContent = title;
    feedbackMessage.textContent = message;
    feedbackConfirmBtn.textContent = confirmText;
    feedbackCancelBtn.textContent = cancelText;
    feedbackCancelBtn.hidden = !showCancel;
    feedbackModal.className = `modal feedback-modal active ${type}`;
    feedbackModal.setAttribute('aria-hidden', 'false');
    feedbackOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeFeedbackModal() {
    feedbackModal.className = 'modal feedback-modal';
    feedbackModal.setAttribute('aria-hidden', 'true');
    feedbackOverlay.classList.remove('active');

    if (!addEmployeeModal.classList.contains('active')) {
        document.body.style.overflow = '';
    }
}

function resolveFeedback(result) {
    if (feedbackResolver) {
        const resolver = feedbackResolver;
        feedbackResolver = null;
        closeFeedbackModal();
        resolver(result);
    }
}

function showFeedback(options) {
    openFeedbackModal(options);
    return new Promise((resolve) => {
        feedbackResolver = resolve;
    });
}

async function showAlertModal(title, message, type = 'success') {
    await showFeedback({
        title,
        message,
        type,
        confirmText: 'OK',
        showCancel: false
    });
}

async function showConfirmModal(title, message, confirmText = 'Confirm') {
    return showFeedback({
        title,
        message,
        type: 'confirm',
        confirmText,
        cancelText: 'Cancel',
        showCancel: true
    });
}

function getEmployeeName(employee) {
    return [employee.lastName, employee.firstName, employee.middleName]
        .filter(Boolean)
        .join(', ')
        .replace(', ,', ',');
}

function getFilteredEmployees() {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
        return employees.map((employee, index) => ({ employee, index }));
    }

    return employees
        .map((employee, index) => ({ employee, index }))
        .filter(({ employee }) => {
            const searchableText = [
                employee.employeeNo,
                getEmployeeName(employee),
                employee.gender,
                employee.position,
                employee.step,
                employee.salaryGrade,
                employee.contactNo
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return searchableText.includes(normalizedSearch);
        });
}

function renderEmployees() {
    employeeTableBody.innerHTML = '';
    const filteredEmployees = getFilteredEmployees();

    if (employees.length === 0) {
        employeeTableBody.innerHTML = `
            <tr>
                <td colspan="8">No employee records found.</td>
            </tr>
        `;
        return;
    }

    if (filteredEmployees.length === 0) {
        employeeTableBody.innerHTML = `
            <tr>
                <td colspan="8">No employees match your search.</td>
            </tr>
        `;
        return;
    }

    filteredEmployees.forEach(({ employee, index }) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${employee.employeeNo || '-'}</td>
            <td>${getEmployeeName(employee) || '-'}</td>
            <td>${employee.gender || '-'}</td>
            <td>${employee.position || '-'}</td>
            <td>${employee.step || '-'}</td>
            <td>${employee.salaryGrade || '-'}</td>
            <td>${employee.contactNo || '-'}</td>
            <td class="actions-cell">
                <div class="table-actions">
                    <button type="button" class="table-action-btn edit-btn" data-index="${index}">
                        <i class="fas fa-pen"></i> Edit
                    </button>
                    <button type="button" class="table-action-btn delete-btn" data-index="${index}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </td>
        `;
        employeeTableBody.appendChild(row);
    });
}

function setFormMode() {
    const isEditing = editingEmployeeIndex !== null;
    employeeModalTitle.textContent = isEditing ? 'Edit Employee' : 'Add Employee';
    submitEmployeeBtn.innerHTML = isEditing
        ? '<i class="fas fa-save"></i> Update Employee'
        : '<i class="fas fa-save"></i> Save Employee';
}

function fillForm(employee) {
    Object.keys(employee).forEach((key) => {
        if (employeeForm.elements[key]) {
            employeeForm.elements[key].value = employee[key];
        }
    });
}

// Open modal
function openModal() {
    setFormMode();
    addEmployeeModal.classList.add('active');
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close modal
function closeModal() {
    addEmployeeModal.classList.remove('active');
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
    employeeForm.reset();
    editingEmployeeIndex = null;
    setFormMode();
}

// Add event listeners
addEmployeeBtn.addEventListener('click', openModal);
cancelModalBtn.addEventListener('click', closeModal);

// Close modal when clicking on overlay
modalOverlay.addEventListener('click', function(e) {
    if (e.target === modalOverlay) {
        closeModal();
    }
});

// Close modal on ESC key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && feedbackModal.classList.contains('active')) {
        resolveFeedback(false);
        return;
    }

    if (e.key === 'Escape' && addEmployeeModal.classList.contains('active')) {
        closeModal();
    }
});

feedbackOverlay.addEventListener('click', function(e) {
    if (e.target === feedbackOverlay) {
        resolveFeedback(false);
    }
});

feedbackConfirmBtn.addEventListener('click', function() {
    resolveFeedback(true);
});

feedbackCancelBtn.addEventListener('click', function() {
    resolveFeedback(false);
});

employeeSearch.addEventListener('input', function(e) {
    searchTerm = e.target.value;
    renderEmployees();
});

// Handle form submission
employeeForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    try {
        const formData = new FormData(employeeForm);
        const employeeData = Object.fromEntries(formData);
        const requiredFields = [
            'lastName',
            'firstName',
            'gender',
            'birthdate',
            'civilStatus',
            'contactNo',
            'employeeNo',
            'position',
            'salaryGrade',
            'step',
            'originalAppointmentDate'
        ];

        const missingField = requiredFields.find((field) => {
            return !employeeData[field] || employeeData[field].trim() === '';
        });

        if (missingField) {
            throw new Error('Please fill in all required fields before saving.');
        }

        const duplicateEmployee = employees.find((employee, index) => {
            return employee.employeeNo === employeeData.employeeNo && index !== editingEmployeeIndex;
        });

        if (duplicateEmployee) {
            throw new Error('Employee number already exists. Please use a unique employee number.');
        }

        const confirmMessage = editingEmployeeIndex !== null
            ? 'Are you sure you want to update this employee record?'
            : 'Are you sure you want to save this new employee record?';

        const confirmed = await showConfirmModal('Confirm Save', confirmMessage, editingEmployeeIndex !== null ? 'Update' : 'Save');
        if (!confirmed) {
            return;
        }

        if (editingEmployeeIndex !== null) {
            employees[editingEmployeeIndex] = employeeData;
            saveEmployees();
            renderEmployees();
            closeModal();
            await showAlertModal('Success', 'Employee record updated successfully.', 'success');
        } else {
            employees.push(employeeData);
            saveEmployees();
            renderEmployees();
            closeModal();
            await showAlertModal('Success', 'Employee added successfully.', 'success');
        }
    } catch (error) {
        await showAlertModal('Error', error.message || 'Unable to save the employee record.', 'error');
    }
});

employeeTableBody.addEventListener('click', async function(e) {
    const editButton = e.target.closest('.edit-btn');
    const deleteButton = e.target.closest('.delete-btn');

    if (editButton) {
        try {
            const index = Number(editButton.dataset.index);
            const employee = employees[index];

            if (!employee) {
                throw new Error('Employee record not found.');
            }

            editingEmployeeIndex = index;
            employeeForm.reset();
            fillForm(employee);
            openModal();
        } catch (error) {
            await showAlertModal('Error', error.message || 'Unable to open the employee record.', 'error');
        }
    }

    if (deleteButton) {
        try {
            const index = Number(deleteButton.dataset.index);
            const employee = employees[index];

            if (!employee) {
                throw new Error('Employee record not found.');
            }

            const confirmed = await showConfirmModal(
                'Confirm Delete',
                `Are you sure you want to delete ${getEmployeeName(employee)}?`,
                'Delete'
            );
            if (!confirmed) {
                return;
            }

            employees.splice(index, 1);
            saveEmployees();
            renderEmployees();
            await showAlertModal('Success', 'Employee record deleted successfully.', 'success');
        } catch (error) {
            await showAlertModal('Error', error.message || 'Unable to delete the employee record.', 'error');
        }
    }
});

renderEmployees();

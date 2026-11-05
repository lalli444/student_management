// Student Management System - Frontend Application Logic

// State Management
const state = {
    students: [],
    filteredStudents: [],
    currentPage: 1,
    pageSize: 10,
    searchQuery: "",
    selectedCourse: "",
    sortBy: "marks",
    sortOrder: "desc",
    editingStudentId: null, // null when creating, string id when editing
    isLoading: false
};

// DOM Elements
const dom = {
    tableBody: document.getElementById("studentsTableBody"),
    loadingState: document.getElementById("loadingState"),
    emptyState: document.getElementById("emptyState"),
    apiStatus: document.getElementById("apiStatus"),
    apiStatusText: document.getElementById("apiStatusText"),
    
    // Stats
    statTotalStudents: document.getElementById("statTotalStudents"),
    statAvgMarks: document.getElementById("statAvgMarks"),
    statCoursesCount: document.getElementById("statCoursesCount"),
    statTopGradeCount: document.getElementById("statTopGradeCount"),

    // Controls
    searchInput: document.getElementById("searchInput"),
    courseFilter: document.getElementById("courseFilter"),
    sortBy: document.getElementById("sortBy"),
    btnOrderToggle: document.getElementById("btnOrderToggle"),
    orderIcon: document.getElementById("orderIcon"),
    orderText: document.getElementById("orderText"),
    btnRefresh: document.getElementById("btnRefresh"),

    // Pagination
    paginationInfo: document.getElementById("paginationInfo"),
    pageSizeSelect: document.getElementById("pageSizeSelect"),
    btnPrevPage: document.getElementById("btnPrevPage"),
    btnNextPage: document.getElementById("btnNextPage"),
    currentPageLabel: document.getElementById("currentPageLabel"),

    // Student Modal
    studentModal: document.getElementById("studentModal"),
    modalTitle: document.getElementById("modalTitle"),
    studentForm: document.getElementById("studentForm"),
    studentIdInput: document.getElementById("studentId"),
    studentNameInput: document.getElementById("studentName"),
    studentEmailInput: document.getElementById("studentEmail"),
    studentAgeInput: document.getElementById("studentAge"),
    studentMarksInput: document.getElementById("studentMarks"),
    studentCourseInput: document.getElementById("studentCourse"),
    btnOpenAddModal: document.getElementById("btnOpenAddModal"),
    btnCloseModal: document.getElementById("btnCloseModal"),
    btnCancelModal: document.getElementById("btnCancelModal"),
    btnSaveStudent: document.getElementById("btnSaveStudent"),

    // Settings Modal
    settingsModal: document.getElementById("settingsModal"),
    btnSettings: document.getElementById("btnSettings"),
    btnCloseSettingsModal: document.getElementById("btnCloseSettingsModal"),
    apiUrlInput: document.getElementById("apiUrlInput"),
    btnSetLocalhost: document.getElementById("btnSetLocalhost"),
    btnResetDefault: document.getElementById("btnResetDefault"),
    btnSaveSettings: document.getElementById("btnSaveSettings"),

    // Toast
    toastContainer: document.getElementById("toastContainer")
};

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
    initEventListeners();
    checkApiHealth();
    loadStudents();
});

// Event Listeners Setup
function initEventListeners() {
    // Search & Filter
    dom.searchInput.addEventListener("input", (e) => {
        state.searchQuery = e.target.value.toLowerCase().trim();
        state.currentPage = 1;
        applyFiltersAndRender();
    });

    dom.courseFilter.addEventListener("change", (e) => {
        state.selectedCourse = e.target.value;
        state.currentPage = 1;
        applyFiltersAndRender();
    });

    dom.sortBy.addEventListener("change", (e) => {
        state.sortBy = e.target.value;
        applyFiltersAndRender();
    });

    dom.btnOrderToggle.addEventListener("click", () => {
        state.sortOrder = state.sortOrder === "asc" ? "desc" : "asc";
        dom.orderText.textContent = state.sortOrder === "asc" ? "Asc" : "Desc";
        dom.orderIcon.className = state.sortOrder === "asc" 
            ? "fa-solid fa-arrow-up-wide-short" 
            : "fa-solid fa-arrow-down-wide-short";
        applyFiltersAndRender();
    });

    dom.btnRefresh.addEventListener("click", () => {
        loadStudents();
    });

    // Pagination
    dom.pageSizeSelect.addEventListener("change", (e) => {
        state.pageSize = parseInt(e.target.value, 10);
        state.currentPage = 1;
        applyFiltersAndRender();
    });

    dom.btnPrevPage.addEventListener("click", () => {
        if (state.currentPage > 1) {
            state.currentPage--;
            applyFiltersAndRender();
        }
    });

    dom.btnNextPage.addEventListener("click", () => {
        const totalPages = Math.ceil(state.filteredStudents.length / state.pageSize) || 1;
        if (state.currentPage < totalPages) {
            state.currentPage++;
            applyFiltersAndRender();
        }
    });

    // Student Modal Events
    dom.btnOpenAddModal.addEventListener("click", () => openAddStudentModal());
    dom.btnCloseModal.addEventListener("click", () => closeModal());
    dom.btnCancelModal.addEventListener("click", () => closeModal());
    dom.studentForm.addEventListener("submit", handleStudentFormSubmit);

    // Settings Modal Events
    dom.btnSettings.addEventListener("click", () => {
        dom.apiUrlInput.value = CONFIG.getApiUrl();
        dom.settingsModal.classList.add("active");
    });
    dom.btnCloseSettingsModal.addEventListener("click", () => dom.settingsModal.classList.remove("active"));
    dom.btnSetLocalhost.addEventListener("click", () => {
        dom.apiUrlInput.value = "http://127.0.0.1:8000";
    });
    dom.btnResetDefault.addEventListener("click", () => {
        CONFIG.setApiUrl("");
        dom.apiUrlInput.value = CONFIG.getApiUrl();
    });
    dom.btnSaveSettings.addEventListener("click", () => {
        const url = dom.apiUrlInput.value.trim();
        CONFIG.setApiUrl(url);
        dom.settingsModal.classList.remove("active");
        showToast("API URL updated successfully!", "info");
        checkApiHealth();
        loadStudents();
    });

    // Close modals on clicking backdrop
    window.addEventListener("click", (e) => {
        if (e.target === dom.studentModal) closeModal();
        if (e.target === dom.settingsModal) dom.settingsModal.classList.remove("active");
    });
}

// Check Backend API Connectivity
async function checkApiHealth() {
    const baseUrl = CONFIG.getApiUrl();
    try {
        const res = await fetch(`${baseUrl}/`, { method: "GET" });
        if (res.ok) {
            dom.apiStatus.className = "status-badge online";
            dom.apiStatusText.textContent = "API Online";
            dom.apiStatus.title = `Connected to ${baseUrl}`;
        } else {
            throw new Error(`HTTP status: ${res.status}`);
        }
    } catch (err) {
        dom.apiStatus.className = "status-badge offline";
        dom.apiStatusText.textContent = "API Offline";
        dom.apiStatus.title = `Could not reach ${baseUrl}`;
    }
}

// Fetch all students from the API
async function loadStudents() {
    state.isLoading = true;
    updateLoadingUi();
    const baseUrl = CONFIG.getApiUrl();

    try {
        const res = await fetch(`${baseUrl}/student`);
        if (!res.ok) {
            throw new Error(`Failed to load student data (${res.status})`);
        }

        const data = await res.json();
        
        // Convert object dictionary to array if returned as { "S001": {...} }
        if (Array.isArray(data)) {
            state.students = data;
        } else {
            state.students = Object.entries(data).map(([id, info]) => ({
                id,
                ...info
            }));
        }

        updateStats(state.students);
        populateCourseFilter(state.students);
        applyFiltersAndRender();
        dom.apiStatus.className = "status-badge online";
        dom.apiStatusText.textContent = "API Online";
    } catch (err) {
        console.error("Error loading students:", err);
        showToast(`API Connection error: ${err.message}`, "error");
        dom.apiStatus.className = "status-badge offline";
        dom.apiStatusText.textContent = "API Offline";
        state.students = [];
        applyFiltersAndRender();
    } finally {
        state.isLoading = false;
        updateLoadingUi();
    }
}

// Apply Filters, Sorting, and Pagination
function applyFiltersAndRender() {
    let result = [...state.students];

    // 1. Text Search Filter (ID, Name, or Email)
    if (state.searchQuery) {
        result = result.filter(student => 
            (student.name && student.name.toLowerCase().includes(state.searchQuery)) ||
            (student.id && student.id.toLowerCase().includes(state.searchQuery)) ||
            (student.email && student.email.toLowerCase().includes(state.searchQuery)) ||
            (student.course && student.course.toLowerCase().includes(state.searchQuery))
        );
    }

    // 2. Course Filter
    if (state.selectedCourse) {
        result = result.filter(student => 
            student.course && student.course.toLowerCase() === state.selectedCourse.toLowerCase()
        );
    }

    // 3. Sorting
    result.sort((a, b) => {
        let valA = a[state.sortBy];
        let valB = b[state.sortBy];

        if (typeof valA === "string") valA = valA.toLowerCase();
        if (typeof valB === "string") valB = valB.toLowerCase();

        if (valA < valB) return state.sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return state.sortOrder === "asc" ? 1 : -1;
        return 0;
    });

    state.filteredStudents = result;

    // 4. Pagination
    const totalRecords = result.length;
    const totalPages = Math.ceil(totalRecords / state.pageSize) || 1;
    
    if (state.currentPage > totalPages) {
        state.currentPage = totalPages;
    }

    const startIndex = (state.currentPage - 1) * state.pageSize;
    const endIndex = Math.min(startIndex + state.pageSize, totalRecords);
    const paginatedItems = result.slice(startIndex, endIndex);

    // Update Pagination UI
    dom.paginationInfo.textContent = totalRecords === 0 
        ? "No records found" 
        : `Showing records ${startIndex + 1} - ${endIndex} of ${totalRecords}`;
    dom.currentPageLabel.textContent = `Page ${state.currentPage} of ${totalPages}`;
    dom.btnPrevPage.disabled = state.currentPage <= 1;
    dom.btnNextPage.disabled = state.currentPage >= totalPages;

    renderTable(paginatedItems);
}

// Render Table Rows
function renderTable(students) {
    dom.tableBody.innerHTML = "";

    if (students.length === 0) {
        dom.emptyState.style.display = "block";
        return;
    }

    dom.emptyState.style.display = "none";

    students.forEach(student => {
        const tr = document.createElement("tr");

        // Grade badge style
        const gradeClass = getGradeBadgeClass(student.grade);

        tr.innerHTML = `
            <td><span class="badge badge-id">${escapeHtml(student.id)}</span></td>
            <td><strong>${escapeHtml(student.name)}</strong></td>
            <td>${student.age}</td>
            <td><a href="mailto:${escapeHtml(student.email)}" style="color: var(--primary); text-decoration: none;">${escapeHtml(student.email)}</a></td>
            <td><span class="badge badge-course">${escapeHtml(student.course)}</span></td>
            <td>
                <div class="marks-container">
                    <span style="font-weight: 600; min-width: 28px;">${student.marks}</span>
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill" style="width: ${student.marks}%;"></div>
                    </div>
                </div>
            </td>
            <td><span class="badge ${gradeClass}">${escapeHtml(student.grade || "-")}</span></td>
            <td style="text-align: right;">
                <div class="action-buttons" style="justify-content: flex-end;">
                    <button class="btn btn-outline btn-sm" onclick="openEditStudentModal('${student.id}')" title="Edit Student">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="confirmDeleteStudent('${student.id}', '${escapeHtml(student.name)}')" title="Delete Student" style="color: var(--danger); border-color: #fecaca;">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </td>
        `;

        dom.tableBody.appendChild(tr);
    });
}

// Grade Badge Helper
function getGradeBadgeClass(grade) {
    switch (grade) {
        case "A+": return "badge-grade-aplus";
        case "A":  return "badge-grade-a";
        case "B":  return "badge-grade-b";
        case "C":  return "badge-grade-c";
        default:   return "badge-grade-f";
    }
}

// Update Top Statistics
function updateStats(students) {
    if (!students || students.length === 0) {
        dom.statTotalStudents.textContent = "0";
        dom.statAvgMarks.textContent = "0%";
        dom.statCoursesCount.textContent = "0";
        dom.statTopGradeCount.textContent = "0";
        return;
    }

    const total = students.length;
    const totalMarks = students.reduce((sum, s) => sum + (Number(s.marks) || 0), 0);
    const avgMarks = Math.round(totalMarks / total);

    const uniqueCourses = new Set(students.map(s => s.course?.trim()).filter(Boolean));
    const topGradeCount = students.filter(s => s.grade === "A+" || s.grade === "A").length;

    dom.statTotalStudents.textContent = total;
    dom.statAvgMarks.textContent = `${avgMarks}%`;
    dom.statCoursesCount.textContent = uniqueCourses.size;
    dom.statTopGradeCount.textContent = topGradeCount;
}

// Populate Course Filter Dropdown dynamically with all existing courses
function populateCourseFilter(students) {
    const existingSelected = dom.courseFilter.value;
    const courses = [...new Set(students.map(s => s.course?.trim()).filter(Boolean))].sort();

    dom.courseFilter.innerHTML = '<option value="">All Courses</option>';
    courses.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c;
        opt.textContent = c;
        if (c === existingSelected) opt.selected = true;
        dom.courseFilter.appendChild(opt);
    });
}

// Modal Management
function openAddStudentModal() {
    state.editingStudentId = null;
    dom.modalTitle.textContent = "Add New Student";
    dom.studentIdInput.disabled = false;
    dom.studentForm.reset();
    
    // Auto-suggest next ID based on existing max S###
    dom.studentIdInput.value = generateNextStudentId();
    dom.studentModal.classList.add("active");
}

function openEditStudentModal(id) {
    const student = state.students.find(s => s.id === id);
    if (!student) return;

    state.editingStudentId = id;
    dom.modalTitle.textContent = `Edit Student: ${id}`;
    dom.studentIdInput.value = student.id;
    dom.studentIdInput.disabled = true; // ID cannot be edited

    dom.studentNameInput.value = student.name || "";
    dom.studentEmailInput.value = student.email || "";
    dom.studentAgeInput.value = student.age || "";
    dom.studentMarksInput.value = student.marks !== undefined ? student.marks : "";
    dom.studentCourseInput.value = student.course || "";

    dom.studentModal.classList.add("active");
}

function closeModal() {
    dom.studentModal.classList.remove("active");
    dom.studentForm.reset();
    state.editingStudentId = null;
}

// Handle Add / Edit Submission
async function handleStudentFormSubmit(e) {
    e.preventDefault();

    const name = dom.studentNameInput.value.trim();
    // Validate name (letters and spaces only)
    if (!/^[a-zA-Z\s]+$/.test(name)) {
        showToast("Student name must contain only letters and spaces", "error");
        return;
    }

    const payload = {
        name: name,
        age: parseInt(dom.studentAgeInput.value, 10),
        course: dom.studentCourseInput.value.trim(),
        marks: parseInt(dom.studentMarksInput.value, 10),
        email: dom.studentEmailInput.value.trim()
    };

    const baseUrl = CONFIG.getApiUrl();
    const isEdit = state.editingStudentId !== null;

    dom.btnSaveStudent.disabled = true;
    dom.btnSaveStudent.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

    try {
        let res;
        if (isEdit) {
            // PUT /update/{student_id}
            res = await fetch(`${baseUrl}/update/${encodeURIComponent(state.editingStudentId)}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        } else {
            // POST /create
            payload.id = dom.studentIdInput.value.trim();
            res = await fetch(`${baseUrl}/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        }

        const data = await res.json();

        if (!res.ok) {
            // Handle FastAPI validation error detail
            let errorMsg = "Operation failed";
            if (typeof data.detail === "string") {
                errorMsg = data.detail;
            } else if (Array.isArray(data.detail)) {
                errorMsg = data.detail.map(d => `${d.loc?.slice(-1)[0]}: ${d.msg}`).join("; ");
            }
            throw new Error(errorMsg);
        }

        showToast(isEdit ? "Student updated successfully!" : "Student created successfully!", "success");
        closeModal();
        await loadStudents();
    } catch (err) {
        showToast(`Error: ${err.message}`, "error");
    } finally {
        dom.btnSaveStudent.disabled = false;
        dom.btnSaveStudent.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Student';
    }
}

// Confirm and Delete Student
async function confirmDeleteStudent(id, name) {
    const confirmed = window.confirm(`Are you sure you want to delete student ${name} (${id})? This action cannot be undone.`);
    if (!confirmed) return;

    const baseUrl = CONFIG.getApiUrl();
    try {
        const res = await fetch(`${baseUrl}/delete/${encodeURIComponent(id)}`, {
            method: "DELETE"
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.detail || "Failed to delete student");
        }

        showToast(`Student ${id} deleted successfully.`, "info");
        await loadStudents();
    } catch (err) {
        showToast(`Delete error: ${err.message}`, "error");
    }
}

// Helper: Auto-suggest next student ID like S008
function generateNextStudentId() {
    let maxNum = 0;
    state.students.forEach(s => {
        const match = s.id && s.id.match(/^S(\d+)$/i);
        if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxNum) maxNum = num;
        }
    });
    const nextNum = maxNum + 1;
    return `S${String(nextNum).padStart(3, "0")}`;
}

// Helper: Toggle loading state UI
function updateLoadingUi() {
    if (state.isLoading) {
        dom.loadingState.style.display = "block";
        dom.emptyState.style.display = "none";
    } else {
        dom.loadingState.style.display = "none";
    }
}

// Helper: Toast Notifications
function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    let icon = "fa-circle-info";
    if (type === "success") icon = "fa-circle-check";
    if (type === "error") icon = "fa-circle-exclamation";

    toast.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        <div style="flex: 1; font-size: 0.85rem; font-weight: 500;">${escapeHtml(message)}</div>
    `;

    dom.toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.transition = "opacity 0.3s ease, transform 0.3s ease";
        toast.style.opacity = "0";
        toast.style.transform = "translateX(50px)";
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Helper: HTML Escaping for XSS prevention
function escapeHtml(text) {
    if (!text && text !== 0) return "";
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

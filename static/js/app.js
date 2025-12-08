// Global variables
let students = [];
let attendanceRecords = [];
let editingStudentId = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadStudents();
    loadAttendance();
    setTodayDate();
});

// Set today's date in the date picker
function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('attendance-date').value = today;
}

// Tab switching
function showTab(tabName) {
    const tabs = document.querySelectorAll('.tab-content');
    const buttons = document.querySelectorAll('.tab-btn');
    
    tabs.forEach(tab => tab.classList.remove('active'));
    buttons.forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(`${tabName}-tab`).classList.add('active');
    event.target.classList.add('active');
    
    if (tabName === 'reports') {
        updateReports();
    }
}

// Notification system
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Student CRUD operations
async function loadStudents() {
    try {
        const response = await fetch('/api/students');
        students = await response.json();
        renderStudentsTable();
        updateStudentDropdown();
    } catch (error) {
        console.error('Error loading students:', error);
        showNotification('Error loading students', 'error');
    }
}

function renderStudentsTable() {
    const tbody = document.getElementById('students-tbody');
    
    if (students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No BSIT students found. Add your first student!</td></tr>';
        return;
    }
    
    tbody.innerHTML = students.map(student => `
        <tr>
            <td>${student.id}</td>
            <td>${student.name}</td>
            <td>${student.email}</td>
            <td><span class="year-section-badge">${student.year}</span></td>
            <td><span class="year-section-badge">${student.section}</span></td>
            <td>${new Date(student.created_at).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-edit" onclick="editStudent(${student.id})">Edit</button>
                <button class="btn btn-danger" onclick="deleteStudent(${student.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

function showAddStudentModal() {
    editingStudentId = null;
    document.getElementById('modal-title').textContent = 'Add BSIT Student';
    document.getElementById('student-id').value = '';
    document.getElementById('student-name').value = '';
    document.getElementById('student-email').value = '';
    document.getElementById('student-year').value = '1st Year';
    document.getElementById('student-section').value = '';
    document.getElementById('student-modal').style.display = 'block';
}

function editStudent(id) {
    const student = students.find(s => s.id == id);
    if (!student) return;
    
    editingStudentId = id;
    document.getElementById('modal-title').textContent = 'Edit BSIT Student';
    document.getElementById('student-id').value = student.id;
    document.getElementById('student-name').value = student.name;
    document.getElementById('student-email').value = student.email;
    document.getElementById('student-year').value = student.year;
    document.getElementById('student-section').value = student.section;
    document.getElementById('student-modal').style.display = 'block';
}

async function saveStudent(event) {
    event.preventDefault();
    
    const name = document.getElementById('student-name').value;
    const email = document.getElementById('student-email').value;
    const year = document.getElementById('student-year').value;
    const section = document.getElementById('student-section').value;
    
    try {
        if (editingStudentId) {
            // Update existing student
            const response = await fetch(`/api/students/${editingStudentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, year, section })
            });
            
            if (response.ok) {
                showNotification('BSIT Student updated successfully');
                loadStudents();
                closeModal();
            }
        } else {
            // Create new student
            const response = await fetch('/api/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, year, section })
            });
            
            if (response.ok) {
                showNotification('BSIT Student created successfully');
                loadStudents();
                closeModal();
            }
        }
    } catch (error) {
        console.error('Error saving student:', error);
        showNotification('Error saving student', 'error');
    }
}

async function deleteStudent(id) {
    if (!confirm('Are you sure you want to delete this BSIT student?')) return;
    
    try {
        const response = await fetch(`/api/students/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showNotification('BSIT Student deleted successfully');
            loadStudents();
        }
    } catch (error) {
        console.error('Error deleting student:', error);
        showNotification('Error deleting student', 'error');
    }
}

function closeModal() {
    document.getElementById('student-modal').style.display = 'none';
}

// Attendance operations
async function loadAttendance() {
    try {
        const response = await fetch('/api/attendance');
        attendanceRecords = await response.json();
        renderAttendanceTable();
    } catch (error) {
        console.error('Error loading attendance:', error);
        showNotification('Error loading attendance', 'error');
    }
}

async function filterAttendance() {
    const date = document.getElementById('attendance-date').value;
    const year = document.getElementById('filter-year').value;
    const section = document.getElementById('filter-section').value;
    
    let url = '/api/attendance?';
    if (date) url += `date=${date}&`;
    if (year) url += `year=${year}&`;
    if (section) url += `section=${section}&`;
    
    try {
        const response = await fetch(url);
        attendanceRecords = await response.json();
        renderAttendanceTable();
    } catch (error) {
        console.error('Error filtering attendance:', error);
        showNotification('Error filtering attendance', 'error');
    }
}

function renderAttendanceTable() {
    const tbody = document.getElementById('attendance-tbody');
    
    if (attendanceRecords.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No attendance records found.</td></tr>';
        return;
    }
    
    tbody.innerHTML = attendanceRecords.map(record => `
        <tr>
            <td>${record.id}</td>
            <td>${record.student_name}</td>
            <td><span class="year-section-badge">${record.year}</span></td>
            <td><span class="year-section-badge">${record.section}</span></td>
            <td>${record.date}</td>
            <td><span class="status-badge status-${record.status.toLowerCase()}">${record.status}</span></td>
            <td>${record.notes || '-'}</td>
            <td>
                <button class="btn btn-danger" onclick="deleteAttendance(${record.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

function updateStudentDropdown() {
    const select = document.getElementById('quick-student');
    select.innerHTML = '<option value="">-- Select BSIT Student --</option>' + 
        students.map(s => `<option value="${s.id}" data-name="${s.name}" data-year="${s.year}" data-section="${s.section}">${s.name} - ${s.year} ${s.section}</option>`).join('');
}

async function quickMarkAttendance(status) {
    const select = document.getElementById('quick-student');
    const studentId = select.value;
    
    if (!studentId) {
        showNotification('Please select a BSIT student', 'error');
        return;
    }
    
    const option = select.options[select.selectedIndex];
    const studentName = option.dataset.name;
    const year = option.dataset.year;
    const section = option.dataset.section;
    const date = document.getElementById('attendance-date').value;
    
    try {
        const response = await fetch('/api/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                student_id: studentId,
                student_name: studentName,
                year: year,
                section: section,
                date: date,
                status: status,
                notes: ''
            })
        });
        
        if (response.ok) {
            showNotification(`Marked ${studentName} (${year} ${section}) as ${status}`);
            loadAttendance();
            select.value = '';
        }
    } catch (error) {
        console.error('Error marking attendance:', error);
        showNotification('Error marking attendance', 'error');
    }
}

async function deleteAttendance(id) {
    if (!confirm('Are you sure you want to delete this attendance record?')) return;
    
    try {
        const response = await fetch(`/api/attendance/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showNotification('Attendance record deleted successfully');
            loadAttendance();
        }
    } catch (error) {
        console.error('Error deleting attendance:', error);
        showNotification('Error deleting attendance', 'error');
    }
}

// Reports
function updateReports() {
    const totalStudents = students.length;
    const totalRecords = attendanceRecords.length;
    
    document.getElementById('total-students').textContent = totalStudents;
    document.getElementById('total-records').textContent = totalRecords;
    
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = attendanceRecords.filter(r => r.date === today);
    
    const present = todayRecords.filter(r => r.status === 'Present').length;
    const absent = todayRecords.filter(r => r.status === 'Absent').length;
    const late = todayRecords.filter(r => r.status === 'Late').length;
    
    document.getElementById('today-present').textContent = present;
    document.getElementById('today-absent').textContent = absent;
    document.getElementById('today-late').textContent = late;
    
    // Year level statistics
    const yearStats = {};
    students.forEach(s => {
        yearStats[s.year] = (yearStats[s.year] || 0) + 1;
    });
    
    const yearStatsHtml = Object.entries(yearStats)
        .map(([year, count]) => `<div class="summary-item">${year}: ${count} students</div>`)
        .join('');
    document.getElementById('year-stats').innerHTML = yearStatsHtml || '<div class="summary-item">No data</div>';
}

function exportStudents() {
    window.location.href = '/api/export/students';
    showNotification('Downloading BSIT students CSV...');
}

function exportAttendance() {
    window.location.href = '/api/export/attendance';
    showNotification('Downloading BSIT attendance CSV...');
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('student-modal');
    if (event.target == modal) {
        closeModal();
    }
}
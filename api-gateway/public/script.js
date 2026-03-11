/**
 * Student Course System — Frontend Logic (Microservices Version)
 *
 * Uses the Fetch API to communicate with the API Gateway.
 * The gateway routes requests to individual microservices.
 */

const API = ''; // same origin — served by API Gateway

// ========== DOM References ==========

// Student
const studentForm     = document.getElementById('student-form');
const studentNameIn   = document.getElementById('student-name');
const studentEmailIn  = document.getElementById('student-email');
const studentAgeIn    = document.getElementById('student-age');
const studentsTable   = document.getElementById('students-table').querySelector('tbody');
const studentCount    = document.getElementById('student-count');

// Course
const courseForm      = document.getElementById('course-form');
const courseNameIn    = document.getElementById('course-name');
const courseDescIn    = document.getElementById('course-desc');
const courseCreditsIn = document.getElementById('course-credits');
const coursesTable    = document.getElementById('courses-table').querySelector('tbody');
const courseCount     = document.getElementById('course-count');

// Enrollment
const enrollForm       = document.getElementById('enrollment-form');
const enrollStudentSel = document.getElementById('enroll-student');
const enrollCourseSel  = document.getElementById('enroll-course');
const enrollmentsTable = document.getElementById('enrollments-table').querySelector('tbody');
const enrollmentCount  = document.getElementById('enrollment-count');

// Toast container
const toastContainer = document.getElementById('toast-container');

// ========== Toast Notification ==========

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ========== API Helper ==========

async function api(endpoint, options = {}) {
  const res = await fetch(`${API}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = data.error || data.details?.join(', ') || 'Request failed';
    throw new Error(msg);
  }
  return data;
}

// ========== SERVICE HEALTH CHECK ==========

async function checkServiceHealth() {
  try {
    const response = await api('/health');
    
    response.services.forEach((service) => {
      let statusElement;
      if (service.name === 'Student Service') {
        statusElement = document.getElementById('student-service-status');
      } else if (service.name === 'Course Service') {
        statusElement = document.getElementById('course-service-status');
      } else if (service.name === 'Enrollment Service') {
        statusElement = document.getElementById('enrollment-service-status');
      }
      
      if (statusElement) {
        statusElement.className = `status-card ${service.status === 'healthy' ? 'healthy' : 'unhealthy'}`;
      }
    });
    
    showToast('Service status refreshed');
  } catch (err) {
    showToast('Could not check service health', 'error');
  }
}

// ========== STUDENTS ==========

async function loadStudents() {
  try {
    const { data, count } = await api('/students');
    studentCount.textContent = count;

    if (data.length === 0) {
      studentsTable.innerHTML = '<tr><td colspan="4" class="empty-msg">No students yet.</td></tr>';
      return;
    }

    studentsTable.innerHTML = data.map(s => `
      <tr>
        <td>${escapeHtml(s.fullName)}</td>
        <td>${escapeHtml(s.email)}</td>
        <td>${s.age}</td>
        <td><button class="btn btn-danger" onclick="deleteStudent('${s.id}')">Delete</button></td>
      </tr>
    `).join('');
  } catch (err) {
    showToast(err.message, 'error');
    studentsTable.innerHTML = '<tr><td colspan="4" class="empty-msg error-msg">Failed to load students. Is Student Service running?</td></tr>';
  }
}

studentForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const fullName = studentNameIn.value.trim();
  const email    = studentEmailIn.value.trim();
  const age      = parseInt(studentAgeIn.value, 10);

  if (!fullName || !email || !age || age <= 0) {
    showToast('Please fill in all student fields correctly.', 'error');
    return;
  }

  try {
    await api('/students', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, age }),
    });
    showToast('Student added successfully!');
    studentForm.reset();
    loadStudents();
    loadEnrollmentDropdowns();
  } catch (err) {
    showToast(err.message, 'error');
  }
});

async function deleteStudent(id) {
  if (!confirm('Delete this student?')) return;

  try {
    await api(`/students/${id}`, { method: 'DELETE' });
    showToast('Student deleted.');
    loadStudents();
    loadEnrollments();
    loadEnrollmentDropdowns();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ========== COURSES ==========

async function loadCourses() {
  try {
    const { data, count } = await api('/courses');
    courseCount.textContent = count;

    if (data.length === 0) {
      coursesTable.innerHTML = '<tr><td colspan="4" class="empty-msg">No courses yet.</td></tr>';
      return;
    }

    coursesTable.innerHTML = data.map(c => `
      <tr>
        <td>${escapeHtml(c.name)}</td>
        <td>${escapeHtml(c.description)}</td>
        <td>${c.credits}</td>
        <td><button class="btn btn-danger" onclick="deleteCourse('${c.id}')">Delete</button></td>
      </tr>
    `).join('');
  } catch (err) {
    showToast(err.message, 'error');
    coursesTable.innerHTML = '<tr><td colspan="4" class="empty-msg error-msg">Failed to load courses. Is Course Service running?</td></tr>';
  }
}

courseForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name        = courseNameIn.value.trim();
  const description = courseDescIn.value.trim();
  const credits     = parseInt(courseCreditsIn.value, 10);

  if (!name || !description || !credits || credits <= 0) {
    showToast('Please fill in all course fields correctly.', 'error');
    return;
  }

  try {
    await api('/courses', {
      method: 'POST',
      body: JSON.stringify({ name, description, credits }),
    });
    showToast('Course added successfully!');
    courseForm.reset();
    loadCourses();
    loadEnrollmentDropdowns();
  } catch (err) {
    showToast(err.message, 'error');
  }
});

async function deleteCourse(id) {
  if (!confirm('Delete this course?')) return;

  try {
    await api(`/courses/${id}`, { method: 'DELETE' });
    showToast('Course deleted.');
    loadCourses();
    loadEnrollments();
    loadEnrollmentDropdowns();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ========== ENROLLMENTS ==========

async function loadEnrollments() {
  try {
    const { data, count } = await api('/enrollments');
    enrollmentCount.textContent = count;

    if (data.length === 0) {
      enrollmentsTable.innerHTML = '<tr><td colspan="3" class="empty-msg">No enrollments yet.</td></tr>';
      return;
    }

    enrollmentsTable.innerHTML = data.map(e => `
      <tr>
        <td>${escapeHtml(e.studentName)}</td>
        <td>${escapeHtml(e.courseName)}</td>
        <td>${new Date(e.enrolledAt).toLocaleString()}</td>
      </tr>
    `).join('');
  } catch (err) {
    showToast(err.message, 'error');
    enrollmentsTable.innerHTML = '<tr><td colspan="3" class="empty-msg error-msg">Failed to load enrollments. Is Enrollment Service running?</td></tr>';
  }
}

async function loadEnrollmentDropdowns() {
  try {
    const [students, courses] = await Promise.all([
      api('/students'),
      api('/courses'),
    ]);

    // Populate student dropdown
    enrollStudentSel.innerHTML = '<option value="">-- Choose a student --</option>';
    students.data.forEach(s => {
      enrollStudentSel.innerHTML += `<option value="${s.id}">${escapeHtml(s.fullName)}</option>`;
    });

    // Populate course dropdown
    enrollCourseSel.innerHTML = '<option value="">-- Choose a course --</option>';
    courses.data.forEach(c => {
      enrollCourseSel.innerHTML += `<option value="${c.id}">${escapeHtml(c.name)}</option>`;
    });
  } catch (err) {
    showToast('Could not load dropdowns: ' + err.message, 'error');
  }
}

enrollForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const studentId = enrollStudentSel.value;
  const courseId  = enrollCourseSel.value;

  if (!studentId || !courseId) {
    showToast('Please select both a student and a course.', 'error');
    return;
  }

  try {
    await api('/enrollments', {
      method: 'POST',
      body: JSON.stringify({ studentId, courseId }),
    });
    showToast('Student enrolled successfully!');
    enrollForm.reset();
    loadEnrollments();
  } catch (err) {
    showToast(err.message, 'error');
  }
});

// ========== Utility ==========

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ========== Initial Load ==========

document.addEventListener('DOMContentLoaded', () => {
  loadStudents();
  loadCourses();
  loadEnrollments();
  loadEnrollmentDropdowns();
  checkServiceHealth();
});

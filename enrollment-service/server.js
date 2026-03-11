/**
 * Enrollment Service - Microservices Architecture
 * 
 * Independent service for managing enrollments.
 * Runs on PORT 3003 by default.
 * Has its own in-memory database.
 * 
 * KEY MICROSERVICES FEATURE:
 * This service communicates with Student Service and Course Service
 * via HTTP requests to validate that students and courses exist
 * before creating an enrollment.
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3003;
const SERVICE_NAME = 'Enrollment Service';

// --------------- Service URLs (for inter-service communication) ---------------
const STUDENT_SERVICE_URL = process.env.STUDENT_SERVICE_URL || 'http://localhost:3001';
const COURSE_SERVICE_URL = process.env.COURSE_SERVICE_URL || 'http://localhost:3002';

// Timeout for inter-service HTTP requests (in milliseconds)
const SERVICE_TIMEOUT = parseInt(process.env.SERVICE_TIMEOUT) || 5000;

// --------------- In-Memory Database ---------------
let enrollments = [];

// --------------- Middleware ---------------
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${SERVICE_NAME}] [${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// --------------- Validation Middleware ---------------
const validateEnrollment = (req, res, next) => {
  const { studentId, courseId } = req.body;
  const errors = [];

  if (!studentId || typeof studentId !== 'string' || studentId.trim() === '') {
    errors.push('studentId is required and must be a non-empty string');
  }

  if (!courseId || typeof courseId !== 'string' || courseId.trim() === '') {
    errors.push('courseId is required and must be a non-empty string');
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'VALIDATION_ERROR', 
      message: errors.join('; ') 
    });
  }

  next();
};

// --------------- Helper Functions ---------------

/**
 * Fetch with timeout support
 */
async function fetchWithTimeout(url, options = {}, timeout = SERVICE_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Fetch student from Student Service via HTTP.
 * Returns object with status: 'success' | 'not_found' | 'unavailable' | 'timeout'
 */
async function fetchStudent(studentId) {
  try {
    const response = await fetchWithTimeout(`${STUDENT_SERVICE_URL}/students/${studentId}`);
    if (response.ok) {
      const result = await response.json();
      return { status: 'success', data: result.data };
    }
    if (response.status === 404) {
      return { status: 'not_found', data: null };
    }
    return { status: 'unavailable', data: null };
  } catch (error) {
    console.error(`[${SERVICE_NAME}] Error fetching student:`, error.message);
    if (error.name === 'AbortError') {
      return { status: 'timeout', data: null };
    }
    return { status: 'unavailable', data: null };
  }
}

/**
 * Fetch course from Course Service via HTTP.
 * Returns object with status: 'success' | 'not_found' | 'unavailable' | 'timeout'
 */
async function fetchCourse(courseId) {
  try {
    const response = await fetchWithTimeout(`${COURSE_SERVICE_URL}/courses/${courseId}`);
    if (response.ok) {
      const result = await response.json();
      return { status: 'success', data: result.data };
    }
    if (response.status === 404) {
      return { status: 'not_found', data: null };
    }
    return { status: 'unavailable', data: null };
  } catch (error) {
    console.error(`[${SERVICE_NAME}] Error fetching course:`, error.message);
    if (error.name === 'AbortError') {
      return { status: 'timeout', data: null };
    }
    return { status: 'unavailable', data: null };
  }
}

/**
 * Check if enrollment already exists.
 */
const enrollmentExists = (studentId, courseId) =>
  enrollments.some((e) => e.studentId === studentId && e.courseId === courseId);

// --------------- Routes ---------------

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: SERVICE_NAME,
    version: '1.0.0',
    endpoints: {
      health: '/health',
      enrollments: '/enrollments',
    },
    dependencies: {
      studentService: STUDENT_SERVICE_URL,
      courseService: COURSE_SERVICE_URL,
    },
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    service: SERVICE_NAME, 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    enrollmentCount: enrollments.length,
    dependencies: {
      studentService: STUDENT_SERVICE_URL,
      courseService: COURSE_SERVICE_URL,
    }
  });
});

// GET /enrollments - Get all enrollments
app.get('/enrollments', async (req, res) => {
  // Enrich enrollment data with student/course info from other services
  const enrichedEnrollments = await Promise.all(
    enrollments.map(async (enrollment) => {
      const student = await fetchStudent(enrollment.studentId);
      const course = await fetchCourse(enrollment.courseId);
      return {
        ...enrollment,
        studentName: student ? student.fullName : 'Unknown (service unavailable)',
        courseName: course ? course.name : 'Unknown (service unavailable)',
      };
    })
  );

  res.json({ 
    message: 'Enrollments retrieved successfully', 
    data: enrichedEnrollments, 
    count: enrichedEnrollments.length 
  });
});

// GET /enrollments/:id - Get enrollment by composite ID (studentId-courseId)
app.get('/enrollments/:id', async (req, res) => {
  const { id } = req.params;
  
  // Find enrollment by studentId (treating id as studentId for this endpoint)
  const studentEnrollments = enrollments.filter((e) => e.studentId === id);
  
  if (studentEnrollments.length === 0) {
    return res.status(404).json({ error: `No enrollments found for student ID "${id}"` });
  }

  // Enrich with course names
  const enriched = await Promise.all(
    studentEnrollments.map(async (enrollment) => {
      const student = await fetchStudent(enrollment.studentId);
      const course = await fetchCourse(enrollment.courseId);
      return {
        ...enrollment,
        studentName: student ? student.fullName : 'Unknown',
        courseName: course ? course.name : 'Unknown',
      };
    })
  );

  res.json({ 
    message: 'Enrollments retrieved successfully', 
    data: enriched, 
    count: enriched.length 
  });
});

// GET /enrollments/student/:studentId - Get all enrollments for a student
app.get('/enrollments/student/:studentId', async (req, res) => {
  const { studentId } = req.params;

  // Verify student exists via Student Service
  const student = await fetchStudent(studentId);
  if (!student) {
    return res.status(404).json({ 
      error: `Student with ID "${studentId}" not found or Student Service unavailable` 
    });
  }

  const studentEnrollments = enrollments.filter((e) => e.studentId === studentId);

  // Enrich with course names
  const enriched = await Promise.all(
    studentEnrollments.map(async (enrollment) => {
      const course = await fetchCourse(enrollment.courseId);
      return {
        ...enrollment,
        studentName: student.fullName,
        courseName: course ? course.name : 'Unknown',
      };
    })
  );

  res.json({
    message: `Enrollments for ${student.fullName} retrieved successfully`,
    data: enriched,
    count: enriched.length,
  });
});

// POST /enrollments - Create a new enrollment
app.post('/enrollments', validateEnrollment, async (req, res) => {
  const { studentId, courseId } = req.body;

  // INTER-SERVICE COMMUNICATION: Verify student exists
  const studentResult = await fetchStudent(studentId);
  
  if (studentResult.status === 'timeout') {
    return res.status(504).json({
      error: 'GATEWAY_TIMEOUT',
      message: 'Student Service took too long to respond'
    });
  }
  
  if (studentResult.status === 'unavailable') {
    return res.status(503).json({
      error: 'SERVICE_UNAVAILABLE',
      message: 'Student Service is currently unavailable'
    });
  }
  
  if (studentResult.status === 'not_found') {
    return res.status(404).json({
      error: 'STUDENT_NOT_FOUND',
      message: `Student with ID "${studentId}" not found`
    });
  }

  // INTER-SERVICE COMMUNICATION: Verify course exists
  const courseResult = await fetchCourse(courseId);
  
  if (courseResult.status === 'timeout') {
    return res.status(504).json({
      error: 'GATEWAY_TIMEOUT',
      message: 'Course Service took too long to respond'
    });
  }
  
  if (courseResult.status === 'unavailable') {
    return res.status(503).json({
      error: 'SERVICE_UNAVAILABLE',
      message: 'Course Service is currently unavailable'
    });
  }
  
  if (courseResult.status === 'not_found') {
    return res.status(404).json({
      error: 'COURSE_NOT_FOUND',
      message: `Course with ID "${courseId}" not found`
    });
  }

  const student = studentResult.data;
  const course = courseResult.data;

  // Check for duplicate enrollment
  if (enrollmentExists(studentId, courseId)) {
    return res.status(409).json({
      error: 'DUPLICATE_ENROLLMENT',
      message: `Student "${student.fullName}" is already enrolled in "${course.name}"`
    });
  }

  const enrollment = {
    studentId,
    courseId,
    enrolledAt: new Date().toISOString(),
  };

  enrollments.push(enrollment);

  res.status(201).json({
    id: `${studentId}-${courseId}`,
    message: 'Enrollment created successfully',
    data: {
      ...enrollment,
      studentName: student.fullName,
      courseName: course.name,
    },
  });
});

// DELETE /enrollments - Delete an enrollment
app.delete('/enrollments', async (req, res) => {
  const { studentId, courseId } = req.body;

  if (!studentId || !courseId) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'studentId and courseId are required'
    });
  }

  const index = enrollments.findIndex(
    (e) => e.studentId === studentId && e.courseId === courseId
  );

  if (index === -1) {
    return res.status(404).json({ 
      error: 'ENROLLMENT_NOT_FOUND',
      message: `Enrollment not found for student "${studentId}" in course "${courseId}"` 
    });
  }

  const deleted = enrollments.splice(index, 1)[0];
  res.json({ message: 'Enrollment deleted successfully', data: deleted });
});

// --------------- 404 Handler ---------------
app.use((req, res) => {
  res.status(404).json({ 
    error: 'ROUTE_NOT_FOUND', 
    message: `Route ${req.method} ${req.url} not found` 
  });
});

// --------------- Error Handler ---------------
app.use((err, req, res, next) => {
  console.error(`[${SERVICE_NAME}] Error:`, err.message);
  res.status(err.statusCode || 500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: err.message || 'Internal Server Error',
  });
});

// --------------- Start Server ---------------
app.listen(PORT, () => {
  console.log(`${SERVICE_NAME} running on http://localhost:${PORT}`);
  console.log(`Dependencies:`);
  console.log(`  - Student Service: ${STUDENT_SERVICE_URL}`);
  console.log(`  - Course Service: ${COURSE_SERVICE_URL}`);
  console.log('Press Ctrl+C to stop');
});

module.exports = app;

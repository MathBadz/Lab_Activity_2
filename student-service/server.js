/**
 * Student Service - Microservices Architecture
 * 
 * Independent service for managing students.
 * Runs on PORT 3001 by default.
 * Has its own in-memory database.
 */

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;
const SERVICE_NAME = 'Student Service';

// --------------- In-Memory Database ---------------
let students = [];

// --------------- Middleware ---------------
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${SERVICE_NAME}] [${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// --------------- Validation Middleware ---------------
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateStudent = (req, res, next) => {
  const { fullName, email, age } = req.body;
  const errors = [];

  if (!fullName || typeof fullName !== 'string' || fullName.trim() === '') {
    errors.push('fullName is required and must be a non-empty string');
  }

  if (!email || !EMAIL_REGEX.test(email)) {
    errors.push('email is required and must be a valid email format');
  }

  if (age === undefined || age === null || typeof age !== 'number' || age <= 0 || !Number.isInteger(age)) {
    errors.push('age is required and must be a positive integer');
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
const getStudentById = (id) => students.find((s) => s.id === id);
const getStudentByEmail = (email) => students.find((s) => s.email === email);

// --------------- Routes ---------------

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: SERVICE_NAME,
    version: '1.0.0',
    endpoints: {
      health: '/health',
      students: '/students',
    },
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    service: SERVICE_NAME, 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    studentCount: students.length 
  });
});

// GET /students - Get all students
app.get('/students', (req, res) => {
  res.json({ 
    message: 'Students retrieved successfully', 
    data: students, 
    count: students.length 
  });
});

// GET /students/:id - Get a single student by ID
app.get('/students/:id', (req, res) => {
  const student = getStudentById(req.params.id);

  if (!student) {
    return res.status(404).json({ 
      error: 'STUDENT_NOT_FOUND', 
      message: `Student with ID "${req.params.id}" not found` 
    });
  }

  res.json({ message: 'Student retrieved successfully', data: student });
});

// POST /students - Create a new student
app.post('/students', validateStudent, (req, res) => {
  const { fullName, email, age } = req.body;

  // Check for duplicate email
  const existingStudent = getStudentByEmail(email.trim().toLowerCase());
  if (existingStudent) {
    return res.status(409).json({ 
      error: 'DUPLICATE_EMAIL', 
      message: `A student with email "${email}" already exists` 
    });
  }

  const student = {
    id: uuidv4(),
    fullName: fullName.trim(),
    email: email.trim().toLowerCase(),
    age,
    createdAt: new Date().toISOString(),
  };

  students.push(student);
  res.status(201).json({ message: 'Student created successfully', data: student });
});

// PUT /students/:id - Update a student
app.put('/students/:id', validateStudent, (req, res) => {
  const { id } = req.params;
  const { fullName, email, age } = req.body;

  const index = students.findIndex((s) => s.id === id);
  if (index === -1) {
    return res.status(404).json({ 
      error: 'STUDENT_NOT_FOUND', 
      message: `Student with ID "${id}" not found` 
    });
  }

  // If email is changing, check for duplicate
  if (email && email.toLowerCase() !== students[index].email) {
    const duplicate = getStudentByEmail(email);
    if (duplicate) {
      return res.status(409).json({ 
        error: 'DUPLICATE_EMAIL', 
        message: `A student with email "${email}" already exists` 
      });
    }
  }

  students[index] = {
    ...students[index],
    fullName: fullName ? fullName.trim() : students[index].fullName,
    email: email ? email.trim().toLowerCase() : students[index].email,
    age: age || students[index].age,
    updatedAt: new Date().toISOString(),
  };

  res.json({ message: 'Student updated successfully', data: students[index] });
});

// DELETE /students/:id - Delete a student
app.delete('/students/:id', (req, res) => {
  const { id } = req.params;
  const index = students.findIndex((s) => s.id === id);

  if (index === -1) {
    return res.status(404).json({ 
      error: 'STUDENT_NOT_FOUND', 
      message: `Student with ID "${id}" not found` 
    });
  }

  const deleted = students.splice(index, 1)[0];
  res.json({ message: 'Student deleted successfully', data: deleted });
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
  console.log('Press Ctrl+C to stop');
});

module.exports = app;

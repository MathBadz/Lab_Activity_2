/**
 * Course Service - Microservices Architecture
 * 
 * Independent service for managing courses.
 * Runs on PORT 3002 by default.
 * Has its own in-memory database.
 */

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3002;
const SERVICE_NAME = 'Course Service';

// --------------- In-Memory Database ---------------
let courses = [];

// --------------- Middleware ---------------
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${SERVICE_NAME}] [${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// --------------- Validation Middleware ---------------
const validateCourse = (req, res, next) => {
  const { name, description, credits } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim() === '') {
    errors.push('name is required and must be a non-empty string');
  }

  if (!description || typeof description !== 'string' || description.trim() === '') {
    errors.push('description is required and must be a non-empty string');
  }

  if (credits === undefined || credits === null || typeof credits !== 'number' || credits <= 0) {
    errors.push('credits is required and must be a positive number');
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
const getCourseById = (id) => courses.find((c) => c.id === id);

// --------------- Routes ---------------

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: SERVICE_NAME,
    version: '1.0.0',
    endpoints: {
      health: '/health',
      courses: '/courses',
    },
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    service: SERVICE_NAME, 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    courseCount: courses.length 
  });
});

// GET /courses - Get all courses
app.get('/courses', (req, res) => {
  res.json({ 
    message: 'Courses retrieved successfully', 
    data: courses, 
    count: courses.length 
  });
});

// GET /courses/:id - Get a single course by ID
app.get('/courses/:id', (req, res) => {
  const course = getCourseById(req.params.id);

  if (!course) {
    return res.status(404).json({ 
      error: 'COURSE_NOT_FOUND', 
      message: `Course with ID "${req.params.id}" not found` 
    });
  }

  res.json({ message: 'Course retrieved successfully', data: course });
});

// POST /courses - Create a new course
app.post('/courses', validateCourse, (req, res) => {
  const { name, description, credits } = req.body;

  const course = {
    id: uuidv4(),
    name: name.trim(),
    description: description.trim(),
    credits,
    createdAt: new Date().toISOString(),
  };

  courses.push(course);
  res.status(201).json({ message: 'Course created successfully', data: course });
});

// PUT /courses/:id - Update a course
app.put('/courses/:id', validateCourse, (req, res) => {
  const { id } = req.params;
  const { name, description, credits } = req.body;

  const index = courses.findIndex((c) => c.id === id);
  if (index === -1) {
    return res.status(404).json({ 
      error: 'COURSE_NOT_FOUND', 
      message: `Course with ID "${id}" not found` 
    });
  }

  courses[index] = {
    ...courses[index],
    name: name ? name.trim() : courses[index].name,
    description: description ? description.trim() : courses[index].description,
    credits: credits || courses[index].credits,
    updatedAt: new Date().toISOString(),
  };

  res.json({ message: 'Course updated successfully', data: courses[index] });
});

// DELETE /courses/:id - Delete a course
app.delete('/courses/:id', (req, res) => {
  const { id } = req.params;
  const index = courses.findIndex((c) => c.id === id);

  if (index === -1) {
    return res.status(404).json({ 
      error: 'COURSE_NOT_FOUND', 
      message: `Course with ID "${id}" not found` 
    });
  }

  const deleted = courses.splice(index, 1)[0];
  res.json({ message: 'Course deleted successfully', data: deleted });
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

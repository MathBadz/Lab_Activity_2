/**
 * API Gateway - Microservices Architecture
 * 
 * This is the unified entry point for all microservices.
 * It routes requests to the appropriate service.
 * Runs on PORT 3000 by default (same as monolithic for easy comparison).
 * 
 * Routes:
 *   /students/*    -> Student Service (PORT 3001)
 *   /courses/*     -> Course Service (PORT 3002)
 *   /enrollments/* -> Enrollment Service (PORT 3003)
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const SERVICE_NAME = 'API Gateway';

// --------------- Service URLs ---------------
const STUDENT_SERVICE_URL = process.env.STUDENT_SERVICE_URL || 'http://localhost:3001';
const COURSE_SERVICE_URL = process.env.COURSE_SERVICE_URL || 'http://localhost:3002';
const ENROLLMENT_SERVICE_URL = process.env.ENROLLMENT_SERVICE_URL || 'http://localhost:3003';

// Timeout for proxied requests (in milliseconds)
const PROXY_TIMEOUT = parseInt(process.env.PROXY_TIMEOUT) || 5000;

// --------------- Middleware ---------------
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Request logger
app.use((req, res, next) => {
  console.log(`[${SERVICE_NAME}] [${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// --------------- Proxy Helper ---------------

/**
 * Fetch with timeout support
 */
async function fetchWithTimeout(url, options = {}, timeout = PROXY_TIMEOUT) {
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
 * Forwards the request to a target service.
 * Handles GET, POST, PUT, DELETE methods.
 */
async function proxyRequest(targetUrl, req, res) {
  try {
    const options = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Include body for POST/PUT requests
    if (['POST', 'PUT', 'DELETE'].includes(req.method) && req.body) {
      options.body = JSON.stringify(req.body);
    }

    console.log(`[${SERVICE_NAME}] Proxying to: ${targetUrl}`);
    
    const response = await fetchWithTimeout(targetUrl, options);
    const data = await response.json();
    
    res.status(response.status).json(data);
  } catch (error) {
    console.error(`[${SERVICE_NAME}] Proxy error:`, error.message);
    
    if (error.name === 'AbortError') {
      return res.status(504).json({
        error: 'GATEWAY_TIMEOUT',
        message: 'Target service took too long to respond',
      });
    }
    
    res.status(503).json({
      error: 'SERVICE_UNAVAILABLE',
      message: `Could not reach the target service. ${error.message}`,
    });
  }
}

// --------------- Gateway Routes ---------------

// Health check for gateway
app.get('/health', async (req, res) => {
  // Check health of all services
  const services = [
    { name: 'Student Service', url: `${STUDENT_SERVICE_URL}/health` },
    { name: 'Course Service', url: `${COURSE_SERVICE_URL}/health` },
    { name: 'Enrollment Service', url: `${ENROLLMENT_SERVICE_URL}/health` },
  ];

  const statuses = await Promise.all(
    services.map(async (service) => {
      try {
        const response = await fetch(service.url);
        const data = await response.json();
        return { name: service.name, status: 'healthy', details: data };
      } catch (error) {
        return { name: service.name, status: 'unhealthy', error: error.message };
      }
    })
  );

  const allHealthy = statuses.every((s) => s.status === 'healthy');

  res.status(allHealthy ? 200 : 503).json({
    service: SERVICE_NAME,
    status: allHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    services: statuses,
  });
});

// Root endpoint - API info
app.get('/', (req, res) => {
  res.json({
    message: 'Student Course System API Gateway (Microservices Architecture)',
    architecture: 'Microservices',
    services: {
      students: `${STUDENT_SERVICE_URL}`,
      courses: `${COURSE_SERVICE_URL}`,
      enrollments: `${ENROLLMENT_SERVICE_URL}`,
    },
    endpoints: {
      students: '/students',
      courses: '/courses',
      enrollments: '/enrollments',
    },
  });
});

// --------------- Student Routes (Proxy to Student Service) ---------------

app.get('/students', (req, res) => {
  proxyRequest(`${STUDENT_SERVICE_URL}/students`, req, res);
});

app.get('/students/:id', (req, res) => {
  proxyRequest(`${STUDENT_SERVICE_URL}/students/${req.params.id}`, req, res);
});

app.post('/students', (req, res) => {
  proxyRequest(`${STUDENT_SERVICE_URL}/students`, req, res);
});

app.put('/students/:id', (req, res) => {
  proxyRequest(`${STUDENT_SERVICE_URL}/students/${req.params.id}`, req, res);
});

app.delete('/students/:id', (req, res) => {
  proxyRequest(`${STUDENT_SERVICE_URL}/students/${req.params.id}`, req, res);
});

// --------------- Course Routes (Proxy to Course Service) ---------------

app.get('/courses', (req, res) => {
  proxyRequest(`${COURSE_SERVICE_URL}/courses`, req, res);
});

app.get('/courses/:id', (req, res) => {
  proxyRequest(`${COURSE_SERVICE_URL}/courses/${req.params.id}`, req, res);
});

app.post('/courses', (req, res) => {
  proxyRequest(`${COURSE_SERVICE_URL}/courses`, req, res);
});

app.put('/courses/:id', (req, res) => {
  proxyRequest(`${COURSE_SERVICE_URL}/courses/${req.params.id}`, req, res);
});

app.delete('/courses/:id', (req, res) => {
  proxyRequest(`${COURSE_SERVICE_URL}/courses/${req.params.id}`, req, res);
});

// --------------- Enrollment Routes (Proxy to Enrollment Service) ---------------

app.get('/enrollments', (req, res) => {
  proxyRequest(`${ENROLLMENT_SERVICE_URL}/enrollments`, req, res);
});

app.get('/enrollments/:id', (req, res) => {
  proxyRequest(`${ENROLLMENT_SERVICE_URL}/enrollments/${req.params.id}`, req, res);
});

app.get('/enrollments/student/:studentId', (req, res) => {
  proxyRequest(`${ENROLLMENT_SERVICE_URL}/enrollments/student/${req.params.studentId}`, req, res);
});

app.post('/enrollments', (req, res) => {
  proxyRequest(`${ENROLLMENT_SERVICE_URL}/enrollments`, req, res);
});

app.delete('/enrollments', (req, res) => {
  proxyRequest(`${ENROLLMENT_SERVICE_URL}/enrollments`, req, res);
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
  console.log(`\nRouting to services:`);
  console.log(`  /students/*     -> ${STUDENT_SERVICE_URL}`);
  console.log(`  /courses/*      -> ${COURSE_SERVICE_URL}`);
  console.log(`  /enrollments/*  -> ${ENROLLMENT_SERVICE_URL}`);
  console.log('\nPress Ctrl+C to stop');
});

module.exports = app;

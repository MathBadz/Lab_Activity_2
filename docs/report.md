# Lab 2 Report: Microservices Edge Case Testing

**Lab:** System Architecture and Integration 2 - Laboratory 2  
**Topic:** Microservices Edge Case Testing (Curl-Based)

---

## 1. Introduction

This report documents edge case testing for a microservices architecture with three services:

| Service | Port | Responsibility |
|---------|------|----------------|
| Student Service | 3001 | CRUD for student records |
| Course Service | 3002 | CRUD for course records |
| Enrollment Service | 3003 | Student-course enrollments with inter-service communication |

---

## 2. Implemented Edge Cases

### 2.1 400 Bad Request - Invalid/Missing Input

Each service validates required fields before processing:

| Service | Required Fields |
|---------|----------------|
| Student | `fullName` (string), `email` (valid format), `age` (positive integer) |
| Course | `name` (string), `description` (string), `credits` (positive number) |
| Enrollment | `studentId` (string), `courseId` (string) |

Validation middleware collects all errors and returns them in a single response with error code `VALIDATION_ERROR`.

### 2.2 404 Not Found - Missing Resources

All services check if resources exist before GET/PUT/DELETE operations. If a resource is not found, the service returns `STUDENT_NOT_FOUND`, `COURSE_NOT_FOUND`, or `ENROLLMENT_NOT_FOUND` errors. Additionally, each service implements a catch-all handler that returns `ROUTE_NOT_FOUND` for undefined API endpoints.

### 2.3 409 Conflict - Duplicate Resources

The Student Service checks for duplicate emails before creating a new student, returning `DUPLICATE_EMAIL` if a match is found. The Enrollment Service verifies that a student is not already enrolled in a course before creating a new enrollment, returning `DUPLICATE_ENROLLMENT` if the combination already exists.

### 2.4 503 Service Unavailable - Dependency Down

The Enrollment Service communicates with Student and Course services via HTTP to validate data before creating enrollments. When a dependency service is unreachable (connection refused), the service returns `SERVICE_UNAVAILABLE` with a 503 status code, informing the client that the operation cannot be completed due to a downstream service failure.

### 2.5 504 Gateway Timeout - Slow Dependency

The Enrollment Service implements configurable timeouts (default: 5 seconds via `SERVICE_TIMEOUT` environment variable) using AbortController. If a dependency service takes too long to respond, the request is aborted and a `GATEWAY_TIMEOUT` error is returned with a 504 status code. This prevents the service from hanging indefinitely when dependencies are slow or unresponsive.

---

## 3. API Response Format

**Success:** `{ "message": "Operation successful", "data": {...} }`  
**Error:** `{ "error": "ERROR_CODE", "message": "Human readable explanation" }`

| Error Code | Description |
|------------|-------------|
| `VALIDATION_ERROR` | Invalid or missing input fields |
| `STUDENT_NOT_FOUND` | Student ID not in database |
| `COURSE_NOT_FOUND` | Course ID not in database |
| `DUPLICATE_EMAIL` | Email already registered |
| `DUPLICATE_ENROLLMENT` | Student already enrolled in course |
| `ROUTE_NOT_FOUND` | Invalid API endpoint |
| `SERVICE_UNAVAILABLE` | Dependency service is down |
| `GATEWAY_TIMEOUT` | Dependency service too slow |

---

## 4. Testing

**Environment:** Windows, Node.js/Express.js, curl with `-i` flag

**Test Categories:**
1. Happy Path - Normal CRUD operations
2. Validation (400) - Invalid input
3. Not Found (404) - Missing resources
4. Conflict (409) - Duplicates
5. Dependency Failures (503/504) - Service failures

**Evidence:** All test outputs saved in `docs/evidence/` as text files with HTTP status codes, headers, and JSON responses.

---

## 5. Reflections

**Reflection**

During the development of our microservices architecture, we encountered several challenges that helped us better understand how distributed systems work. One of the main difficulties was implementing reliable HTTP communication between services while handling possible errors. Unlike monolithic systems where components interact directly, microservices communicate through network requests, which can fail due to timeouts, connection issues, or unexpected responses. Because of this, we had to carefully design how each service handles these failures and returns proper error messages.

Another challenge we faced was testing timeout scenarios and ensuring consistent error responses across all services. Simulating timeouts required adjusting configurations or temporarily modifying service behavior, which showed us the importance of making timeout values configurable instead of hardcoding them. We also realized that without a clear API contract, error formats between services could easily become inconsistent. This experience emphasized the need for proper planning and standardized response structures when building microservices.

Overall, this activity helped us understand that microservices must always expect that other services may fail. Because of this, defensive programming and proper error handling are very important. In the future, we believe the system could be improved by adding features such as circuit breakers, retry mechanisms, health checks, and centralized logging to make the system more reliable and easier to monitor.


---



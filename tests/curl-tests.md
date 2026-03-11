# Curl Tests - Microservices Edge Case Testing

This document contains all curl commands used to test the microservices edge cases.

---

## Setup Commands

### Check Service Health

```bash
# Student Service Health
curl -i http://localhost:3001/health

# Course Service Health
curl -i http://localhost:3002/health

# Enrollment Service Health
curl -i http://localhost:3003/health
```

### Create Test Data

```bash
# Create a test student
curl -i -X POST http://localhost:3001/students \
  -H "Content-Type: application/json" \
  -d '{"fullName": "John Doe", "email": "john.doe@university.edu", "age": 20}'

# Create a test course
curl -i -X POST http://localhost:3002/courses \
  -H "Content-Type: application/json" \
  -d '{"name": "Introduction to Microservices", "description": "Learn microservices architecture", "credits": 3}'
```

---

## Test 1: 400 Bad Request - Invalid/Missing Input

### 1.1 Missing Required Field (fullName)
```bash
curl -i -X POST http://localhost:3001/students \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com", "age": 20}'
```

### 1.2 Invalid Email Format
```bash
curl -i -X POST http://localhost:3001/students \
  -H "Content-Type: application/json" \
  -d '{"fullName": "Jane Doe", "email": "invalid-email", "age": 21}'
```

### 1.3 Invalid Age (Negative Number)
```bash
curl -i -X POST http://localhost:3001/students \
  -H "Content-Type: application/json" \
  -d '{"fullName": "Jane Doe", "email": "jane@test.com", "age": -5}'
```

### 1.4 Missing Course Name
```bash
curl -i -X POST http://localhost:3002/courses \
  -H "Content-Type: application/json" \
  -d '{"description": "Test course", "credits": 3}'
```

### 1.5 Missing studentId in Enrollment
```bash
curl -i -X POST http://localhost:3003/enrollments \
  -H "Content-Type: application/json" \
  -d '{"courseId": "some-course-id"}'
```

### 1.6 Empty Request Body
```bash
curl -i -X POST http://localhost:3001/students \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## Test 2: 404 Not Found - Missing Resources

### 2.1 Get Non-Existent Student
```bash
curl -i http://localhost:3001/students/non-existent-id-12345
```

### 2.2 Get Non-Existent Course
```bash
curl -i http://localhost:3002/courses/non-existent-course-id
```

### 2.3 Update Non-Existent Student
```bash
curl -i -X PUT http://localhost:3001/students/fake-id-999 \
  -H "Content-Type: application/json" \
  -d '{"fullName": "Updated Name", "email": "updated@test.com", "age": 25}'
```

### 2.4 Delete Non-Existent Course
```bash
curl -i -X DELETE http://localhost:3002/courses/fake-course-id
```

### 2.5 Enroll with Non-Existent Student
```bash
curl -i -X POST http://localhost:3003/enrollments \
  -H "Content-Type: application/json" \
  -d '{"studentId": "fake-student-id", "courseId": "existing-course-id"}'
```

### 2.6 Enroll with Non-Existent Course
```bash
curl -i -X POST http://localhost:3003/enrollments \
  -H "Content-Type: application/json" \
  -d '{"studentId": "existing-student-id", "courseId": "fake-course-id"}'
```

---

## Test 3: 409 Conflict - Duplicate Resources

### 3.1 Create Student with Duplicate Email
```bash
# First create a student, then try to create another with same email
curl -i -X POST http://localhost:3001/students \
  -H "Content-Type: application/json" \
  -d '{"fullName": "Another John", "email": "john.doe@university.edu", "age": 22}'
```

### 3.2 Create Duplicate Enrollment
```bash
# First create an enrollment, then try to create the same enrollment again
curl -i -X POST http://localhost:3003/enrollments \
  -H "Content-Type: application/json" \
  -d '{"studentId": "existing-student-id", "courseId": "existing-course-id"}'
```

---

## Test 4: 503 Service Unavailable - Dependency Down 

Note: Services must be stopped first

### 4.1 Enrollment When Student Service is Down


```bash
curl -i -X POST http://localhost:3003/enrollments \
  -H "Content-Type: application/json" \
  -d '{"studentId": "any-id", "courseId": "any-course-id"}'
```

### 4.2 Enrollment When Course Service is Down

```bash
curl -i -X POST http://localhost:3003/enrollments \
  -H "Content-Type: application/json" \
  -d '{"studentId": "existing-student-id", "courseId": "any-course-id"}'
```

---

## Test 5: 504 Gateway Timeout - Slow Dependency

Note: Set a very short timeout: `$env:SERVICE_TIMEOUT = "100"`

### 5.1 Timeout When Dependency is Too Slow


```bash
curl -i -X POST http://localhost:3003/enrollments \
  -H "Content-Type: application/json" \
  -d '{"studentId": "existing-student-id", "courseId": "existing-course-id"}'
```

---

## Happy Path Tests

### Create Student (Success)
```bash
curl -i -X POST http://localhost:3001/students \
  -H "Content-Type: application/json" \
  -d '{"fullName": "Alice Smith", "email": "alice@university.edu", "age": 21}'
```

### Create Course (Success)
```bash
curl -i -X POST http://localhost:3002/courses \
  -H "Content-Type: application/json" \
  -d '{"name": "Database Systems", "description": "Introduction to databases", "credits": 4}'
```

### Create Enrollment (Success)
```bash
curl -i -X POST http://localhost:3003/enrollments \
  -H "Content-Type: application/json" \
  -d '{"studentId": "valid-student-id", "courseId": "valid-course-id"}'
```

### Get All Students
```bash
curl -i http://localhost:3001/students
```

### Get All Courses
```bash
curl -i http://localhost:3002/courses
```

### Get All Enrollments
```bash
curl -i http://localhost:3003/enrollments
```

---

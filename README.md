# Microservices Architecture - Student Course System

**Laboratory 2: Microservices Edge Case Testing (Curl-Based)**

This is the **Microservices** implementation of the Student Course System with comprehensive edge case handling and testing.


# Group Members:
- Badajos, Math Auric Ros D.
- Salazar, Shirley Ann M.
- Villalobos, Jon Nathaniel C.
- Yanson, Rea Nicole S.
- Zambra, Maika T.


## GitHub Deliverables

| Deliverable | Location | Description |
|-------------|----------|-------------|
| Source Code | `*-service/` folders | Complete microservice implementations |
| Setup Instructions | `README.md` | This file |
| Curl Commands | `tests/curl-tests.md` | All curl commands used for testing |
| Report | `docs/report.md` | Edge case explanations and reflections |
| Evidence | `docs/evidence/` | Curl output text files showing status codes |

## Services

| Service | Port | Description |
|---------|------|-------------|
| Student Service | 3001 | Manages student CRUD operations |
| Course Service | 3002 | Manages course CRUD operations |
| Enrollment Service | 3003 | Manages enrollments, validates via other services |
| API Gateway | 3000 | Unified entry point, routes to services |

## Quick Start

### 1. Install Dependencies (for each service)

```bash
# In each service directory
cd student-service && npm install
cd ../course-service && npm install
cd ../enrollment-service && npm install
cd ../api-gateway && npm install
```

Or run all at once from the Microservices_Architecture folder:

```powershell
# Windows PowerShell
cd student-service; npm install; cd ..
cd course-service; npm install; cd ..
cd enrollment-service; npm install; cd ..
cd api-gateway; npm install; cd ..
```

### 2. Start All Services (in separate terminals)

**Terminal 1 - Student Service:**
```bash
cd student-service
npm start
```

**Terminal 2 - Course Service:**
```bash
cd course-service
npm start
```

**Terminal 3 - Enrollment Service:**
```bash
cd enrollment-service
npm start
```

**Terminal 4 - API Gateway (Optional but recommended):**
```bash
cd api-gateway
npm start
```

### 3. Seed Sample Data

```bash
# From Microservices_Architecture folder
node seed.js
```


### Edge Cases Implemented

| HTTP Code | Error Type | Description |
|-----------|------------|-------------|
| 400 | Bad Request | Invalid or missing input fields |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate email or enrollment |
| 503 | Service Unavailable | Dependency service is down |
| 504 | Gateway Timeout | Dependency service too slow |

### Error Response Format

All errors follow this standardized format:
```json
{
  "error": "ERROR_CODE",
  "message": "Human readable explanation"
}
```

### Quick Test Examples (with -i flag)

**400 Bad Request - Missing Field:**
```bash
curl -i -X POST http://localhost:3001/students -H "Content-Type: application/json" -d '{"email": "test@test.com", "age": 20}'
```

**404 Not Found - Non-Existent Resource:**
```bash
curl -i http://localhost:3001/students/non-existent-id
```

**409 Conflict - Duplicate Enrollment:**
```bash
curl -i -X POST http://localhost:3003/enrollments -H "Content-Type: application/json" -d '{"studentId": "id", "courseId": "id"}'
```

**503 Service Unavailable - Stop Student Service, then:**
```bash
curl -i -X POST http://localhost:3003/enrollments -H "Content-Type: application/json" -d '{"studentId": "any", "courseId": "any"}'
```

For complete curl commands, see [tests/curl-tests.md](tests/curl-tests.md).

---

## Project Structure

```
Microservices_Architecture/
├── api-gateway/
│   ├── package.json
│   ├── server.js
│   └── public/
│       ├── index.html
│       ├── script.js
│       └── styles.css
├── student-service/
│   ├── package.json
│   └── server.js
├── course-service/
│   ├── package.json
│   └── server.js
├── enrollment-service/
│   ├── package.json
│   └── server.js
├── tests/
│   └── curl-tests.md         
├── docs/
│   ├── report.md             
│   └── evidence/             
│       └── README.md
├── seed.js
├── test-edge-cases.ps1       
└── README.md
```





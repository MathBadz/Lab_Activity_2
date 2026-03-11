# Evidence Folder

This folder contains curl output files demonstrating the HTTP status codes and JSON responses for each edge case test.


### 400 Bad Request Tests
- `400_missing_fullname.txt` - Missing required field
- `400_invalid_email.txt` - Invalid email format
- `400_invalid_age.txt` - Negative age value
- `400_missing_course_name.txt` - Missing course name
- `400_missing_studentId.txt` - Missing studentId in enrollment
- `400_empty_body.txt` - Empty request body

### 404 Not Found Tests
- `404_student_not_found.txt` - Non-existent student
- `404_course_not_found.txt` - Non-existent course
- `404_update_nonexistent_student.txt` - Update non-existent student
- `404_delete_nonexistent_course.txt` - Delete non-existent course
- `404_enroll_nonexistent_student.txt` - Enroll with fake student ID
- `404_enroll_nonexistent_course.txt` - Enroll with fake course ID
- `404_invalid_route.txt` - Invalid API route

### 409 Conflict Tests
- `409_duplicate_email.txt` - Duplicate student email
- `409_duplicate_enrollment.txt` - Duplicate enrollment

### 503 Service Unavailable Tests 
- `503_student_service_down.txt` - Created when Student Service is stopped

### 504 Gateway Timeout Tests 
- `504_gateway_timeout.txt` - Created when dependency is too slow

### Happy Path Tests
- `201_student_created.txt` - Successful student creation
- `201_course_created.txt` - Successful course creation
- `201_enrollment_created.txt` - Successful enrollment creation


Final contents of this folder:

- `201_student_created.txt`
- `201_course_created.txt`
- `201_enrollment_created.txt`
- `400_missing_fullname.txt`
- `400_invalid_email.txt`
- `400_invalid_age.txt`
- `400_missing_course_name.txt`
- `400_missing_studentId.txt`
- `400_empty_body.txt`
- `404_student_not_found.txt`
- `404_course_not_found.txt`
- `404_update_nonexistent_student.txt`
- `404_delete_nonexistent_course.txt`
- `404_enroll_nonexistent_student.txt`
- `404_enroll_nonexistent_course.txt`
- `404_invalid_route.txt`
- `409_duplicate_email.txt`
- `409_duplicate_enrollment.txt`
- `503_student_service_down.txt`
- `504_gateway_timeout.txt`


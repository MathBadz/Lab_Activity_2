/**
 * Seed Script for Microservices Architecture
 *
 * Run this after starting ALL services:
 *   node seed.js
 *
 * Make sure these services are running:
 *   - Student Service (PORT 3001)
 *   - Course Service (PORT 3002)
 *   - Enrollment Service (PORT 3003)
 *
 * This script sends HTTP requests to each service to create sample data.
 */

const STUDENT_SERVICE_URL = process.env.STUDENT_SERVICE_URL || 'http://localhost:3001';
const COURSE_SERVICE_URL = process.env.COURSE_SERVICE_URL || 'http://localhost:3002';
const ENROLLMENT_SERVICE_URL = process.env.ENROLLMENT_SERVICE_URL || 'http://localhost:3003';

// Sample students
const students = [
  { fullName: 'Maria Santos', email: 'maria.santos@email.com', age: 20 },
  { fullName: 'Juan Dela Cruz', email: 'juan.delacruz@email.com', age: 22 },
  { fullName: 'Ana Reyes', email: 'ana.reyes@email.com', age: 19 },
  { fullName: 'Carlos Garcia', email: 'carlos.garcia@email.com', age: 21 },
];

// Sample courses
const courses = [
  { name: 'Introduction to Computer Science', description: 'Fundamentals of computing and programming', credits: 3 },
  { name: 'Data Structures', description: 'Arrays, linked lists, trees, graphs, and algorithms', credits: 3 },
  { name: 'Web Development', description: 'HTML, CSS, JavaScript, and modern frameworks', credits: 4 },
  { name: 'Database Management', description: 'SQL, NoSQL, and database design principles', credits: 3 },
];

async function postJSON(url, data) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

async function checkService(name, url) {
  try {
    const response = await fetch(`${url}/health`);
    if (response.ok) {
      console.log(`  ✓ ${name} is running`);
      return true;
    }
    return false;
  } catch (error) {
    console.log(`  ✗ ${name} is NOT running`);
    return false;
  }
}

async function seed() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     Microservices Seed Script                              ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Check if all services are running
  console.log('Checking service availability...\n');
  const studentServiceUp = await checkService('Student Service (3001)', STUDENT_SERVICE_URL);
  const courseServiceUp = await checkService('Course Service (3002)', COURSE_SERVICE_URL);
  const enrollmentServiceUp = await checkService('Enrollment Service (3003)', ENROLLMENT_SERVICE_URL);

  if (!studentServiceUp || !courseServiceUp || !enrollmentServiceUp) {
    console.log('\n❌ Please start all services before running the seed script.');
    console.log('\nTo start all services, run in separate terminals:');
    console.log('  cd student-service && npm start');
    console.log('  cd course-service && npm start');
    console.log('  cd enrollment-service && npm start');
    process.exit(1);
  }

  console.log('\n✓ All services are running!\n');
  console.log('═'.repeat(60));

  // Create students via Student Service
  console.log('\n📚 Creating Students (via Student Service)...\n');
  const createdStudents = [];
  for (const student of students) {
    try {
      const result = await postJSON(`${STUDENT_SERVICE_URL}/students`, student);
      if (result.data) {
        console.log(`  ✓ Created: ${result.data.fullName} (ID: ${result.data.id})`);
        createdStudents.push(result.data);
      } else {
        console.log(`  ⚠ Skipped: ${student.fullName} - ${result.error}`);
      }
    } catch (error) {
      console.log(`  ✗ Error: ${student.fullName} - ${error.message}`);
    }
  }

  // Create courses via Course Service
  console.log('\n📖 Creating Courses (via Course Service)...\n');
  const createdCourses = [];
  for (const course of courses) {
    try {
      const result = await postJSON(`${COURSE_SERVICE_URL}/courses`, course);
      if (result.data) {
        console.log(`  ✓ Created: ${result.data.name} (ID: ${result.data.id})`);
        createdCourses.push(result.data);
      } else {
        console.log(`  ⚠ Skipped: ${course.name} - ${result.error}`);
      }
    } catch (error) {
      console.log(`  ✗ Error: ${course.name} - ${error.message}`);
    }
  }

  // Create enrollments via Enrollment Service
  // This demonstrates inter-service communication:
  // Enrollment Service calls Student Service and Course Service to validate
  console.log('\n🔗 Creating Enrollments (via Enrollment Service)...\n');
  console.log('   (Enrollment Service validates by calling Student & Course Services)\n');

  const enrollmentPairs = [
    [0, 0], // Maria -> Intro to CS
    [0, 2], // Maria -> Web Dev
    [1, 0], // Juan -> Intro to CS
    [1, 1], // Juan -> Data Structures
    [2, 1], // Ana -> Data Structures
    [2, 3], // Ana -> Database Management
    [3, 2], // Carlos -> Web Dev
    [3, 3], // Carlos -> Database Management
  ];

  for (const [si, ci] of enrollmentPairs) {
    if (createdStudents[si] && createdCourses[ci]) {
      try {
        const result = await postJSON(`${ENROLLMENT_SERVICE_URL}/enrollments`, {
          studentId: createdStudents[si].id,
          courseId: createdCourses[ci].id,
        });
        if (result.data) {
          console.log(`  ✓ Enrolled: ${createdStudents[si].fullName} -> ${createdCourses[ci].name}`);
        } else {
          console.log(`  ⚠ Skipped: ${result.error}`);
        }
      } catch (error) {
        console.log(`  ✗ Error: ${error.message}`);
      }
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('\n✅ Seed complete!\n');
  console.log('You can now test the API through the gateway or individual services:\n');
  console.log('  API Gateway:        http://localhost:3000');
  console.log('  Student Service:    http://localhost:3001/students');
  console.log('  Course Service:     http://localhost:3002/courses');
  console.log('  Enrollment Service: http://localhost:3003/enrollments');
  console.log();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});

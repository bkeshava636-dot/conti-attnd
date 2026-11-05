const fs = require('fs');
const path = require('path');
const { JSDOM } = require('../backend/node_modules/jsdom');
const { extractAllStudents } = require('../extension/content.js');

async function runTests() {
  console.log('====================================================');
  console.log('  RUNNING CONTINEO DOM EXTRACTION TEST SUITE');
  console.log('====================================================');

  const fixturePath = path.join(__dirname, '..', 'test-fixtures', 'contineo-sims-fixture.html');
  const htmlContent = fs.readFileSync(fixturePath, 'utf8');

  // Load in JSDOM with scripts enabled to execute the student generator script in fixture
  const dom = new JSDOM(htmlContent, {
    runScripts: 'dangerously',
    resources: 'usable'
  });

  const doc = dom.window.document;

  console.log('\n[Test 1] Testing DOM extraction on Contineo SIMS fixture...');
  const report = extractAllStudents(doc);

  console.log(`- Page Title: "${report.pageTitle}"`);
  console.log(`- Total Students Detected: ${report.totalDetected}`);
  console.log(`- Warnings: ${report.warnings.length}`);
  console.log(`- Errors: ${report.errors.length}`, report.errors.slice(0, 3));

  if (report.totalDetected !== 22) {
    console.error(`❌ FAIL: Expected 22 students, but detected ${report.totalDetected}`);
    process.exit(1);
  } else {
    console.log('✅ PASS: Exactly 22 students successfully detected!');
  }

  console.log('\n[Test 2] Verifying Student 1 (A VEDHA SHREE - 3BR23CS001)...');
  const student1 = report.students.find(s => s.usn === '3BR23CS001');
  if (!student1) {
    console.error('❌ FAIL: Student 3BR23CS001 not found in extraction');
    process.exit(1);
  }

  console.log(`- Name: ${student1.name}`);
  console.log(`- USN: ${student1.usn}`);
  console.log(`- Total Subjects: ${student1.subjects.length}`);
  console.log(`- Overall Average: ${student1.overallPercentage}%`);

  if (student1.subjects.length !== 10) {
    console.error(`❌ FAIL: Expected 10 subjects, found ${student1.subjects.length}`);
    process.exit(1);
  }

  // Check specific subjects from screenshot
  const math = student1.subjects.find(s => s.course_code === '1BMCS301');
  const ds = student1.subjects.find(s => s.course_code === '1BCS302');
  const lab = student1.subjects.find(s => s.course_code === '1BCS306L');
  const project = student1.subjects.find(s => s.course_code === '1BCSCP310');

  console.log(`  * 1BMCS301 Attendance: ${math?.attendance_percentage}% (Expected: 91%)`);
  console.log(`  * 1BCS302 Attendance: ${ds?.attendance_percentage}% (Expected: 95%)`);
  console.log(`  * 1BCS306L Attendance: ${lab?.attendance_percentage}% (Expected: 100%)`);
  console.log(`  * 1BCSCP310 Attendance: ${project?.attendance_percentage}% (Expected: 60%)`);

  if (math?.attendance_percentage !== 91 || ds?.attendance_percentage !== 95 || lab?.attendance_percentage !== 100 || project?.attendance_percentage !== 60) {
    console.error('❌ FAIL: Subject attendance percentage mismatch!');
    process.exit(1);
  }
  console.log('✅ PASS: Student 1 exact percentages verified matching screenshot!');

  console.log('\n[Test 3] Verifying Student 2 (MANIDEEP M - 3BR23CS002)...');
  const student2 = report.students.find(s => s.usn === '3BR23CS002');
  if (!student2) {
    console.error('❌ FAIL: Student 3BR23CS002 not found in extraction');
    process.exit(1);
  }
  console.log(`- Name: ${student2.name}`);
  console.log(`- USN: ${student2.usn}`);
  console.log(`- Overall Average: ${student2.overallPercentage}%`);
  const s2math = student2.subjects.find(s => s.course_code === '1BMCS301');
  console.log(`  * 1BMCS301 Attendance: ${s2math?.attendance_percentage}% (Expected: 95%)`);
  if (s2math?.attendance_percentage !== 95) {
    console.error('❌ FAIL: Student 2 attendance mismatch');
    process.exit(1);
  }
  console.log('✅ PASS: Student 2 exact percentages verified!');

  console.log('\n[Test 4] Verifying all 22 students data integrity...');
  let totalCoursesExtracted = 0;
  report.students.forEach((st, i) => {
    totalCoursesExtracted += st.subjects.length;
    if (!st.usn.startsWith('3BR23CS')) {
      console.error(`❌ FAIL: Invalid USN format on student index ${i}: ${st.usn}`);
      process.exit(1);
    }
    st.subjects.forEach(sub => {
      if (sub.attendance_percentage < 0 || sub.attendance_percentage > 100) {
        console.error(`❌ FAIL: Attendance out of bounds: ${sub.attendance_percentage}% on ${sub.course_code}`);
        process.exit(1);
      }
    });
  });

  console.log(`- Total valid subject entries extracted across 22 students: ${totalCoursesExtracted}`);
  console.log('✅ PASS: Complete batch integrity verified! 100% clean data.');

  console.log('\n====================================================');
  console.log('  ALL 4 TEST SUITES PASSED (0 ERRORS)');
  console.log('====================================================');
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});

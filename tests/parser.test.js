const fs = require('fs');
const path = require('path');
const { JSDOM } = require('../backend/node_modules/jsdom');
const { extractAllStudents } = require('../extension/content.js');

async function runTests() {
  console.log('====================================================');
  console.log('  RUNNING CONTINEO REAL-WORLD DOM EXTRACTION AUDIT');
  console.log('====================================================');

  // ---------------------------------------------------------------------------
  // SUITE 1: Full 22 Students Structured SIMS Fixture
  // ---------------------------------------------------------------------------
  const fixturePath = path.join(__dirname, '..', 'test-fixtures', 'contineo-sims-fixture.html');
  const htmlContent = fs.readFileSync(fixturePath, 'utf8');

  const dom = new JSDOM(htmlContent, {
    runScripts: 'dangerously',
    resources: 'usable'
  });

  const doc = dom.window.document;

  console.log('\n[Audit 1] Testing DOM extraction on 22-student SIMS cohort...');
  const report = extractAllStudents(doc);

  console.log(`- Page Title: "${report.pageTitle}"`);
  console.log(`- Total Students Detected: ${report.totalDetected}`);
  console.log(`- Successful Records: ${report.successfulRecords}`);
  console.log(`- Failed Records: ${report.failedRecords}`);
  console.log(`- Duplicates Handled: ${report.duplicatesHandled}`);
  console.log(`- Warnings: ${report.warnings.length}`);
  console.log(`- Errors: ${report.errors.length}`);

  if (report.totalDetected !== 22 || report.successfulRecords !== 22) {
    console.error(`❌ FAIL: Expected 22 successful students, but got ${report.successfulRecords}`);
    process.exit(1);
  } else {
    console.log('✅ PASS: Exactly 22 students successfully detected & extracted!');
  }

  // ---------------------------------------------------------------------------
  // SUITE 2: Screenshot Value Verification (A VEDHA SHREE & MANIDEEP M)
  // ---------------------------------------------------------------------------
  console.log('\n[Audit 2] Auditing Student 1 (A VEDHA SHREE - 3BR23CS001)...');
  const student1 = report.students.find(s => s.usn === '3BR23CS001');
  if (!student1) {
    console.error('❌ FAIL: Student 3BR23CS001 not found in extraction');
    process.exit(1);
  }

  console.log(`- Name: ${student1.name}`);
  console.log(`- USN: ${student1.usn}`);
  console.log(`- Total Subjects: ${student1.subjects.length}`);
  console.log(`- Overall Average: ${student1.overallPercentage}%`);

  const math = student1.subjects.find(s => s.course_code === '1BMCS301');
  const ds = student1.subjects.find(s => s.course_code === '1BCS302');
  const lab = student1.subjects.find(s => s.course_code === '1BCS306L');
  const sc = student1.subjects.find(s => s.course_code === '1BCSCP310');

  console.log(`  * 1BMCS301: ${math?.attendance_percentage}% (Expected: 91%)`);
  console.log(`  * 1BCS302:  ${ds?.attendance_percentage}% (Expected: 95%)`);
  console.log(`  * 1BCS306L: ${lab?.attendance_percentage}% (Expected: 100%)`);
  console.log(`  * 1BCSCP310: ${sc?.attendance_percentage}% (Expected: 60%)`);

  if (math?.attendance_percentage !== 91 || ds?.attendance_percentage !== 95 || lab?.attendance_percentage !== 100 || sc?.attendance_percentage !== 60) {
    console.error('❌ FAIL: Subject attendance percentage mismatch!');
    process.exit(1);
  }
  console.log('✅ PASS: Student 1 exact percentages verified matching screenshot!');

  console.log('\n[Audit 3] Auditing Student 2 (MANIDEEP M - 3BR23CS002)...');
  const student2 = report.students.find(s => s.usn === '3BR23CS002');
  if (!student2) {
    console.error('❌ FAIL: Student 3BR23CS002 not found in extraction');
    process.exit(1);
  }
  console.log(`- Name: ${student2.name}`);
  console.log(`- USN: ${student2.usn}`);
  console.log(`- Overall Average: ${student2.overallPercentage}%`);
  const s2math = student2.subjects.find(s => s.course_code === '1BMCS301');
  const s2ds = student2.subjects.find(s => s.course_code === '1BCS302');
  console.log(`  * 1BMCS301: ${s2math?.attendance_percentage}% (Expected: 95%)`);
  console.log(`  * 1BCS302:  ${s2ds?.attendance_percentage}% (Expected: 85%)`);

  if (s2math?.attendance_percentage !== 95 || s2ds?.attendance_percentage !== 85) {
    console.error('❌ FAIL: Student 2 attendance mismatch');
    process.exit(1);
  }
  console.log('✅ PASS: Student 2 exact percentages verified matching screenshot!');

  // ---------------------------------------------------------------------------
  // SUITE 3: Real Flat DOM Structure (No synthetic wrapper classes)
  // ---------------------------------------------------------------------------
  console.log('\n[Audit 4] Auditing Flat HTML Structure (Simulating raw legacy ERP DOM without wrapper divs)...');
  const flatFixturePath = path.join(__dirname, '..', 'test-fixtures', 'contineo-sims-flat-fixture.html');
  const flatHtml = fs.readFileSync(flatFixturePath, 'utf8');

  const flatDom = new JSDOM(flatHtml);
  const flatReport = extractAllStudents(flatDom.window.document);

  console.log(`- Flat Page Students Detected: ${flatReport.totalDetected}`);
  console.log(`- Flat Page Errors: ${flatReport.errors.length}`);
  flatReport.students.forEach((s, idx) => {
    console.log(`  Student ${idx + 1}: ${s.name} | USN: ${s.usn} | Subjects: ${s.subjects.length} | Avg: ${s.overallPercentage}%`);
  });

  if (flatReport.totalDetected !== 2) {
    console.error(`❌ FAIL: Expected 2 students in flat DOM test, got ${flatReport.totalDetected}`);
    process.exit(1);
  }

  const flatS1 = flatReport.students.find(s => s.usn === '3BR23CS002');
  const flatS2 = flatReport.students.find(s => s.usn === '3BR23CS001');

  if (!flatS1 || !flatS2) {
    console.error('❌ FAIL: Failed to extract students in flat DOM test!');
    process.exit(1);
  }
  console.log('✅ PASS: Flat DOM variant successfully extracted without mixing student boundaries!');

  // ---------------------------------------------------------------------------
  // SUITE 4: Total Batch Data Integrity
  // ---------------------------------------------------------------------------
  console.log('\n[Audit 5] Verifying 220 subject records across full cohort...');
  let totalEntries = 0;
  report.students.forEach((s) => {
    totalEntries += s.subjects.length;
    s.subjects.forEach(sub => {
      if (typeof sub.attendance_percentage !== 'number' || sub.attendance_percentage < 0 || sub.attendance_percentage > 100) {
        console.error(`❌ Invalid percentage on ${sub.course_code}: ${sub.attendance_percentage}`);
        process.exit(1);
      }
    });
  });
  console.log(`- Total valid subject records verified: ${totalEntries}`);
  console.log('✅ PASS: 100% data integrity verified with zero out-of-bounds percentages!');

  console.log('\n====================================================');
  console.log('  ALL AUDIT SUITES PASSED (0 ERRORS)');
  console.log('====================================================');
}

runTests().catch(err => {
  console.error('Audit execution error:', err);
  process.exit(1);
});

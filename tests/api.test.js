const repo = require('../backend/src/db/repository');
const { extractAllStudents } = require('../extension/content');
const { JSDOM } = require('../backend/node_modules/jsdom');
const fs = require('fs');
const path = require('path');

async function testBackend() {
  console.log('====================================================');
  console.log('  RUNNING BACKEND & DATABASE INTEGRATION TESTS');
  console.log('====================================================');

  // 1. Extract 22 students from fixture
  const fixturePath = path.join(__dirname, '..', 'test-fixtures', 'contineo-sims-fixture.html');
  const html = fs.readFileSync(fixturePath, 'utf8');
  const dom = new JSDOM(html, { runScripts: 'dangerously' });
  const { students } = extractAllStudents(dom.window.document);

  console.log(`\n[Test 1] Ingesting batch of ${students.length} extracted student records...`);
  const publishResult = await repo.saveAttendanceBatch({
    proctorId: 'proctor-bitm-cse-01',
    semester: 'SEM03',
    academicPeriod: '2026-27 ODD',
    students
  });

  console.log(`- Mode: ${publishResult.mode}`);
  console.log(`- Processed: ${publishResult.totalProcessed}`);
  console.log(`- Successful: ${publishResult.successfulRecords}`);
  console.log(`- Failed: ${publishResult.failedRecords}`);

  if (publishResult.successfulRecords !== 22) {
    console.error('❌ Ingestion failed to record 22 students');
    process.exit(1);
  }
  console.log('✅ PASS: Batch successfully written to database!');

  // 2. Fetch single student
  console.log('\n[Test 2] Querying student attendance for 3BR23CS001...');
  const st1 = await repo.getStudentAttendance('3BR23CS001');
  if (!st1 || !st1.student) {
    console.error('❌ Student 3BR23CS001 not returned');
    process.exit(1);
  }

  console.log(`- Student: ${st1.student.name} (${st1.student.usn})`);
  console.log(`- Overall: ${st1.overall_percentage}% (${st1.overall_status})`);
  console.log(`- Subjects: ${st1.subjects.length}`);

  if (st1.subjects.length !== 10) {
    console.error('❌ Expected 10 subjects');
    process.exit(1);
  }
  console.log('✅ PASS: Student attendance queried and verified!');

  // 3. Test re-ingestion idempotency (prevent duplicates)
  console.log('\n[Test 3] Testing re-ingestion idempotency (proctor clicking again)...');
  const reingest = await repo.saveAttendanceBatch({
    proctorId: 'proctor-bitm-cse-01',
    semester: 'SEM03',
    academicPeriod: '2026-27 ODD',
    students
  });

  console.log(`- Duplicates Handled: ${reingest.duplicatesHandled}`);
  console.log(`- Successful: ${reingest.successfulRecords}`);
  console.log(`- Failed: ${reingest.failedRecords}`);

  if (reingest.failedRecords > 0) {
    console.error('❌ Re-ingestion produced failures!');
    process.exit(1);
  }
  console.log('✅ PASS: Re-ingestion successfully updated records without duplicate violations!');

  // 4. Test proctor roster
  console.log('\n[Test 4] Querying Proctor Student Roster...');
  const roster = await repo.getProctorRoster('proctor-bitm-cse-01');
  console.log(`- Total students in roster: ${roster.length}`);
  if (roster.length !== 22) {
    console.error('❌ Roster count mismatch');
    process.exit(1);
  }
  console.log('✅ PASS: Proctor roster has all 22 students!');

  // 5. Test import audit log
  console.log('\n[Test 5] Querying Proctor Import Audit Trail...');
  const imports = await repo.getImportsHistory();
  console.log(`- Total logged imports: ${imports.length}`);
  if (imports.length < 2) {
    console.error('❌ Import history missing audit entries');
    process.exit(1);
  }
  console.log('✅ PASS: Audit trail accurately recorded both extraction runs!');

  console.log('\n====================================================');
  console.log('  ALL INTEGRATION TESTS PASSED (0 ERRORS)');
  console.log('====================================================');
}

testBackend().catch(err => {
  console.error('API Test Error:', err);
  process.exit(1);
});

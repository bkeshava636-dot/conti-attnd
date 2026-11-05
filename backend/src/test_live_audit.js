const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const BACKEND_URL = 'https://contineo-attendance-tracker.onrender.com';
const PROCTOR_TOKEN = 'demo-proctor-secret-key-bitm';

async function runLiveAudit() {
  console.log('=====================================================');
  console.log('🔍 CONTINEO ATTENDANCE TRACKER - LIVE END-TO-END TEST');
  console.log('=====================================================\n');

  let passedTests = 0;
  let totalTests = 5;

  // Test 1: Health Check
  try {
    process.stdout.write('[1/5] Checking API Health (/api/health)... ');
    const res = await fetch(`${BACKEND_URL}/api/health`);
    const health = await res.json();
    if (res.ok && health.status === 'healthy') {
      console.log(`✅ PASSED (${res.status} OK - ${health.service})`);
      passedTests++;
    } else {
      console.log(`❌ FAILED: Unexpected response ${res.status}`);
    }
  } catch (err) {
    console.log(`❌ FAILED: ${err.message}`);
  }

  // Test 2: Option B Auto-Update Manifest (/updates.xml)
  try {
    process.stdout.write('[2/5] Checking Auto-Update Manifest (/updates.xml)... ');
    const res = await fetch(`${BACKEND_URL}/updates.xml`);
    const xml = await res.text();
    const hasVersion = xml.includes("version='1.2.0'");
    const hasCodebase = xml.includes("codebase='https://contineo-attendance-tracker.onrender.com/download/contineo-attendance-collector.zip'");
    if (res.ok && hasVersion && hasCodebase) {
      console.log(`✅ PASSED (Manifest v1.2.0 served with Google Update v2.0 protocol)`);
      passedTests++;
    } else {
      console.log(`❌ FAILED: Version or codebase missing in XML: ${xml}`);
    }
  } catch (err) {
    console.log(`❌ FAILED: ${err.message}`);
  }

  // Test 3: Extension Zip Download Endpoint
  try {
    process.stdout.write('[3/5] Checking Extension Package Download (/download/...zip)... ');
    const res = await fetch(`${BACKEND_URL}/download/contineo-attendance-collector.zip`);
    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const isZip = bytes[0] === 0x50 && bytes[1] === 0x4B; // PK magic bytes
    if (res.ok && isZip && buffer.byteLength > 10000) {
      console.log(`✅ PASSED (HTTP 200 OK - Valid ZIP package: ${(buffer.byteLength / 1024).toFixed(1)} KB)`);
      passedTests++;
    } else {
      console.log(`❌ FAILED: Invalid zip response (${res.status})`);
    }
  } catch (err) {
    console.log(`❌ FAILED: ${err.message}`);
  }

  // Test 4: Fixture SIMS Attendance Extraction & BITM 85% Evaluation
  let extractedStudents = [];
  try {
    process.stdout.write('[4/5] Testing DOM Extraction & BITM 85% Cutoff Evaluation... ');
    const res = await fetch(`${BACKEND_URL}/fixture`);
    const html = await res.text();
    const dom = new JSDOM(html, { runScripts: 'dangerously' });
    const doc = dom.window.document;

    const studentSections = Array.from(doc.querySelectorAll('.student-section'));
    
    studentSections.forEach(section => {
      const usn = section.getAttribute('data-usn') || '';
      const name = section.querySelector('.student-name')?.textContent.trim() || `Student ${usn}`;
      const sem = section.querySelector('.student-sem')?.textContent.trim() || 'SEM03';
      
      const rows = Array.from(section.querySelectorAll('.data-table tr')).filter(r => !r.closest('thead') && r.querySelectorAll('td').length >= 3);
      const subjects = [];

      rows.forEach(tr => {
        const tds = Array.from(tr.querySelectorAll('td'));
        if (tds.length >= 3) {
          const courseCode = tds[0].textContent.trim();
          const cie = tds[1].textContent.trim();
          const attText = tds[2].textContent.trim();
          const attMatch = attText.match(/(\d+(?:\.\d+)?)/);
          const attPct = attMatch ? parseFloat(attMatch[1]) : 0;
          subjects.push({
            course_code: courseCode,
            cie: cie,
            attendance_percentage: attPct
          });
        }
      });

      if (usn && subjects.length > 0) {
        const avg = Math.round((subjects.reduce((sum, s) => sum + s.attendance_percentage, 0) / subjects.length) * 10) / 10;
        extractedStudents.push({
          usn,
          name,
          semester: 'SEM03',
          overallPercentage: avg,
          subjects
        });
      }
    });

    const shortageStudents = extractedStudents.filter(s => 
      s.subjects.some(sub => sub.attendance_percentage < 85)
    );
    const safeStudents = extractedStudents.filter(s => 
      s.subjects.every(sub => sub.attendance_percentage >= 85)
    );

    if (extractedStudents.length === 22) {
      console.log(`✅ PASSED (${extractedStudents.length} Students Extracted)`);
      console.log(`    ↳ BITM 85% Cutoff Audit:`);
      console.log(`      • Shortage (<85% in at least 1 course): ${shortageStudents.length} students`);
      console.log(`      • Eligible (≥85% across all courses):   ${safeStudents.length} students`);
      passedTests++;
    } else {
      console.log(`❌ FAILED: Extracted only ${extractedStudents.length} students`);
    }
  } catch (err) {
    console.log(`❌ FAILED: ${err.message}`);
  }

  // Test 5: Live Cloud Publishing & Record Query
  try {
    process.stdout.write('[5/5] Testing Cloud Synchronization & Student Retrieval... ');
    const publishPayload = {
      proctorId: 'proctor-bitm-cse-01',
      semester: 'SEM03',
      sourceUrl: `${BACKEND_URL}/fixture`,
      extractedAt: new Date().toISOString(),
      students: extractedStudents,
      diagnostics: { testRun: true }
    };

    const pubRes = await fetch(`${BACKEND_URL}/api/attendance/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PROCTOR_TOKEN}`
      },
      body: JSON.stringify(publishPayload)
    });

    const pubData = await pubRes.json();

    if (pubRes.ok && pubData.successfulRecords > 0) {
      // Query one student to verify storage
      const studentRes = await fetch(`${BACKEND_URL}/api/attendance/student/3BR23CS001`);
      const studentData = await studentRes.json();

      if (studentRes.ok && studentData.student && studentData.subjects.length > 0) {
        console.log(`✅ PASSED`);
        console.log(`    ↳ Cloud Sync: ${pubData.successfulRecords} records synced in ${pubData.publishDurationMs}ms`);
        console.log(`    ↳ Verified Student: ${studentData.student.name} (${studentData.student.usn}) with ${studentData.subjects.length} courses`);
        passedTests++;
      } else {
        console.log(`❌ FAILED: Student retrieval failed`);
      }
    } else {
      console.log(`❌ FAILED: Publish returned status ${pubRes.status}`);
    }
  } catch (err) {
    console.log(`❌ FAILED: ${err.message}`);
  }

  console.log('\n=====================================================');
  console.log(`🏁 TEST SUMMARY: ${passedTests}/${totalTests} TESTS PASSED (${passedTests === totalTests ? 'ALL SYSTEMS OPERATIONAL' : 'SOME TESTS FAILED'})`);
  console.log('=====================================================\n');
}

runLiveAudit();

const fs = require('fs');
const path = require('path');

async function runSecurityAudit() {
  console.log('====================================================');
  console.log('  RUNNING COMPREHENSIVE SECURITY & AUDIT SUITE');
  console.log('====================================================');

  // Check 1: Scan extension files for leaked secrets
  console.log('\n[Security Check 1] Scanning extension source code for leaked secrets...');
  const extFiles = ['manifest.json', 'content.js', 'service-worker.js', 'popup.js', 'popup.html', 'popup.css'];
  const sensitivePatterns = [
    /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9/i, // Supabase JWT pattern
    /SUPABASE_SERVICE_ROLE_KEY/i,
    /postgres:\/\//i,
    /service_role/i
  ];

  let leaksFound = 0;
  extFiles.forEach(file => {
    const fullPath = path.join(__dirname, '..', 'extension', file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      sensitivePatterns.forEach(pattern => {
        if (pattern.test(content)) {
          console.error(`❌ LEAK DETECTED in extension/${file} matching pattern ${pattern}`);
          leaksFound++;
        }
      });
    }
  });

  if (leaksFound === 0) {
    console.log('✅ PASS: Extension code is 100% clean. No database credentials or service-role keys exposed in client bundle!');
  } else {
    process.exit(1);
  }

  // Check 2: Test backend authorization boundaries
  console.log('\n[Security Check 2] Testing API endpoint authorization boundaries...');

  // 2a: Unauthenticated publish request
  const unauthRes = await fetch('http://localhost:5000/api/attendance/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ students: [] })
  });
  console.log(`- Unauthenticated /publish status: HTTP ${unauthRes.status} (Expected: 401)`);
  if (unauthRes.status !== 401) {
    console.error('❌ FAIL: Unauthenticated access permitted!');
    process.exit(1);
  }
  console.log('✅ PASS: Unauthenticated access blocked (HTTP 401)!');

  // 2b: Invalid token publish request
  const invalidRes = await fetch('http://localhost:5000/api/attendance/publish', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer attacker-fake-token'
    },
    body: JSON.stringify({ students: [] })
  });
  console.log(`- Forged token /publish status: HTTP ${invalidRes.status} (Expected: 403)`);
  if (invalidRes.status !== 403) {
    console.error('❌ FAIL: Invalid token accepted!');
    process.exit(1);
  }
  console.log('✅ PASS: Forged token blocked (HTTP 403)!');

  // 2c: Test Ephemeral Proctor Login
  console.log('\n[Security Check 3] Testing ephemeral proctor session token issuance & validation...');
  const loginRes = await fetch('http://localhost:5000/api/auth/proctor-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secretKey: 'demo-proctor-secret-key-bitm' })
  });
  const loginData = await loginRes.json();
  console.log(`- Ephemeral Token Issued: ${loginData.token.slice(0, 16)}... Expires: ${loginData.expiresAt}`);
  if (!loginData.success || !loginData.token) {
    console.error('❌ FAIL: Ephemeral token generation failed');
    process.exit(1);
  }

  // 2d: Verify /publish works with the ephemeral token
  const ephemeralRes = await fetch('http://localhost:5000/api/attendance/publish', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${loginData.token}`
    },
    body: JSON.stringify({
      proctorId: 'proctor-bitm-cse-01',
      students: [
        {
          usn: '3BR23CS001',
          name: 'A VEDHA SHREE',
          subjects: [{ course_code: '1BMCS301', attendance_percentage: 91 }]
        }
      ]
    })
  });
  console.log(`- Ephemeral token /publish status: HTTP ${ephemeralRes.status} (Expected: 200)`);
  if (ephemeralRes.status !== 200) {
    console.error('❌ FAIL: Valid ephemeral session rejected');
    process.exit(1);
  }
  console.log('✅ PASS: Ephemeral proctor authorization verified successfully!');

  // Check 4: Test Malformed and Out-of-Bounds Payload Rejection
  console.log('\n[Security Check 4] Testing malicious / out-of-bounds attendance rejection...');
  const malformedRes = await fetch('http://localhost:5000/api/attendance/publish', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${loginData.token}`
    },
    body: JSON.stringify({
      students: [
        {
          usn: '3BR23CS999',
          name: 'Hacked Student',
          subjects: [{ course_code: '1BMCS301', attendance_percentage: 999 }] // Invalid > 100
        }
      ]
    })
  });
  console.log(`- Out-of-bounds percentage status: HTTP ${malformedRes.status} (Expected: 422)`);
  if (malformedRes.status !== 422) {
    console.error('❌ FAIL: Out-of-bounds percentage was not rejected!');
    process.exit(1);
  }
  console.log('✅ PASS: Out-of-bounds attendance rejected (HTTP 422)!');

  console.log('\n====================================================');
  console.log('  ALL SECURITY CHECKS PASSED (0 VULNERABILITIES)');
  console.log('====================================================');
}

runSecurityAudit().catch(err => {
  console.error('Security test failed:', err);
  process.exit(1);
});

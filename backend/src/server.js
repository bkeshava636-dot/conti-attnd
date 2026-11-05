require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const repo = require('./db/repository');

const app = express();
const PORT = process.env.PORT || 5000;
const PROCTOR_SECRET_KEY = process.env.PROCTOR_SECRET_KEY || 'demo-proctor-secret-key-bitm';

// Middlewares
app.use(cors({
  origin: '*', // Allow extension popups, localhost frontend, etc.
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));

// Serve static test fixture for easy local testing
app.use('/test-fixtures', express.static(path.join(__dirname, '..', '..', 'test-fixtures')));
app.get('/fixture', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'test-fixtures', 'contineo-sims-fixture.html'));
});

// Optionally serve production frontend build if dist exists
const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');
if (require('fs').existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
}

// Middleware for Proctor Authentication
function requireProctorAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized: Missing Authorization header' });
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (token !== PROCTOR_SECRET_KEY) {
    return res.status(403).json({ error: 'Forbidden: Invalid proctor security key' });
  }
  next();
}

// -----------------------------------------------------------------------------
// Health Check
// -----------------------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Contineo Attendance API',
    databaseMode: repo.useSupabase ? 'supabase-postgresql' : 'local-json-store',
    timestamp: new Date().toISOString()
  });
});

// -----------------------------------------------------------------------------
// ONE-CLICK ATTENDANCE PUBLISH (Invoked by Chrome Extension)
// -----------------------------------------------------------------------------
app.post('/api/attendance/publish', requireProctorAuth, async (req, res) => {
  try {
    const { proctorId = 'proctor-bitm-cse-01', semester = 'SEM03', academicPeriod = '2026-27 ODD', students } = req.body;

    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        error: 'Invalid Payload',
        message: 'No student attendance records provided in request payload.'
      });
    }

    // Server-side strict data validation
    const validatedStudents = [];
    const validationErrors = [];

    students.forEach((st, idx) => {
      if (!st.usn || typeof st.usn !== 'string') {
        validationErrors.push({ index: idx, error: 'Student missing USN' });
        return;
      }

      const cleanUSN = st.usn.trim().toUpperCase();
      if (!st.subjects || !Array.isArray(st.subjects) || st.subjects.length === 0) {
        validationErrors.push({ usn: cleanUSN, error: 'No subjects listed for student' });
        return;
      }

      // Validate each subject
      const validSubjects = [];
      for (const sub of st.subjects) {
        if (!sub.course_code) continue;
        const pct = parseFloat(sub.attendance_percentage);
        if (isNaN(pct) || pct < 0 || pct > 100) {
          validationErrors.push({ usn: cleanUSN, error: `Invalid percentage (${sub.attendance_percentage}) for course ${sub.course_code}` });
          continue;
        }
        validSubjects.push({
          course_code: sub.course_code.trim().toUpperCase(),
          cie: sub.cie || 'N/A',
          attendance_percentage: Math.round(pct * 10) / 10
        });
      }

      if (validSubjects.length > 0) {
        validatedStudents.push({
          usn: cleanUSN,
          name: st.name?.trim() || `Student ${cleanUSN}`,
          semester: st.semester || semester,
          subjects: validSubjects
        });
      }
    });

    if (validatedStudents.length === 0) {
      return res.status(422).json({
        error: 'Validation Failed',
        message: 'All student records failed validation criteria.',
        errors: validationErrors
      });
    }

    // Save batch to database / repository
    const result = await repo.saveAttendanceBatch({
      proctorId,
      semester,
      academicPeriod,
      students: validatedStudents
    });

    return res.json({
      success: true,
      message: `Successfully processed ${result.successfulRecords} student attendance records.`,
      ...result,
      validationWarnings: validationErrors
    });

  } catch (err) {
    console.error('[API Error /publish]:', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: err.message
    });
  }
});

// -----------------------------------------------------------------------------
// STUDENT ATTENDANCE LOOKUP
// -----------------------------------------------------------------------------
app.get('/api/attendance/student/:usn', async (req, res) => {
  try {
    const { usn } = req.params;
    if (!usn) {
      return res.status(400).json({ error: 'USN parameter is required' });
    }

    const data = await repo.getStudentAttendance(usn);
    if (!data) {
      return res.status(404).json({
        error: 'Not Found',
        message: `No attendance records found for USN: ${usn.toUpperCase()}`
      });
    }

    res.json(data);
  } catch (err) {
    console.error('[API Error /student]:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

// -----------------------------------------------------------------------------
// STUDENT LOGIN AUTHENTICATION (USN + verification)
// -----------------------------------------------------------------------------
app.post('/api/auth/student-login', async (req, res) => {
  try {
    const { usn } = req.body;
    if (!usn) {
      return res.status(400).json({ error: 'USN is required for login' });
    }

    const cleanUSN = usn.trim().toUpperCase();
    const data = await repo.getStudentAttendance(cleanUSN);

    if (!data) {
      return res.status(404).json({
        error: 'Student Not Found',
        message: `No active records found for USN ${cleanUSN}. Please ask your proctor to sync attendance.`
      });
    }

    // Generate authenticated session token
    const studentToken = `stu_${Buffer.from(cleanUSN + ':' + Date.now()).toString('base64')}`;

    res.json({
      success: true,
      token: studentToken,
      student: data.student,
      overallPercentage: data.overall_percentage,
      overallStatus: data.overall_status
    });
  } catch (err) {
    res.status(500).json({ error: 'Login Error', message: err.message });
  }
});

// -----------------------------------------------------------------------------
// PROCTOR / ADMIN ENDPOINTS
// -----------------------------------------------------------------------------
app.get('/api/proctor/roster', async (req, res) => {
  try {
    const roster = await repo.getProctorRoster('proctor-bitm-cse-01');
    res.json({
      count: roster.length,
      roster
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load roster', message: err.message });
  }
});

app.get('/api/proctor/imports', async (req, res) => {
  try {
    const imports = await repo.getImportsHistory();
    res.json({ count: imports.length, imports });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load imports', message: err.message });
  }
});

// Fallback for SPA routing if dist exists
if (require('fs').existsSync(frontendDist)) {
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/fixture') || req.path.startsWith('/test-fixtures')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  Contineo Attendance API Server running on port ${PORT}`);
  console.log(`  Health Check: http://localhost:${PORT}/api/health`);
  console.log(`  Test Fixture: http://localhost:${PORT}/fixture`);
  console.log(`====================================================`);
});

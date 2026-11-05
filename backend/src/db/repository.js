const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Known subjects mapping for 3rd Sem BITM CSE
const KNOWN_SUBJECTS = {
  '1BMCS301': 'Mathematics for Computer Science III',
  '1BCS302': 'Data Structures and Applications',
  '1BCS303': 'Analog & Digital Electronics',
  '1BCS304': 'Computer Organization & Architecture',
  '1BCS305': 'Object Oriented Programming with Java',
  '1BCS306L': 'Data Structures Laboratory',
  '1BCS307L': 'Analog & Digital Electronics Laboratory',
  '1BCS308L': 'Object Oriented Programming Laboratory',
  '1BCSCP310': 'Social Connect and Responsibility',
  '1BPSW309': 'Professional Writing Skills in English'
};

class DataRepository {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    this.useSupabase = Boolean(this.supabaseUrl && this.supabaseKey && !this.supabaseUrl.includes('your-supabase'));

    if (this.useSupabase) {
      console.log('[Database] Connecting to Supabase PostgreSQL at:', this.supabaseUrl);
      this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    } else {
      console.log('[Database] Supabase credentials not set or local fallback active. Using local JSON store.');
      this.initLocalStore();
    }
  }

  initLocalStore() {
    this.storePath = path.join(__dirname, '..', '..', 'data', 'attendance_store.json');
    const dataDir = path.dirname(this.storePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    if (!fs.existsSync(this.storePath)) {
      const initialData = {
        students: {},
        subjects: { ...KNOWN_SUBJECTS },
        attendance: {}, // key: `${student_id}_${subject_code}`
        imports: []
      };
      fs.writeFileSync(this.storePath, JSON.stringify(initialData, null, 2));
    }
  }

  getLocalData() {
    try {
      const raw = fs.readFileSync(this.storePath, 'utf-8');
      return JSON.parse(raw);
    } catch (e) {
      return { students: {}, subjects: { ...KNOWN_SUBJECTS }, attendance: {}, imports: [] };
    }
  }

  saveLocalData(data) {
    fs.writeFileSync(this.storePath, JSON.stringify(data, null, 2));
  }

  /**
   * Save an extracted attendance batch (Called by the one-click publisher)
   */
  async saveAttendanceBatch(importData) {
    const { proctorId, semester, academicPeriod = '2026-27 ODD', students } = importData;
    const timestamp = new Date().toISOString();

    let successfulRecords = 0;
    let failedRecords = 0;
    let duplicatesHandled = 0;
    const errors = [];

    if (this.useSupabase) {
      try {
        // 1. Log import start
        const { data: impData, error: impErr } = await this.supabase
          .from('imports')
          .insert({
            proctor_id: proctorId,
            total_students: students.length,
            academic_period: academicPeriod,
            status: 'PROCESSING'
          })
          .select()
          .single();

        const importId = impData?.id;

        // 2. Process each student
        for (const st of students) {
          try {
            // Upsert student
            const { data: studentRecord, error: stErr } = await this.supabase
              .from('students')
              .upsert({
                usn: st.usn.toUpperCase(),
                name: st.name,
                semester: st.semester || semester || 'SEM03',
                proctor_id: proctorId,
                updated_at: timestamp
              }, { onConflict: 'usn' })
              .select('id')
              .single();

            if (stErr || !studentRecord) {
              throw new Error(`Failed to upsert student ${st.usn}: ${stErr?.message}`);
            }

            const studentId = studentRecord.id;

            // Upsert each subject attendance
            for (const sub of st.subjects) {
              // Ensure subject exists in subjects table
              const courseCode = sub.course_code.toUpperCase();
              const subjectName = KNOWN_SUBJECTS[courseCode] || `Course ${courseCode}`;

              const { data: subjRecord } = await this.supabase
                .from('subjects')
                .upsert({
                  course_code: courseCode,
                  subject_name: subjectName,
                  semester: st.semester || 'SEM03'
                }, { onConflict: 'course_code' })
                .select('id')
                .single();

              if (subjRecord?.id) {
                // Upsert attendance
                const { error: attErr } = await this.supabase
                  .from('attendance')
                  .upsert({
                    student_id: studentId,
                    subject_id: subjRecord.id,
                    attendance_percentage: sub.attendance_percentage,
                    cie_info: sub.cie || 'N/A',
                    academic_period: academicPeriod,
                    updated_at: timestamp
                  }, { onConflict: 'student_id,subject_id,academic_period' });

                if (attErr) {
                  throw new Error(`Attendance error for ${courseCode}: ${attErr.message}`);
                }
              }
            }

            successfulRecords++;
          } catch (stErr) {
            failedRecords++;
            errors.push({ usn: st.usn, error: stErr.message });
          }
        }

        // Finalize import record
        if (importId) {
          await this.supabase
            .from('imports')
            .update({
              successful_records: successfulRecords,
              failed_records: failedRecords,
              status: failedRecords === 0 ? 'COMPLETED' : 'COMPLETED_WITH_ERRORS',
              logs: { errors }
            })
            .eq('id', importId);
        }

        return {
          totalProcessed: students.length,
          successfulRecords,
          failedRecords,
          duplicatesHandled,
          errors,
          mode: 'supabase'
        };

      } catch (sbErr) {
        console.error('[Supabase Error] Falling back to local store:', sbErr.message);
        // Fall back to local storage if Supabase fails mid-flight
      }
    }

    // Local JSON Store Implementation
    const store = this.getLocalData();

    students.forEach(st => {
      try {
        const usn = st.usn.toUpperCase();
        const studentExists = Boolean(store.students[usn]);

        if (studentExists) {
          duplicatesHandled++;
        }

        store.students[usn] = {
          usn,
          name: st.name,
          semester: st.semester || semester || 'SEM03',
          department: 'Computer Science & Engineering',
          proctor_id: proctorId,
          updated_at: timestamp
        };

        st.subjects.forEach(sub => {
          const courseCode = sub.course_code.toUpperCase();
          if (!store.subjects[courseCode]) {
            store.subjects[courseCode] = KNOWN_SUBJECTS[courseCode] || `Course ${courseCode}`;
          }

          const attKey = `${usn}_${courseCode}_${academicPeriod}`;
          store.attendance[attKey] = {
            usn,
            course_code: courseCode,
            subject_name: store.subjects[courseCode],
            attendance_percentage: sub.attendance_percentage,
            cie_info: sub.cie || 'N/A',
            academic_period: academicPeriod,
            updated_at: timestamp
          };
        });

        successfulRecords++;
      } catch (err) {
        failedRecords++;
        errors.push({ usn: st.usn, error: err.message });
      }
    });

    // Record import audit
    const importRecord = {
      id: `imp_${Date.now()}`,
      proctor_id: proctorId,
      total_students: students.length,
      successful_records: successfulRecords,
      failed_records: failedRecords,
      academic_period: academicPeriod,
      imported_at: timestamp,
      status: failedRecords === 0 ? 'COMPLETED' : 'COMPLETED_WITH_ERRORS',
      logs: { errors }
    };
    store.imports.unshift(importRecord);
    if (store.imports.length > 50) store.imports.pop();

    this.saveLocalData(store);

    return {
      totalProcessed: students.length,
      successfulRecords,
      failedRecords,
      duplicatesHandled,
      errors,
      mode: 'local'
    };
  }

  /**
   * Fetch single student attendance details
   */
  async getStudentAttendance(usn) {
    const cleanUsn = usn.toUpperCase().trim();

    if (this.useSupabase) {
      try {
        const { data: student, error: stErr } = await this.supabase
          .from('students')
          .select('*')
          .eq('usn', cleanUsn)
          .maybeSingle();

        if (stErr || !student) {
          return null;
        }

        const { data: attList, error: attErr } = await this.supabase
          .from('attendance')
          .select(`
            attendance_percentage,
            cie_info,
            academic_period,
            updated_at,
            subjects ( course_code, subject_name, semester )
          `)
          .eq('student_id', student.id)
          .order('updated_at', { ascending: false });

        if (attErr) throw attErr;

        const subjects = (attList || []).map(item => ({
          course_code: item.subjects?.course_code,
          subject_name: item.subjects?.subject_name,
          semester: item.subjects?.semester,
          attendance_percentage: parseFloat(item.attendance_percentage),
          cie_info: item.cie_info,
          status: getAttendanceStatus(parseFloat(item.attendance_percentage)),
          updated_at: item.updated_at
        }));

        const overall = subjects.length > 0
          ? Math.round((subjects.reduce((sum, s) => sum + s.attendance_percentage, 0) / subjects.length) * 10) / 10
          : 0;

        return {
          student: {
            usn: student.usn,
            name: student.name,
            semester: student.semester,
            department: student.department,
            proctor_id: student.proctor_id,
            updated_at: student.updated_at
          },
          overall_percentage: overall,
          overall_status: getAttendanceStatus(overall),
          critical_subjects_count: subjects.filter(s => s.attendance_percentage < 75).length,
          subjects
        };
      } catch (err) {
        console.error('[Supabase getStudentAttendance error]:', err.message);
      }
    }

    // Local store lookup
    const store = this.getLocalData();
    const student = store.students[cleanUsn];
    if (!student) return null;

    const subjects = Object.values(store.attendance)
      .filter(a => a.usn === cleanUsn)
      .map(item => ({
        course_code: item.course_code,
        subject_name: item.subject_name,
        semester: student.semester || 'SEM03',
        attendance_percentage: parseFloat(item.attendance_percentage),
        cie_info: item.cie_info,
        status: getAttendanceStatus(parseFloat(item.attendance_percentage)),
        updated_at: item.updated_at
      }))
      .sort((a, b) => a.course_code.localeCompare(b.course_code));

    const overall = subjects.length > 0
      ? Math.round((subjects.reduce((sum, s) => sum + s.attendance_percentage, 0) / subjects.length) * 10) / 10
      : 0;

    return {
      student,
      overall_percentage: overall,
      overall_status: getAttendanceStatus(overall),
      critical_subjects_count: subjects.filter(s => s.attendance_percentage < 75).length,
      subjects
    };
  }

  /**
   * Fetch all students summary for proctor dashboard
   */
  async getProctorRoster(proctorId) {
    if (this.useSupabase) {
      try {
        const { data: students } = await this.supabase
          .from('students')
          .select(`
            id, usn, name, semester, department, updated_at,
            attendance ( attendance_percentage )
          `);

        if (students) {
          return students.map(s => {
            const atts = s.attendance || [];
            const avg = atts.length > 0
              ? Math.round((atts.reduce((acc, a) => acc + parseFloat(a.attendance_percentage), 0) / atts.length) * 10) / 10
              : 0;
            return {
              usn: s.usn,
              name: s.name,
              semester: s.semester,
              department: s.department,
              overall_percentage: avg,
              status: getAttendanceStatus(avg),
              total_subjects: atts.length,
              last_updated: s.updated_at
            };
          });
        }
      } catch (err) {
        console.error('[Supabase getProctorRoster error]:', err.message);
      }
    }

    const store = this.getLocalData();
    return Object.values(store.students).map(s => {
      const studentAtts = Object.values(store.attendance).filter(a => a.usn === s.usn);
      const avg = studentAtts.length > 0
        ? Math.round((studentAtts.reduce((acc, a) => acc + a.attendance_percentage, 0) / studentAtts.length) * 10) / 10
        : 0;

      return {
        usn: s.usn,
        name: s.name,
        semester: s.semester,
        department: s.department,
        overall_percentage: avg,
        status: getAttendanceStatus(avg),
        total_subjects: studentAtts.length,
        last_updated: s.updated_at
      };
    });
  }

  /**
   * Fetch import history
   */
  async getImportsHistory() {
    if (this.useSupabase) {
      try {
        const { data } = await this.supabase
          .from('imports')
          .select('*')
          .order('imported_at', { ascending: false })
          .limit(20);
        if (data) return data;
      } catch (e) {}
    }

    const store = this.getLocalData();
    return store.imports || [];
  }
}

function getAttendanceStatus(pct) {
  if (pct >= 85) return 'GOOD';       // Green
  if (pct >= 75) return 'WARNING';    // Orange
  return 'CRITICAL';                  // Red
}

module.exports = new DataRepository();

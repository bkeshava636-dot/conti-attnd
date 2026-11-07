-- ==============================================================================
-- Contineo Attendance Tracker - Supabase / PostgreSQL Production Schema
-- Designed for Ballari Institute of Technology & Management (BITM)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. STUDENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usn VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    semester VARCHAR(20) NOT NULL DEFAULT 'SEM03',
    department VARCHAR(50) NOT NULL DEFAULT 'Computer Science & Engineering',
    proctor_id VARCHAR(60) NOT NULL DEFAULT 'proctor-bitm-cse-01',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for fast lookup by USN
CREATE INDEX IF NOT EXISTS idx_students_usn ON public.students (UPPER(usn));
CREATE INDEX IF NOT EXISTS idx_students_proctor ON public.students (proctor_id);

-- ------------------------------------------------------------------------------
-- 2. SUBJECTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_code VARCHAR(30) NOT NULL UNIQUE,
    subject_name VARCHAR(150) NOT NULL,
    semester VARCHAR(20) NOT NULL DEFAULT 'SEM03',
    department VARCHAR(50) NOT NULL DEFAULT 'CSE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for fast lookup by Course Code
CREATE INDEX IF NOT EXISTS idx_subjects_course_code ON public.subjects (UPPER(course_code));

-- ------------------------------------------------------------------------------
-- 3. ATTENDANCE TABLE (Subject-wise Attendance per student)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    attendance_percentage NUMERIC(5, 2) NOT NULL CHECK (attendance_percentage >= 0 AND attendance_percentage <= 100),
    cie_info VARCHAR(80) DEFAULT 'N/A',
    academic_period VARCHAR(50) NOT NULL DEFAULT '2026-27 ODD',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_student_subject_period UNIQUE (student_id, subject_id, academic_period)
);

-- Indexes for lightning-fast join queries
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance (student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_subject_id ON public.attendance (subject_id);
CREATE INDEX IF NOT EXISTS idx_attendance_period ON public.attendance (academic_period);

-- ------------------------------------------------------------------------------
-- 4. IMPORTS TABLE (Audit Trail for One-Click Proctor Extractions)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proctor_id VARCHAR(60) NOT NULL,
    total_students INT NOT NULL DEFAULT 0,
    successful_records INT NOT NULL DEFAULT 0,
    failed_records INT NOT NULL DEFAULT 0,
    academic_period VARCHAR(50) NOT NULL DEFAULT '2026-27 ODD',
    imported_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
    logs JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_imports_imported_at ON public.imports (imported_at DESC);
CREATE INDEX IF NOT EXISTS idx_imports_proctor ON public.imports (proctor_id);

-- ------------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imports ENABLE ROW LEVEL SECURITY;

-- Subjects are public / read-only for all authenticated users
CREATE POLICY "Subjects are viewable by all authenticated users"
    ON public.subjects FOR SELECT
    TO authenticated
    USING (true);

-- Students policy: A student can ONLY view their own profile based on their JWT USN claim
CREATE POLICY "Students can view only their own record"
    ON public.students FOR SELECT
    TO authenticated
    USING (
      auth.jwt() ->> 'usn' = usn 
      OR auth.jwt() ->> 'role' = 'proctor'
      OR auth.jwt() ->> 'role' = 'service_role'
    );

-- Attendance policy: A student can ONLY view their own attendance records
CREATE POLICY "Students can view only their own attendance"
    ON public.attendance FOR SELECT
    TO authenticated
    USING (
      student_id IN (
        SELECT s.id FROM public.students s
        WHERE s.usn = auth.jwt() ->> 'usn'
      )
      OR auth.jwt() ->> 'role' = 'proctor'
      OR auth.jwt() ->> 'role' = 'service_role'
    );

-- Proctor / Service Role Policies for Write Operations
CREATE POLICY "Proctors can insert/update student records"
    ON public.students FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'proctor' OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Proctors can insert/update attendance records"
    ON public.attendance FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'proctor' OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Proctors can view and create imports"
    ON public.imports FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'proctor' OR auth.jwt() ->> 'role' = 'service_role');

-- ------------------------------------------------------------------------------
-- 6. PRE-POPULATE KNOWN 3RD SEMESTER BITM CSE SUBJECTS CATALOG
-- ------------------------------------------------------------------------------
INSERT INTO public.subjects (course_code, subject_name, semester, department) VALUES
    ('1BMCS301', 'Graph Theory and Discrete Mathematical Structures', 'SEM03', 'CSE'),
    ('1BCS302', 'Operating System', 'SEM03', 'CSE'),
    ('1BCS303', 'Object Oriented Programming with Java', 'SEM03', 'CSE'),
    ('1BCS304', 'Digital System Design & Computer Organization', 'SEM03', 'CSE'),
    ('1BCS305', 'Data Structures and Applications', 'SEM03', 'CSE'),
    ('1BCS306L', 'Object Oriented Programming Lab', 'SEM03', 'CSE'),
    ('1BCS307L', 'Digital Lab', 'SEM03', 'CSE'),
    ('1BCS308L', 'Data Structures Lab', 'SEM03', 'CSE'),
    ('1BCSCP310', 'Community Project', 'SEM03', 'CSE'),
    ('1BPSW309', 'Professional Skills for Workplace', 'SEM03', 'CSE')
ON CONFLICT (course_code) DO UPDATE
SET subject_name = EXCLUDED.subject_name;

# Supabase PostgreSQL & Authentication Configuration Guide

## Overview
Contineo Attendance Tracker utilizes Supabase for:
- **PostgreSQL Database**: Storage of students, subjects catalog, attendance percentages, and proctor import audit logs.
- **Row Level Security (RLS)**: Enforces strict data isolation ensuring students can only view their own records, while proctors manage assigned cohorts.
- **Auto Fallback**: The backend includes a local storage engine that runs seamlessly even before you connect Supabase, allowing immediate offline testing.

---

### Step 1: Create a Supabase Project

1. Log in to [Supabase Console](https://app.supabase.com).
2. Click **New Project**.
3. Fill in:
   - **Name**: `bitm-contineo-attendance`
   - **Database Password**: Set a strong password and save it securely.
   - **Region**: Choose the closest region (e.g. `ap-south-1` Mumbai for India).
4. Click **Create new project** and wait 1-2 minutes for provisioning.

---

### Step 2: Run Database Schema SQL

1. In your Supabase Project dashboard, navigate to the **SQL Editor** from the left navigation bar.
2. Click **New Query**.
3. Copy the entire contents of:
   ```
   backend/supabase/schema.sql
   ```
4. Paste it into the SQL Editor and click **Run** (or `Ctrl + Enter`).
5. Verify output:
   - `students` table created with unique USN constraint and indexes.
   - `subjects` table created with 3rd Sem BITM CSE courses pre-seeded.
   - `attendance` table created with composite unique constraint `(student_id, subject_id, academic_period)`.
   - `imports` table created for audit logging.
   - Row Level Security (RLS) policies enabled.

---

### Step 3: Retrieve API Keys & Configure Backend

1. In Supabase, navigate to **Project Settings** (gear icon) $\rightarrow$ **API**.
2. Find:
   - **Project URL**: e.g., `https://xyzprojectref.supabase.co`
   - **Project API keys**:
     - `anon` `public` key
     - `service_role` `secret` key (revealed by clicking reveal)
3. Open `backend/.env` in your project workspace:
   ```env
   PORT=5000
   PROCTOR_SECRET_KEY=demo-proctor-secret-key-bitm

   SUPABASE_URL=https://xyzprojectref.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
4. Restart the backend server (`npm start` or `npm run dev`).
5. Look at console output:
   ```
   [Database] Connecting to Supabase PostgreSQL at: https://xyzprojectref.supabase.co
   Contineo Attendance API Server running on port 5000
   ```

---

### Step 4: Understanding Row Level Security (RLS)

- **Students**:
  Can only view records where `auth.jwt() ->> 'usn' = students.usn`.
- **Proctors / Service Role**:
  Can insert, update, upsert, and read all records within their assigned batch.
- **Idempotency**:
  Re-publishing attendance from the Chrome extension runs an `UPSERT` on `(student_id, subject_id, academic_period)`. It safely updates percentages without creating duplicate rows or conflicting keys.

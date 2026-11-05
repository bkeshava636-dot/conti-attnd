# Proctor One-Click Collection Workflow Guide

## The Primary Objective
**ONE CLICK BY THE PROCTOR $\rightarrow$ ALL STUDENTS' ATTENDANCE EXTRACTED $\rightarrow$ DATABASE UPDATED $\rightarrow$ STUDENTS CAN VIEW THEIR ATTENDANCE.**

---

### Step 1: Open the Contineo Portal
1. Open Google Chrome.
2. Navigate to your regular BITM Contineo portal:
   ```
   https://bitm.contineo.in/
   ```
3. Log in with your standard authorized proctor credentials.
4. Navigate to the **COUNSELLING** menu tab where your ~22 assigned students are listed vertically stacked on one continuous webpage.
5. *(Optional Local Testing)* If testing outside college intranet, open the simulator fixture:
   ```
   http://localhost:5000/fixture
   ```

---

### Step 2: Open the Extension
1. Click the **Contineo Attendance Collector** icon in your browser toolbar.
2. The popup will immediately check:
   - **Portal Status**: `Connected` (detects Contineo SIMS counselling page).
   - **Backend Status**: `Connected` (communicating with the attendance backend).
   - **Students Detected**: e.g., `22`.
3. The primary button **"COLLECT & PUBLISH ATTENDANCE"** lights up.

---

### Step 3: Click Once to Collect & Publish
1. Click **COLLECT & PUBLISH ATTENDANCE**.
2. The system executes the entire automated sequence:
   - Traverses the DOM across all 22 student sections.
   - Extracts each student's name, USN, and semester.
   - Parses the "Current Sem Data:" table extracting course codes (`1BMCS301`, `1BCS302`...), CIE scores, and attendance percentages.
   - Validates every record (verifies USN regex, verifies 0-100% ranges, checks for duplicates).
   - Securely transmits the payload with Proctor Bearer authentication to `/api/attendance/publish`.
   - Database executes relational UPSERTs.
3. The popup displays real-time progress:
   ```
   Collection Completed!
   Students Processed: 22/22
   Records Published: 22
   Last Updated: [Current Time]
   ```
4. You can click on any student row in the popup to automatically scroll to and highlight that student on the Contineo webpage!

---

### Zero Manual Actions
The proctor does not need to:
- Enter individual USNs.
- Open individual student profiles.
- Download separate PDFs.
- Upload multiple files.
- Manually copy attendance percentages.
- Click multiple buttons to process students.

# Student Web Portal & Dashboard Guide

## Accessing Your Attendance
Website: `http://localhost:5173` (or college portal domain)

Students at Ballari Institute of Technology & Management can view their subject-wise attendance percentages as soon as the proctor completes the one-click sync.

---

### Features for Students

1. **Secure Login**:
   - Students enter their University Seat Number (USN), e.g., `3BR23CS001`.
   - The portal loads their authorized record from the database.

2. **Executive Overview**:
   - Overall Attendance Percentage.
   - VTU Exam Eligibility Status badge:
     - 🟢 **Safe (≥85%)**: High attendance, fully eligible for exams.
     - 🟠 **Eligible (75%–84%)**: Standard eligibility range.
     - 🔴 **Shortage (<75%)**: Attendance shortage alert, requiring condonation or proctor consultation.

3. **Subject-Wise Attendance Table**:
   - Lists all 10 registered semester courses:
     - Course Code (`1BMCS301`, `1BCS302`, `1BCS306L`...)
     - Full Subject Name (e.g. *Data Structures and Applications*, *Mathematics for CS III*)
     - CIE Record (e.g. `IA1 - 50/50`)
     - Attendance Percentage with visual progress bar and color indicator.
     - Filters by status: All, Safe ($\ge 85\%$), Warning ($75-84\%$), Critical ($< 75\%$).

4. **Target & Shortage Calculator**:
   - Interactive planner that tells the student:
     - *"Safe Margin! You can miss up to X classes and still maintain 75% (or 85%)"*
     - Or *"Shortage Alert! You must attend the next Y consecutive classes to reach 75%"*.

5. **Mobile-Responsive**:
   - Optimized for mobile screens, tablets, and desktops.

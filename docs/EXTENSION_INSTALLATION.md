# Chrome Extension Installation Guide

## Contineo Attendance Collector (Manifest V3)

This Chrome Extension empowers proctors at Ballari Institute of Technology & Management (BITM) to extract all assigned students' attendance from the Contineo SIMS portal in **ONE CLICK** and publish it to the student database.

---

### Prerequisites
- Google Chrome browser (v109 or later).
- The Contineo Attendance Backend running locally or deployed on your cloud server.

---

### Step-by-Step Installation (Unpacked Extension Mode)

1. **Open the Extensions Page in Chrome**:
   - In the Google Chrome address bar, navigate to:
     ```
     chrome://extensions/
     ```
   - Alternatively: Click the **Three Dots Menu** (`⋮`) in the top-right corner $\rightarrow$ **Extensions** $\rightarrow$ **Manage Extensions**.

2. **Enable Developer Mode**:
   - In the top-right corner of the Extensions page, toggle the **"Developer mode"** switch to **ON**.

3. **Load the Extension**:
   - In the top-left corner, click the **"Load unpacked"** button.
   - In the file picker dialog, navigate to the project directory:
     ```
     e:\conti-attnd\extension
     ```
   - Select the `extension` folder and click **Select Folder**.

4. **Verify Installation**:
   - You will now see **Contineo Attendance Collector** listed with:
     - Version: `1.0.0`
     - Description: *One-click automated attendance extraction and publishing for BITM Contineo Proctor Portal.*
     - Real PNG icons loaded (16, 32, 48, 128 px).

5. **Pin the Extension**:
   - Click the **Puzzle Piece** (Extensions) icon in Chrome's top toolbar.
   - Click the **Pin** icon next to **Contineo Attendance Collector** so the icon remains permanently accessible in your browser bar.

---

### Extension Configuration

1. Click on the Contineo Extension icon in your browser toolbar.
2. Click the **Gear icon** (⚙) in the top-right corner of the popup.
3. Review or update:
   - **Backend Server URL**: Default is `http://localhost:5000` (or your deployed API domain).
   - **Proctor Auth Key**: Default is `demo-proctor-secret-key-bitm` (matching the `PROCTOR_SECRET_KEY` in `backend/.env`).
4. Click **Save & Reconnect**.

---

### Testing the Extension Locally
If you do not currently have an active BITM Contineo SIMS proctor session:
1. Open the popup and click **"Open Test Fixture"** at the bottom, or visit `http://localhost:5000/fixture`.
2. Notice the extension detects: **"Students Detected: 22"**.
3. Click the primary button **"COLLECT & PUBLISH ATTENDANCE"**.
4. The progress bar will advance in real time:
   - Extracting DOM $\rightarrow$ Validating schema $\rightarrow$ Publishing to database.
   - Status updates to: **"Collection Completed! Students Processed: 22/22"**.

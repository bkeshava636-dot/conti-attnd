/**
 * Contineo Attendance Collector - Popup Controller
 * Manages one-click extraction, backend publishing, progress, diagnostics, and reports.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements
  const statusPortal = document.getElementById('status-portal');
  const dotPortal = document.getElementById('dot-portal');
  const statusBackend = document.getElementById('status-backend');
  const dotBackend = document.getElementById('dot-backend');
  const countDetected = document.getElementById('count-detected');
  const detectionDetail = document.getElementById('detection-detail-text');
  const btnCollect = document.getElementById('btn-collect-publish');
  const btnActionText = document.getElementById('btn-action-text');

  const progressContainer = document.getElementById('progress-container');
  const progressStage = document.getElementById('progress-stage-label');
  const progressPercent = document.getElementById('progress-percent-label');
  const progressBarFill = document.getElementById('progress-bar-fill');

  const valProcessed = document.getElementById('val-processed');
  const valSuccessful = document.getElementById('val-successful');
  const valDuplicates = document.getElementById('val-duplicates');
  const valFailed = document.getElementById('val-failed');

  const resultNotice = document.getElementById('result-notice');
  const recordsAccordion = document.getElementById('records-accordion');
  const btnToggleRecords = document.getElementById('btn-toggle-records');
  const recordsContent = document.getElementById('records-content');
  const recordsList = document.getElementById('records-list');
  const accordionArrow = document.getElementById('accordion-arrow');

  const btnSettingsToggle = document.getElementById('btn-settings-toggle');
  const btnCloseSettings = document.getElementById('btn-close-settings');
  const settingsModal = document.getElementById('settings-modal');
  const inputBackendUrl = document.getElementById('input-backend-url');
  const inputProctorToken = document.getElementById('input-proctor-token');
  const btnSaveSettings = document.getElementById('btn-save-settings');
  const linkOpenTestFixture = document.getElementById('link-open-test-fixture');

  // Theme Toggle Elements
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  const iconThemeSun = document.getElementById('icon-theme-sun');
  const iconThemeMoon = document.getElementById('icon-theme-moon');

  // Filter Chip Elements
  const filterChipAll = document.getElementById('filter-chip-all');
  const filterChipShortage = document.getElementById('filter-chip-shortage');
  const filterChipSafe = document.getElementById('filter-chip-safe');
  const countChipAll = document.getElementById('count-chip-all');
  const countChipShortage = document.getElementById('count-chip-shortage');
  const countChipSafe = document.getElementById('count-chip-safe');

  // Auto-Sync Elements
  const toggleAutosync = document.getElementById('toggle-autosync');
  const selectSyncInterval = document.getElementById('select-sync-interval');
  const autosyncStatusBadge = document.getElementById('autosync-status-badge');
  const autosyncInfoText = document.getElementById('autosync-info-text');

  // State
  let config = {
    backendUrl: 'https://contineo-attendance-tracker.onrender.com',
    proctorToken: 'demo-proctor-secret-key-bitm'
  };
  let activeTab = null;
  let isProcessing = false;
  let currentTheme = 'dark';
  let cachedStudentsList = [];
  let currentCourseFilter = 'ALL';

  const detectionHelper = document.getElementById('detection-helper');
  const linkHelperFixture = document.getElementById('link-helper-fixture');

  if (linkHelperFixture) {
    linkHelperFixture.addEventListener('click', (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: `${config.backendUrl}/fixture` });
    });
  }

  // Load config and theme from chrome.storage
  const stored = await chrome.storage.local.get([
    'backendUrl', 
    'proctorToken', 
    'lastReport',
    'theme',
    'autoSyncEnabled',
    'autoSyncInterval',
    'lastAutoSyncTimestamp',
    'lastSyncCount'
  ]);
  if (stored.backendUrl) config.backendUrl = stored.backendUrl;
  if (stored.proctorToken) config.proctorToken = stored.proctorToken;

  inputBackendUrl.value = config.backendUrl;
  inputProctorToken.value = config.proctorToken;

  // Initialize Theme
  currentTheme = stored.theme || 'dark';
  applyTheme(currentTheme);

  if (btnThemeToggle) {
    btnThemeToggle.addEventListener('click', async () => {
      const next = currentTheme === 'light' ? 'dark' : 'light';
      applyTheme(next);
      await chrome.storage.local.set({ theme: next });
    });
  }

  function applyTheme(theme) {
    currentTheme = theme;
    if (theme === 'light') {
      document.body.classList.add('theme-light');
      if (iconThemeSun) iconThemeSun.classList.remove('hidden');
      if (iconThemeMoon) iconThemeMoon.classList.add('hidden');
    } else {
      document.body.classList.remove('theme-light');
      if (iconThemeSun) iconThemeSun.classList.add('hidden');
      if (iconThemeMoon) iconThemeMoon.classList.remove('hidden');
    }
  }

  // Restore Auto-Sync state
  if (selectSyncInterval && stored.autoSyncInterval) {
    selectSyncInterval.value = stored.autoSyncInterval.toString();
  }
  if (toggleAutosync) {
    toggleAutosync.checked = !!stored.autoSyncEnabled;
    updateAutoSyncUI(stored.autoSyncEnabled, stored.lastAutoSyncTimestamp, stored.lastSyncCount);
  }

  // Restore previous report if available
  if (stored.lastReport) {
    renderPreviousReport(stored.lastReport);
  }

  // Check Backend Status
  await checkBackendStatus();

  // Inspect Active Tab
  await initTabInspection();

  // Event Listeners
  btnCollect.addEventListener('click', handleOneClickWorkflow);

  btnToggleRecords.addEventListener('click', () => {
    const isHidden = recordsContent.classList.toggle('hidden');
    accordionArrow.textContent = isHidden ? '▼' : '▲';
  });

  btnSettingsToggle.addEventListener('click', () => {
    settingsModal.classList.remove('hidden');
  });

  btnCloseSettings.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
  });

  btnSaveSettings.addEventListener('click', async () => {
    config.backendUrl = inputBackendUrl.value.trim().replace(/\/$/, '');
    config.proctorToken = inputProctorToken.value.trim();
    await chrome.storage.local.set(config);
    settingsModal.classList.add('hidden');
    await checkBackendStatus();
  });

  if (linkOpenTestFixture) {
    linkOpenTestFixture.addEventListener('click', async (e) => {
      e.preventDefault();
      await chrome.tabs.create({ url: `${config.backendUrl}/fixture` });
    });
  }

  // Auto-Sync handlers
  if (toggleAutosync) {
    toggleAutosync.addEventListener('change', handleAutoSyncChange);
  }
  if (selectSyncInterval) {
    selectSyncInterval.addEventListener('change', handleAutoSyncChange);
  }

  async function handleAutoSyncChange() {
    const enabled = toggleAutosync.checked;
    const intervalMinutes = parseInt(selectSyncInterval.value, 10) || 30;

    await chrome.storage.local.set({
      autoSyncEnabled: enabled,
      autoSyncInterval: intervalMinutes
    });

    updateAutoSyncUI(enabled);

    // Message service worker to update alarms
    chrome.runtime.sendMessage({
      action: 'SET_AUTO_SYNC',
      enabled,
      intervalMinutes
    });
  }

  function updateAutoSyncUI(enabled, lastTimestamp, lastCount) {
    if (!autosyncStatusBadge) return;
    if (enabled) {
      autosyncStatusBadge.textContent = 'Active';
      autosyncStatusBadge.className = 'autosync-status active';
      if (lastTimestamp && autosyncInfoText) {
        const timeStr = new Date(lastTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        autosyncInfoText.textContent = `Last auto-sync: ${timeStr} (${lastCount || 0} students).`;
      } else if (autosyncInfoText) {
        autosyncInfoText.textContent = `Auto-sync running every ${selectSyncInterval.value} mins in background.`;
      }
    } else {
      autosyncStatusBadge.textContent = 'Off';
      autosyncStatusBadge.className = 'autosync-status';
      if (autosyncInfoText) {
        autosyncInfoText.textContent = 'Periodically syncs open Contineo tabs in background.';
      }
    }
  }

  /**
   * Check connection to backend API
   */
  async function checkBackendStatus() {
    try {
      statusBackend.textContent = 'Connecting...';
      const res = await fetch(`${config.backendUrl}/api/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        statusBackend.textContent = 'Connected';
        dotBackend.className = 'status-dot active';
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err) {
      statusBackend.textContent = 'Offline';
      dotBackend.className = 'status-dot error';
    }
  }

  /**
   * Inspect current active tab and detect student records
   */
  async function initTabInspection() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      activeTab = tab;

      if (!tab || !tab.url) {
        setPortalState('Not Found', 'warning', 'No active tab detected');
        return;
      }

      const isContineo = tab.url.includes('contineo.in') || 
                          tab.url.includes('contineo-sims-fixture') || 
                          tab.url.includes('/fixture');

      if (!isContineo) {
        setPortalState('Standby', 'warning', 'Please open bitm.contineo.in');
        if (detectionHelper) detectionHelper.classList.remove('hidden');
        btnCollect.disabled = false;
        btnActionText.textContent = 'Open BITM Contineo Portal';
        btnCollect.onclick = () => {
          chrome.tabs.create({ url: 'https://bitm.contineo.in/' });
        };
        return;
      }

      if (detectionHelper) detectionHelper.classList.add('hidden');

      // Ensure content script is injected and responsive
      await ensureContentScriptInjected(tab.id);

      // Detect students
      chrome.tabs.sendMessage(tab.id, { action: 'DETECT_STUDENTS' }, (res) => {
        if (chrome.runtime.lastError || !res || !res.success) {
          setPortalState('Active (0)', 'warning', 'No student cards detected yet');
          countDetected.textContent = '0';
          detectionDetail.textContent = 'Ensure you are on the SIMS attendance roster page';
          btnCollect.disabled = true;
          return;
        }

        setPortalState('Connected', 'active', 'SIMS Attendance Page');
        countDetected.textContent = res.count;
        detectionDetail.textContent = `${res.count} student profiles ready for extraction`;
        valProcessed.textContent = `0/${res.count}`;

        btnCollect.disabled = false;
        btnActionText.textContent = 'Sync Contineo Attendance';
        btnCollect.onclick = handleOneClickWorkflow;
      });

    } catch (err) {
      setPortalState('Error', 'error', err.message);
    }
  }

  function setPortalState(text, dotClass, detailText) {
    statusPortal.textContent = text;
    dotPortal.className = `status-dot ${dotClass}`;
    if (detailText) detectionDetail.textContent = detailText;
  }

  async function ensureContentScriptInjected(tabId) {
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tabId, { action: 'PING' }, (res) => {
        if (chrome.runtime.lastError || !res || res.status !== 'PONG') {
          chrome.scripting.executeScript({
            target: { tabId },
            files: ['content.js']
          }, () => {
            setTimeout(resolve, 150);
          });
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * THE ONE-CLICK WORKFLOW
   * 1. Extract from DOM with bounded DOM slices
   * 2. Strict client-side validation
   * 3. Safe Publish to Backend
   * 4. Display Diagnostic & Success Report
   */
  async function handleOneClickWorkflow() {
    if (isProcessing || !activeTab) return;
    isProcessing = true;

    btnCollect.disabled = true;
    btnActionText.textContent = 'EXTRACTING...';
    progressContainer.classList.remove('hidden');
    resultNotice.classList.add('hidden');

    updateProgress(15, 'Scanning Contineo DOM...');

    try {
      // Step 1: Send extraction command to content script
      const extractionResponse = await new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(activeTab.id, { action: 'EXTRACT_ATTENDANCE' }, (res) => {
          if (chrome.runtime.lastError) {
            return reject(new Error(chrome.runtime.lastError.message));
          }
          resolve(res);
        });
      });

      if (!extractionResponse || !extractionResponse.report || extractionResponse.report.students.length === 0) {
        throw new Error('No valid student attendance records could be extracted from page.');
      }

      const { students, warnings, errors: extractionErrors, diagnostics } = extractionResponse.report;

      updateProgress(40, `Extracted ${students.length} students. Performing strict verification...`);

      // Step 2: Strict Client-Side Pre-Publish Validation
      const USN_PATTERN = /^[1-4][A-Z0-9]{2}\d{2}[A-Z0-9]{2,3}\d{2,3}$/i;
      const validStudents = [];
      const quarantinedStudents = [];

      students.forEach(st => {
        let isRecordValid = true;
        const reasons = [];

        if (!st.usn || !USN_PATTERN.test(st.usn)) {
          isRecordValid = false;
          reasons.push(`Invalid USN: ${st.usn}`);
        }

        if (!st.subjects || !Array.isArray(st.subjects) || st.subjects.length === 0) {
          isRecordValid = false;
          reasons.push('Zero subjects extracted');
        } else {
          for (const sub of st.subjects) {
            if (!sub.course_code) {
              isRecordValid = false;
              reasons.push('Missing course code');
              break;
            }
            if (typeof sub.attendance_percentage !== 'number' || sub.attendance_percentage < 0 || sub.attendance_percentage > 100) {
              isRecordValid = false;
              reasons.push(`Percentage out of bounds on ${sub.course_code}`);
              break;
            }
          }
        }

        if (isRecordValid) {
          validStudents.push(st);
        } else {
          quarantinedStudents.push({ usn: st.usn || 'UNKNOWN', reasons });
        }
      });

      if (validStudents.length === 0) {
        throw new Error(`All ${students.length} detected records failed strict verification.`);
      }

      let totalSubjects = 0;
      validStudents.forEach(s => totalSubjects += s.subjects.length);

      updateProgress(65, `Publishing ${validStudents.length} validated records (${totalSubjects} subjects) to backend...`);

      // Step 3: Push to Backend API
      const payload = {
        proctorId: 'proctor-bitm-cse-01',
        semester: validStudents[0]?.semester || 'SEM03',
        sourceUrl: activeTab.url,
        extractedAt: new Date().toISOString(),
        students: validStudents,
        diagnostics: {
          totalDetected: diagnostics?.totalSectionsDetected || students.length,
          quarantinedCount: quarantinedStudents.length,
          quarantined: quarantinedStudents
        }
      };

      const res = await fetch(`${config.backendUrl}/api/attendance/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.proctorToken}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Backend responded with HTTP ${res.status}`);
      }

      const publishResult = await res.json();
      updateProgress(100, 'Publishing completed successfully!');

      // Step 4: Update Metrics
      valProcessed.textContent = `${publishResult.totalProcessed}/${publishResult.totalProcessed}`;
      valSuccessful.textContent = publishResult.successfulRecords;
      valDuplicates.textContent = publishResult.duplicatesHandled || 0;
      valFailed.textContent = (publishResult.failedRecords || 0) + quarantinedStudents.length;

      // Show Result Notice
      resultNotice.className = 'result-notice success';
      let noticeHtml = `
        <strong>Collection Completed!</strong><br>
        Students Processed: <strong>${publishResult.successfulRecords}/${publishResult.totalProcessed}</strong><br>
        Records Published: <strong>${publishResult.successfulRecords}</strong><br>
        <span style="font-size: 11px; opacity: 0.9;">Last Updated: ${new Date().toLocaleTimeString()}</span>
      `;

      if (quarantinedStudents.length > 0) {
        noticeHtml += `<br><span style="color: #fcd34d; font-size: 10px;">⚠️ ${quarantinedStudents.length} record(s) quarantined due to schema validation.</span>`;
      }

      resultNotice.innerHTML = noticeHtml;
      resultNotice.classList.remove('hidden');

      // Render records list in accordion
      renderRecordsList(validStudents);
      recordsContent.classList.remove('hidden');
      accordionArrow.textContent = '▲';

      // Persist last report
      await chrome.storage.local.set({
        lastReport: {
          timestamp: new Date().toISOString(),
          processed: publishResult.totalProcessed,
          successful: publishResult.successfulRecords,
          duplicates: publishResult.duplicatesHandled,
          failed: (publishResult.failedRecords || 0) + quarantinedStudents.length,
          students: validStudents
        }
      });

      btnActionText.textContent = 'Sync Completed ✓';
      setTimeout(() => {
        btnCollect.disabled = false;
        btnActionText.textContent = 'Re-Sync Attendance';
        isProcessing = false;
      }, 2500);

    } catch (err) {
      console.error('[Contineo Error]:', err);
      updateProgress(100, 'Workflow stopped with errors');
      resultNotice.className = 'result-notice error';
      resultNotice.innerHTML = `
        <strong>Collection Incomplete</strong><br>
        ${err.message}<br>
        <span style="font-size: 10px;">Check browser console for detailed diagnostic logs.</span>
      `;
      resultNotice.classList.remove('hidden');

      btnCollect.disabled = false;
      btnActionText.textContent = 'RETRY COLLECTION';
      isProcessing = false;
    }
  }

  function updateProgress(percent, label) {
    progressBarFill.style.width = `${percent}%`;
    progressPercent.textContent = `${percent}%`;
    progressStage.textContent = label;
  }

  // Setup course filter buttons
  setupFilterChips();

  function setupFilterChips() {
    const chips = [
      { el: filterChipAll, val: 'ALL' },
      { el: filterChipShortage, val: 'SHORTAGE' },
      { el: filterChipSafe, val: 'SAFE' }
    ];

    chips.forEach(({ el, val }) => {
      if (!el) return;
      el.addEventListener('click', () => {
        chips.forEach(c => c.el?.classList.remove('active'));
        el.classList.add('active');
        currentCourseFilter = val;
        renderFilteredCards();
      });
    });
  }

  function renderRecordsList(students) {
    cachedStudentsList = students || [];
    
    // Calculate BITM 85% rule metrics
    const shortageStudents = cachedStudentsList.filter(s => 
      (s.subjects || []).some(sub => (sub.attendance_percentage || 0) < 85)
    );
    const safeStudents = cachedStudentsList.filter(s => 
      (s.subjects || []).length > 0 && (s.subjects || []).every(sub => (sub.attendance_percentage || 0) >= 85)
    );

    if (countChipAll) countChipAll.textContent = cachedStudentsList.length;
    if (countChipShortage) countChipShortage.textContent = shortageStudents.length;
    if (countChipSafe) countChipSafe.textContent = safeStudents.length;

    renderFilteredCards();
  }

  function renderFilteredCards() {
    recordsList.innerHTML = '';
    if (!cachedStudentsList || cachedStudentsList.length === 0) {
      recordsList.innerHTML = '<p class="empty-state">No student records available.</p>';
      return;
    }

    const filtered = cachedStudentsList.filter(st => {
      const hasShortage = (st.subjects || []).some(sub => (sub.attendance_percentage || 0) < 85);
      if (currentCourseFilter === 'SHORTAGE') return hasShortage;
      if (currentCourseFilter === 'SAFE') return !hasShortage;
      return true;
    });

    if (filtered.length === 0) {
      recordsList.innerHTML = `<p class="empty-state">No students found for this filter.</p>`;
      return;
    }

    filtered.forEach(st => {
      const shortageCourses = (st.subjects || []).filter(sub => (sub.attendance_percentage || 0) < 85);
      const isEligible = shortageCourses.length === 0;

      const card = document.createElement('div');
      card.className = 'student-card';

      // Header
      const header = document.createElement('div');
      header.className = 'student-card-header';
      header.innerHTML = `
        <div class="student-info-left">
          <span class="student-card-usn font-mono">${st.usn}</span>
          <span class="student-card-name" title="${st.name}">${st.name}</span>
        </div>
        <div class="student-info-right">
          ${isEligible 
            ? `<span class="bitm-status-pill safe font-mono">All ≥85%</span>` 
            : `<span class="bitm-status-pill shortage font-mono">${shortageCourses.length} &lt;85% Shortage</span>`
          }
          <span class="student-expand-icon">▼</span>
        </div>
      `;

      // Course breakdown
      const breakdown = document.createElement('div');
      breakdown.className = 'courses-breakdown';

      if (st.subjects && st.subjects.length > 0) {
        st.subjects.forEach(sub => {
          const isShort = (sub.attendance_percentage || 0) < 85;
          const total = 40;
          const attended = Math.round(((sub.attendance_percentage || 0) / 100) * total);
          let targetTip = '';
          if (isShort) {
            const needed = Math.max(1, Math.ceil((0.85 * total - attended) / 0.15));
            targetTip = `+${needed} for 85%`;
          } else {
            const canMiss = Math.max(0, Math.floor((attended - 0.85 * total) / 0.85));
            targetTip = canMiss > 0 ? `${canMiss} safe` : 'At 85%';
          }

          const row = document.createElement('div');
          row.className = 'course-item';
          row.innerHTML = `
            <div class="course-code-wrap">
              <span class="course-code font-mono">${sub.course_code}</span>
              ${sub.cie && sub.cie !== 'N/A' ? `<span class="course-cie font-mono">CIE: ${sub.cie}</span>` : ''}
              <span class="course-recovery-tip ${isShort ? 'shortage' : 'safe'} font-mono">${targetTip}</span>
            </div>
            <div class="course-stat-wrap">
              <span class="course-pct font-mono ${isShort ? 'shortage' : 'safe'}">${sub.attendance_percentage}%</span>
              <span class="course-tag ${isShort ? 'shortage' : 'safe'}">${isShort ? '<85%' : 'Eligible'}</span>
            </div>
          `;
          breakdown.appendChild(row);
        });
      } else {
        breakdown.innerHTML = '<div class="empty-state" style="padding: 4px;">No subject rows extracted.</div>';
      }

      // Toggle expand & highlight
      header.addEventListener('click', () => {
        card.classList.toggle('expanded');
        if (activeTab) {
          chrome.tabs.sendMessage(activeTab.id, { action: 'HIGHLIGHT_STUDENT', usn: st.usn });
        }
      });

      card.appendChild(header);
      card.appendChild(breakdown);
      recordsList.appendChild(card);
    });
  }

  function renderPreviousReport(report) {
    valProcessed.textContent = `${report.processed}/${report.processed}`;
    valSuccessful.textContent = report.successful;
    valDuplicates.textContent = report.duplicates || 0;
    valFailed.textContent = report.failed || 0;

    resultNotice.className = 'result-notice success';
    const dateStr = new Date(report.timestamp).toLocaleTimeString();
    resultNotice.innerHTML = `
      <strong>Previous Sync Active</strong><br>
      Published: <strong>${report.successful}</strong> students (${dateStr})
    `;
    resultNotice.classList.remove('hidden');

    if (report.students && report.students.length > 0) {
      renderRecordsList(report.students);
    }
  }
});

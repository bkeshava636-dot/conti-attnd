/**
 * Contineo Attendance Collector - Service Worker (Manifest V3)
 * Handles lifecycle, alarms, and automatic background roster synchronization.
 */

const ALARM_NAME = 'CONTINEO_AUTO_SYNC';

chrome.runtime.onInstalled.addListener(async () => {
  console.log('[Contineo Attendance Collector] Service worker initialized v1.3.0.');
  
  // Default configuration
  const defaults = {
    backendUrl: 'https://contineo-attendance-tracker.onrender.com',
    proctorToken: 'demo-proctor-secret-key-bitm',
    autoSyncEnabled: false,
    autoSyncInterval: 30, // minutes
    lastAutoSyncTimestamp: null,
    lastSyncCount: 0
  };

  const stored = await chrome.storage.local.get(Object.keys(defaults));
  const toSet = {};
  for (const [key, val] of Object.entries(defaults)) {
    if (stored[key] === undefined) {
      toSet[key] = val;
    }
  }
  if (Object.keys(toSet).length > 0) {
    await chrome.storage.local.set(toSet);
  }

  // Restore alarm if enabled
  if (stored.autoSyncEnabled) {
    chrome.alarms.create(ALARM_NAME, {
      periodInMinutes: parseInt(stored.autoSyncInterval || 30, 10)
    });
  }

  await chrome.action.setBadgeText({ text: '' });
});

// Update badge when a Contineo tab becomes active
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab && tab.url && (tab.url.includes('contineo.in') || tab.url.includes('contineo-sims-fixture') || tab.url.includes('/fixture'))) {
      await chrome.action.setBadgeText({ text: 'ON' });
      await chrome.action.setBadgeBackgroundColor({ color: '#2563eb' });
    } else {
      await chrome.action.setBadgeText({ text: '' });
    }
  } catch (err) {
    // Tab closed
  }
});

// Listen for popup messages to control Auto-Sync alarm
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'SET_AUTO_SYNC') {
    const { enabled, intervalMinutes } = message;
    if (enabled) {
      chrome.alarms.create(ALARM_NAME, {
        periodInMinutes: parseInt(intervalMinutes, 10)
      });
      console.log(`[Auto-Sync] Scheduled every ${intervalMinutes} minutes.`);
    } else {
      chrome.alarms.clear(ALARM_NAME);
      console.log('[Auto-Sync] Background schedule cancelled.');
    }
    sendResponse({ success: true });
    return true;
  }
});

// Alarm Trigger: Automated Background Extraction
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_NAME) return;
  console.log('[Auto-Sync] Alarm triggered, scanning for open Contineo SIMS tabs...');

  try {
    const config = await chrome.storage.local.get([
      'backendUrl', 
      'proctorToken', 
      'autoSyncEnabled'
    ]);

    if (!config.autoSyncEnabled) {
      chrome.alarms.clear(ALARM_NAME);
      return;
    }

    const backendUrl = config.backendUrl || 'https://contineo-attendance-tracker.onrender.com';
    const proctorToken = config.proctorToken || 'demo-proctor-secret-key-bitm';

    // Flush any pending offline queue first
    await flushOfflineQueue(backendUrl, proctorToken);

    // Find any open Contineo tab
    const tabs = await chrome.tabs.query({});
    const targetTab = tabs.find(t => 
      t.url && (t.url.includes('contineo.in') || t.url.includes('contineo-sims-fixture') || t.url.includes('/fixture'))
    );

    if (!targetTab) {
      console.log('[Auto-Sync] No active Contineo SIMS tab open in browser. Skipping this cycle.');
      return;
    }

    console.log(`[Auto-Sync] Found eligible tab (${targetTab.id}): ${targetTab.url}`);

    // Request extraction from content script
    chrome.tabs.sendMessage(targetTab.id, { action: 'EXTRACT_ATTENDANCE' }, async (response) => {
      if (chrome.runtime.lastError || !response || !response.report || !response.report.students.length) {
        console.warn('[Auto-Sync] Tab not on attendance roster or extraction returned empty.');
        return;
      }

      const { students, diagnostics } = response.report;
      const validStudents = students.filter(s => s.usn && Array.isArray(s.subjects) && s.subjects.length > 0);

      if (validStudents.length === 0) return;

      const payload = {
        proctorId: 'proctor-bitm-cse-01',
        semester: validStudents[0]?.semester || 'SEM03',
        sourceUrl: targetTab.url,
        extractedAt: new Date().toISOString(),
        students: validStudents,
        diagnostics: {
          autoSync: true,
          totalDetected: diagnostics?.totalSectionsDetected || validStudents.length
        }
      };

      try {
        const res = await fetch(`${backendUrl}/api/attendance/publish`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${proctorToken}`
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const publishResult = await res.json();
          console.log(`[Auto-Sync] Successfully synced ${validStudents.length} students at ${new Date().toLocaleTimeString()}`);
          
          await chrome.storage.local.remove(['offlinePendingPayload']);
          await chrome.storage.local.set({
            lastAutoSyncTimestamp: new Date().toISOString(),
            lastSyncCount: validStudents.length
          });

          // Show brief visual feedback on badge
          await chrome.action.setBadgeText({ text: 'SYNC' });
          await chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
          setTimeout(async () => {
            await chrome.action.setBadgeText({ text: 'ON' });
            await chrome.action.setBadgeBackgroundColor({ color: '#2563eb' });
          }, 5000);
        } else {
          throw new Error(`HTTP ${res.status}`);
        }
      } catch (netErr) {
        console.warn('[Auto-Sync] Cloud offline, caching to offline queue:', netErr.message);
        await chrome.storage.local.set({
          offlinePendingPayload: {
            payload,
            queuedAt: new Date().toISOString(),
            studentCount: validStudents.length
          }
        });
        await chrome.action.setBadgeText({ text: 'WAIT' });
        await chrome.action.setBadgeBackgroundColor({ color: '#f59e0b' });
      }
    });

  } catch (err) {
    console.error('[Auto-Sync Error]:', err);
  }
});

async function flushOfflineQueue(backendUrl, proctorToken) {
  try {
    const data = await chrome.storage.local.get(['offlinePendingPayload']);
    if (!data.offlinePendingPayload || !data.offlinePendingPayload.payload) return;

    const { payload, studentCount } = data.offlinePendingPayload;
    console.log(`[Auto-Sync Worker] Attempting to flush offline queue (${studentCount} students)...`);

    const res = await fetch(`${backendUrl}/api/attendance/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${proctorToken}`
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      await chrome.storage.local.remove(['offlinePendingPayload']);
      console.log(`[Auto-Sync Worker] Offline queue successfully uploaded to cloud.`);
      await chrome.action.setBadgeText({ text: 'SYNC' });
      await chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
      setTimeout(async () => {
        await chrome.action.setBadgeText({ text: 'ON' });
        await chrome.action.setBadgeBackgroundColor({ color: '#2563eb' });
      }, 5000);
    }
  } catch (err) {
    console.warn('[Auto-Sync Worker] Offline flush deferred:', err.message);
  }
}

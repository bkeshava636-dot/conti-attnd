/**
 * Contineo Attendance Collector - Service Worker (Manifest V3)
 */

chrome.runtime.onInstalled.addListener(async () => {
  console.log('[Contineo Attendance Collector] Extension installed/updated.');
  
  // Set default settings if not already present
  const defaults = {
    backendUrl: 'http://localhost:5000',
    proctorToken: 'demo-proctor-secret-key-bitm',
    autoVerify: true,
    lastSyncTimestamp: null,
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

  // Set initial badge
  await chrome.action.setBadgeText({ text: '' });
  await chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
});

// Update badge when a Contineo tab becomes active
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab && tab.url && (tab.url.includes('contineo.in') || tab.url.includes('contineo-sims-fixture.html'))) {
      await chrome.action.setBadgeText({ text: 'ON' });
      await chrome.action.setBadgeBackgroundColor({ color: '#0284c7' });
    } else {
      await chrome.action.setBadgeText({ text: '' });
    }
  } catch (err) {
    // Tab might be closing or protected
  }
});

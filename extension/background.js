const STATE_KEY = "hncc_state";
const CONFIG_KEY = "hncc_config";
const SYNC_ALARM = "hncc_periodic_sync";

let commentState = {};
let syncConfig = {
  apiBaseUrl: "",
  token: "",
  deviceId: "",
  userEmail: "",
};

let stateLoaded = false;
let syncInFlight = false;

async function loadState() {
  if (stateLoaded) {
    return;
  }

  const stored = await chrome.storage.local.get([STATE_KEY, CONFIG_KEY]);
  commentState = stored[STATE_KEY] || {};
  syncConfig = {
    ...syncConfig,
    ...(stored[CONFIG_KEY] || {}),
  };
  stateLoaded = true;
}

async function persistState() {
  await chrome.storage.local.set({
    [STATE_KEY]: commentState,
    [CONFIG_KEY]: syncConfig,
  });
}

function normalizeRecord(input, defaultPageKey) {
  const now = Date.now();
  return {
    commentKey: String(input.commentKey || ""),
    pageKey: String(input.pageKey || defaultPageKey || ""),
    url: String(input.url || ""),
    title: String(input.title || "Untitled thread"),
    site: String(input.site || "Unknown"),
    collapsed: Boolean(input.collapsed),
    updatedAt: Number.isFinite(input.updatedAt) ? Number(input.updatedAt) : now,
    dirty: input.dirty !== false,
  };
}

function mergeServerStates(states) {
  for (const record of states) {
    if (!record || !record.commentKey) {
      continue;
    }

    const existing = commentState[record.commentKey];
    if (!existing || Number(record.updatedAt) >= Number(existing.updatedAt || 0)) {
      commentState[record.commentKey] = {
        ...normalizeRecord(record),
        dirty: false,
      };
    }
  }
}

async function syncToServer() {
  await loadState();

  if (syncInFlight) {
    return { ok: false, message: "Sync already running." };
  }

  if (!syncConfig.apiBaseUrl || !syncConfig.token) {
    return { ok: false, message: "Configure API URL and log in from popup first." };
  }

  const updates = Object.values(commentState).filter((record) => record.dirty);

  if (updates.length === 0) {
    return { ok: true, message: "State is already up to date.", pushed: 0 };
  }

  syncInFlight = true;

  try {
    const response = await fetch(`${syncConfig.apiBaseUrl}/api/comments/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${syncConfig.token}`,
      },
      body: JSON.stringify({
        deviceId: syncConfig.deviceId,
        updates,
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return { ok: false, message: data?.error || "Sync failed." };
    }

    if (Array.isArray(data?.states)) {
      mergeServerStates(data.states);
    }

    for (const record of updates) {
      const existing = commentState[record.commentKey];
      if (existing) {
        existing.dirty = false;
      }
    }

    await persistState();

    return { ok: true, message: "Sync complete.", pushed: updates.length };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Unexpected sync error." };
  } finally {
    syncInFlight = false;
  }
}

async function fetchFromServer() {
  await loadState();

  if (!syncConfig.apiBaseUrl || !syncConfig.token) {
    return;
  }

  try {
    const response = await fetch(`${syncConfig.apiBaseUrl}/api/comments/sync`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${syncConfig.token}`,
      },
    });

    if (!response.ok) {
      return;
    }

    const data = await response.json().catch(() => null);
    if (Array.isArray(data?.states)) {
      mergeServerStates(data.states);
      await persistState();
    }
  } catch {
    // Ignore network failures; periodic sync will retry.
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  await loadState();
  chrome.alarms.create(SYNC_ALARM, { periodInMinutes: 3 });
});

chrome.runtime.onStartup.addListener(async () => {
  await loadState();
  chrome.alarms.create(SYNC_ALARM, { periodInMinutes: 3 });
  await fetchFromServer();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== SYNC_ALARM) {
    return;
  }

  await syncToServer();
  await fetchFromServer();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  void (async () => {
    await loadState();

    if (message?.type === "HNCC_GET_PAGE_STATE") {
      const pageKey = String(message.pageKey || "");
      const result = {};

      for (const [key, value] of Object.entries(commentState)) {
        if (key.startsWith(`${pageKey}::`)) {
          result[key] = value;
        }
      }

      sendResponse({ ok: true, state: result });
      return;
    }

    if (message?.type === "HNCC_SET_COMMENT_STATE") {
      const record = normalizeRecord(message.record || {}, message.pageKey);
      if (!record.commentKey) {
        sendResponse({ ok: false, message: "commentKey is required." });
        return;
      }

      const existing = commentState[record.commentKey];
      if (!existing || record.updatedAt >= Number(existing.updatedAt || 0)) {
        commentState[record.commentKey] = record;
        await persistState();
      }

      sendResponse({ ok: true });
      return;
    }

    if (message?.type === "HNCC_GET_CONFIG") {
      sendResponse({
        ok: true,
        config: syncConfig,
      });
      return;
    }

    if (message?.type === "HNCC_SET_CONFIG") {
      syncConfig = {
        ...syncConfig,
        ...(message.config || {}),
      };

      if (!syncConfig.deviceId) {
        syncConfig.deviceId = self.crypto?.randomUUID?.() || `device-${Date.now()}`;
      }

      await persistState();
      await fetchFromServer();
      sendResponse({ ok: true, config: syncConfig });
      return;
    }

    if (message?.type === "HNCC_TRIGGER_SYNC") {
      const result = await syncToServer();
      if (result.ok) {
        await fetchFromServer();
      }
      sendResponse(result);
      return;
    }

    sendResponse({ ok: false, message: "Unknown message type." });
  })();

  return true;
});

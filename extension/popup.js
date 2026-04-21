const baseUrlInput = document.getElementById("baseUrl");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("loginButton");
const syncButton = document.getElementById("syncButton");
const statusEl = document.getElementById("status");

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? "#fca5a5" : "#cbd5e1";
}

function sendMessage(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      resolve(response);
    });
  });
}

async function loadConfig() {
  const response = await sendMessage({ type: "HNCC_GET_CONFIG" });
  if (!response?.ok) {
    return;
  }

  const config = response.config || {};
  baseUrlInput.value = config.apiBaseUrl || "";
  emailInput.value = config.userEmail || "";

  if (config.apiBaseUrl && config.token) {
    setStatus(`Connected as ${config.userEmail || "your account"}.`);
  }
}

async function handleLogin() {
  const apiBaseUrl = baseUrlInput.value.trim().replace(/\/$/, "");
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!apiBaseUrl || !email || !password) {
    setStatus("Provide app URL, email, and password.", true);
    return;
  }

  setStatus("Requesting extension token...");

  const existingConfig = await sendMessage({ type: "HNCC_GET_CONFIG" });
  const deviceId = existingConfig?.config?.deviceId || self.crypto?.randomUUID?.() || `device-${Date.now()}`;

  try {
    const response = await fetch(`${apiBaseUrl}/api/auth/extension-login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        deviceId,
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.token) {
      setStatus(data?.error || "Unable to connect extension.", true);
      return;
    }

    await sendMessage({
      type: "HNCC_SET_CONFIG",
      config: {
        apiBaseUrl,
        token: data.token,
        deviceId,
        userEmail: email,
      },
    });

    passwordInput.value = "";
    setStatus(`Connected and ready. Token issued for ${email}.`);
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Connection error.", true);
  }
}

async function handleSync() {
  setStatus("Syncing comment state...");
  const response = await sendMessage({ type: "HNCC_TRIGGER_SYNC" });

  if (!response?.ok) {
    setStatus(response?.message || "Sync failed.", true);
    return;
  }

  if (response.pushed > 0) {
    setStatus(`Sync complete. Uploaded ${response.pushed} updated comment records.`);
    return;
  }

  setStatus(response.message || "Sync complete.");
}

loginButton.addEventListener("click", handleLogin);
syncButton.addEventListener("click", handleSync);

loadConfig();

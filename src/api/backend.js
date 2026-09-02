const API_BASE_URL = (() => {
  const configured = import.meta.env.VITE_API_BASE_URL || "";
  if (configured) {
    return configured.replace(/^https:\/\/localhost/i, "http://localhost").replace(/^https:\/\/127\.0\.0\.1/i, "http://127.0.0.1");
  }
  return "http://127.0.0.1:8000";
})();

function getStoredToken() {
  return localStorage.getItem("sentinelai_token");
}

function setStoredToken(token) {
  localStorage.setItem("sentinelai_token", token);
}

function clearStoredToken() {
  localStorage.removeItem("sentinelai_token");
}

async function isStoredTokenValid(token) {
  if (!token) {
    return false;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function ensureSession() {
  const existingToken = getStoredToken();
  if (existingToken) {
    const isValid = await isStoredTokenValid(existingToken);
    if (isValid) {
      return existingToken;
    }
    clearStoredToken();
  }

  const demoUser = {
    username: "demo",
    email: "demo@sentinelai.dev",
    password: "demo123",
  };

  try {
    const registerResponse = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(demoUser),
    });

    if (!registerResponse.ok && registerResponse.status !== 409) {
      throw new Error("Unable to register a demo user.");
    }
  } catch {
    // Keep going; the token endpoint may still succeed in development mode.
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        username: demoUser.username,
        password: demoUser.password,
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (response.ok && payload.access_token) {
      setStoredToken(payload.access_token);
      return payload.access_token;
    }

    if (payload.message) {
      throw new Error(payload.message);
    }
  } catch (error) {
    clearStoredToken();
    throw new Error(error.message || "Unable to authenticate with the SentinelAI backend.", { cause: error });
  }

  clearStoredToken();
  throw new Error("Unable to authenticate with the SentinelAI backend.");
}

export async function uploadMedia(mediaType, file) {
  let token = await ensureSession();
  const formData = new FormData();
  formData.append("file", file);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/v1/uploads/${mediaType}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
  } catch (err) {
    throw new Error("Network error: Unable to connect to SentinelAI backend.", { cause: err });
  }

  if (response.status === 401) {
    clearStoredToken();
    token = await ensureSession();
    try {
      response = await fetch(`${API_BASE_URL}/api/v1/uploads/${mediaType}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
    } catch (err) {
      throw new Error("Network error: Unable to connect to SentinelAI backend.", { cause: err });
    }
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMsg =
      payload.message ||
      payload.detail ||
      (response.status === 413
        ? "File size exceeds the allowed limit."
        : response.status === 400
        ? "Invalid file format or unsupported media."
        : `Upload failed (HTTP ${response.status}).`);
    throw new Error(errorMsg);
  }

  return payload;
}

export async function startLiveCameraSession() {
  let token = await ensureSession();

  let response = await fetch(`${API_BASE_URL}/api/v1/live/camera`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    clearStoredToken();
    token = await ensureSession();
    response = await fetch(`${API_BASE_URL}/api/v1/live/camera`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || "Unable to start the live camera session.");
  }

  return payload;
}

export async function sendLiveAudioChunk({ file, sessionId, chunkIndex, clientTranscript }) {
  let token = await ensureSession();
  const formData = new FormData();
  formData.append("file", file);
  formData.append("session_id", sessionId);
  formData.append("chunk_index", String(chunkIndex));
  if (clientTranscript) {
    formData.append("client_transcript", clientTranscript);
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/v1/live/audio`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
  } catch (err) {
    throw new Error("Network error: Unable to connect to SentinelAI live service.", { cause: err });
  }

  if (response.status === 401) {
    clearStoredToken();
    token = await ensureSession();
    try {
      response = await fetch(`${API_BASE_URL}/api/v1/live/audio`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
    } catch (err) {
      throw new Error("Network error: Unable to connect to SentinelAI live service.", { cause: err });
    }
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMsg =
      payload.message ||
      payload.detail ||
      `Live audio chunk analysis failed (HTTP ${response.status}).`;
    throw new Error(errorMsg);
  }

  return payload;
}

export async function stopLiveSession(summary) {
  let token = await ensureSession();

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/live/session/stop`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(summary),
    });
    return await response.json().catch(() => ({ success: true }));
  } catch {
    return { success: true };
  }
}

// ---------------------------------------------------------------------------
// Multi-Channel Threat Scanner API
// ---------------------------------------------------------------------------

async function _postThreat(endpoint, body) {
  let token = await ensureSession();

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/v1/threat/${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new Error("Network error: Unable to connect to SentinelAI backend.", { cause: err });
  }

  if (response.status === 401) {
    clearStoredToken();
    token = await ensureSession();
    try {
      response = await fetch(`${API_BASE_URL}/api/v1/threat/${endpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      throw new Error("Network error: Unable to connect to SentinelAI backend.", { cause: err });
    }
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMsg =
      payload.message ||
      payload.detail ||
      `Threat scan failed (HTTP ${response.status}).`;
    throw new Error(errorMsg);
  }
  return payload;
}

/** Analyze an email for phishing / scam indicators. */
export async function scanEmail({ sender, subject, body }) {
  return _postThreat("email", { sender, subject, body });
}

/** Analyze a URL for phishing indicators via structural heuristics. */
export async function scanUrl({ url }) {
  return _postThreat("url", { url });
}

/** Analyze an SMS/message for smishing / scam patterns. */
export async function scanSms({ message }) {
  return _postThreat("sms", { message });
}

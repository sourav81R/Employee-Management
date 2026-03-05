import { buildApiUrl } from "./apiBase";

function getToken() {
  return localStorage.getItem("token") || "";
}

function getHeaders(extra = {}) {
  const token = getToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function request(path, options = {}) {
  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers: getHeaders(options.headers || {}),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.message || `Request failed: ${response.status}`);
  }

  return response.json().catch(() => ({}));
}

export function apiGet(path) {
  return request(path, { method: "GET" });
}

export function apiPost(path, body) {
  return request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
}

export function apiPut(path, body) {
  return request(path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
}

export function apiPatch(path, body) {
  return request(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
}

export function apiDelete(path) {
  return request(path, { method: "DELETE" });
}

export async function downloadFile(path, fallbackName = "download.pdf") {
  const response = await fetch(buildApiUrl(path), {
    method: "GET",
    headers: getHeaders(),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.message || "Download failed");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fallbackName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function apiUpload(path, formData) {
  const response = await fetch(buildApiUrl(path), {
    method: "POST",
    headers: getHeaders(),
    body: formData,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.message || "Upload failed");
  }

  return response.json().catch(() => ({}));
}

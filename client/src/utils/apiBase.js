const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);

function normalizeBaseUrl(url) {
  const trimmed = (url || "").trim().replace(/\/$/, "");
  return trimmed.endsWith("/api") ? trimmed.slice(0, -4) : trimmed;
}

function isLocalRuntime() {
  if (typeof window === "undefined") return true;
  return LOCAL_HOSTNAMES.has(window.location.hostname);
}

export function resolveApiBaseUrl() {
  const envBase = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || "";
  if (envBase) return normalizeBaseUrl(envBase);
  return isLocalRuntime() ? "" : "";
}

export function buildApiUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${resolveApiBaseUrl()}${normalizedPath}`;
}

export function isApiConfigMissingInProduction() {
  const envBase = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || "";
  return !envBase && !isLocalRuntime();
}

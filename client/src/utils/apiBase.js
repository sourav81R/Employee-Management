const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);
const PROD_API_FALLBACK = "https://employee-management-etc0.onrender.com";

function normalizeBaseUrl(url) {
  const trimmed = (url || "").trim().replace(/\/$/, "");
  return trimmed.endsWith("/api") ? trimmed.slice(0, -4) : trimmed;
}

function isLocalRuntime() {
  if (typeof window === "undefined") return true;
  return LOCAL_HOSTNAMES.has(window.location.hostname);
}

function isSameHostAsFrontend(url) {
  if (typeof window === "undefined" || !url) return false;
  try {
    return new URL(url).host === window.location.host;
  } catch (_err) {
    return false;
  }
}

export function resolveApiBaseUrl() {
  const envBase = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || "";
  const normalizedEnvBase = normalizeBaseUrl(envBase);

  if (normalizedEnvBase) {
    // Guard against a common deployment mistake: env points to the Vercel frontend itself.
    if (!isLocalRuntime() && isSameHostAsFrontend(normalizedEnvBase)) {
      return PROD_API_FALLBACK;
    }
    return normalizedEnvBase;
  }

  return isLocalRuntime() ? "" : PROD_API_FALLBACK;
}

export function buildApiUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${resolveApiBaseUrl()}${normalizedPath}`;
}

export function isApiConfigMissingInProduction() {
  const envBase = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || "";
  return !envBase && !isLocalRuntime();
}

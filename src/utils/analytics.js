// src/utils/analytics.js
// Consent-gated analytics via a self-hosted Rybbit instance (https://rybbit.com).
//
// The Rybbit script is injected only when analytics is enabled AND the user has not opted out.
// Rybbit tracks navigation itself (including hash routes), so there is no manual pageview call.
// Custom events go through trackEvent(); election / region are merged into every event.

import { sanitizeEventProps } from "./analyticsProps";

const analyticsEnabled = import.meta.env.VITE_RYBBIT_ENABLED === "true";
const host = String(import.meta.env.VITE_RYBBIT_HOST || "").replace(/\/+$/, "");
const siteId = import.meta.env.VITE_RYBBIT_SITE_ID;

// Rybbit checks this key once, when its script loads, and then stays silent
const OPT_OUT_KEY = "disable-rybbit";
const STATS_ID_KEY = "statsId";

let scriptRequested = false;
let scriptLoaded = false;
let context = {}; // merged into every event (election, region_id)
const pending = []; // calls made before the script finished loading

function isConfigured() {
  return analyticsEnabled && !!host && !!siteId && typeof document !== "undefined";
}

// Check if user has given consent for analytics
function hasAnalyticsConsent() {
  try {
    const consent = localStorage.getItem("analyticsConsent");
    // Default to true (opt-out approach) if no preference set
    return consent === null ? true : consent === "true";
  } catch (err) {
    console.warn("Failed to check analytics consent:", err);
    return true; // Default to true if localStorage fails
  }
}

function isActive() {
  return isConfigured() && hasAnalyticsConsent();
}

function rybbit() {
  return typeof window !== "undefined" ? window.rybbit : undefined;
}

// Anonymous id of our own (Rybbit does not expose its visitor id). Stored in the database as
// `stats_id` to cross-reference a submission with analytics; only created and used with consent.
function getOrCreateStatsId() {
  try {
    let id = localStorage.getItem(STATS_ID_KEY);
    if (!id) {
      id = `s_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(STATS_ID_KEY, id);
    }
    return id;
  } catch {
    return undefined;
  }
}

function flush() {
  const api = rybbit();
  if (!api) return;
  while (pending.length) {
    const [method, args] = pending.shift();
    try {
      api[method]?.(...args);
    } catch (err) {
      console.warn(`Rybbit ${method} failed:`, err);
    }
  }
}

function call(method, ...args) {
  if (!isActive()) return;
  const api = rybbit();
  if (scriptLoaded && api) {
    try {
      api[method]?.(...args);
    } catch (err) {
      console.warn(`Rybbit ${method} failed:`, err);
    }
  } else {
    pending.push([method, args]);
  }
}

function loadScript() {
  if (!isActive() || scriptRequested) return;
  scriptRequested = true;

  try {
    localStorage.removeItem(OPT_OUT_KEY);
  } catch { /* ignore storage errors */ }

  const el = document.createElement("script");
  el.src = `${host}/api/script.js?siteId=${encodeURIComponent(siteId)}`;
  el.async = true;
  // Tag every event with the election build (segment national vs regional in Rybbit)
  const tag = import.meta.env.VITE_ELECTION_ID;
  if (tag) el.setAttribute("data-tag", String(tag).slice(0, 256));
  // Saved-result links carry the mnemonic (?r=…), which encodes the answers: Rybbit records the hash
  // route as the page path, so mask any path containing it
  el.setAttribute("data-mask-patterns", JSON.stringify(["re:[?&]r="]));
  el.onload = () => {
    scriptLoaded = true;
    const id = getOrCreateStatsId();
    if (id) rybbit()?.identify?.(id);
    flush();
  };
  el.onerror = () => {
    console.warn("Rybbit script failed to load (blocked or host unreachable)");
    scriptRequested = false;
    pending.length = 0;
  };
  document.head.appendChild(el);
}

// Load on startup when allowed
if (isConfigured()) {
  loadScript();
} else if (analyticsEnabled) {
  console.warn("Rybbit analytics enabled but VITE_RYBBIT_HOST or VITE_RYBBIT_SITE_ID is missing");
}

// Store analytics consent preference
export function setAnalyticsConsent(consent) {
  try {
    localStorage.setItem("analyticsConsent", consent ? "true" : "false");
  } catch (err) {
    console.warn("Failed to save analytics consent:", err);
  }

  if (consent) {
    loadScript();
    return;
  }

  // Withdrawal: forget the id and make Rybbit stay silent on the next load. A script that is
  // already running keeps its automatic tracking until the page reloads (the settings page reloads).
  try {
    rybbit()?.clearUserId?.();
    localStorage.setItem(OPT_OUT_KEY, "1");
    localStorage.removeItem(STATS_ID_KEY);
  } catch { /* ignore storage errors */ }
  pending.length = 0;
}

// Get current consent status
export function getAnalyticsConsent() {
  return hasAnalyticsConsent();
}

// Extra properties merged into every event, e.g. { election, region_id }
export function setAnalyticsContext(next) {
  context = { ...context, ...sanitizeEventProps(next) };
}

export function trackEvent(name, params = {}) {
  if (!isActive()) {
    console.debug("[analytics disabled or no consent]", name, params);
    return;
  }
  call("event", name, { ...context, ...sanitizeEventProps(params) });
}

// Errors caught by an error boundary never reach Rybbit's automatic error tracking
export function reportError(error, params = {}) {
  if (!isActive()) return;
  call("error", error, sanitizeEventProps({ ...context, ...params }));
}

// Anonymous analytics id stored with a submission (null without consent or when disabled)
export function statsUserId() {
  if (!isActive()) return undefined;
  return getOrCreateStatsId();
}

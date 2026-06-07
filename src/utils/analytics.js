// src/analytics.js
// Analytics tracking via trench-js

import Trench from 'trench-js';

const analyticsEnabled = import.meta.env.VITE_TRENCH_ENABLED === "true";
const serverUrl = import.meta.env.VITE_TRENCH_SERVER_URL;
const publicApiKey = import.meta.env.VITE_TRENCH_PUBLIC_API_KEY;

let trench = null;

// Check if user has given consent for analytics
function hasAnalyticsConsent() {
  try {
    const consent = localStorage.getItem('analyticsConsent');
    // Default to true (opt-out approach) if no preference set
    return consent === null ? true : consent === 'true';
  } catch (err) {
    console.warn("Failed to check analytics consent:", err);
    return true; // Default to true if localStorage fails
  }
}

// Initialize trench if analytics is enabled
if (analyticsEnabled && serverUrl && publicApiKey) {
  try {
    trench = new Trench({
      serverUrl: serverUrl,
      publicApiKey: publicApiKey,
    });
    console.log("Trench analytics initialized");
  } catch (err) {
    console.warn("Failed to initialize Trench:", err);
  }
} else {
  if (analyticsEnabled) {
    console.warn("Trench analytics enabled but missing serverUrl or publicApiKey");
  } else {
    console.log("Trench analytics disabled by env");
  }
}

// Store analytics consent preference
export function setAnalyticsConsent(consent) {
  try {
    localStorage.setItem('analyticsConsent', consent ? 'true' : 'false');
  } catch (err) {
    console.warn("Failed to save analytics consent:", err);
  }
}

// Get current consent status
export function getAnalyticsConsent() {
  return hasAnalyticsConsent();
}

export function trackEvent(name, params = {}) {
  if (!analyticsEnabled || !trench || !hasAnalyticsConsent()) {
    console.debug("[analytics disabled or no consent]", name, params);
    return;
  }

  try {
    trench.track(name, params);
  } catch (err) {
    console.warn("Trench track failed:", err);
  }
}

export function pageView(path, extra = {}) {
  if (!analyticsEnabled || !trench || !hasAnalyticsConsent()) {
    console.debug("[analytics disabled or no consent] page view:", path);
    return;
  }

  try {
    trench.page({
      path: path,
      ...extra
    });
  } catch (err) {
    console.warn("Trench page failed:", err);
  }
}

export function statsUserId() {
  if (!analyticsEnabled || !trench) {
    console.debug("[analytics disabled]");
    return;
  }

  try {
    return trench.analytics.user('userId');
  } catch (err) {
    console.warn("Trench user failed:", err);
  }
}

export function identifyUser(userId, traits = {}) {
  if (!analyticsEnabled || !trench) {
    console.debug("[analytics disabled] identify:", userId);
    return;
  }

  try {
    trench.identify(userId, traits);
  } catch (err) {
    console.warn("Trench identify failed:", err);
  }
}
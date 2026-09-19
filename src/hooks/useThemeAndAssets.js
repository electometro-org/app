import { useEffect } from "react";
import { colors } from "../config/colors";

/**
 * useThemeAndAssets
 * Manages: theme CSS variables + election CSS imports + fingerprint sync
 * Side-effect-only hook (no state exposed)
 *
 * Args:
 * - election: current election ID
 * - fingerprint: fingerprint value to sync
 */
export function useThemeAndAssets({ election, fingerprint, electionConfigs: configs }) {
  // Apply theme CSS variables
  useEffect(() => {
    const currentConfig = election ? configs[election] : null;
    const themeColors = { ...colors, ...currentConfig?.theme };

    Object.entries(themeColors).forEach(([key, hex]) => {
      document.documentElement.style.setProperty(`--${key}`, hex);
    });
  }, [election, configs]);

  // Load election-specific CSS (a config can reuse another election's styles via styleId)
  useEffect(() => {
    if (election) {
      const styleId = configs[election]?.styleId ?? election;
      document.documentElement.dataset.election = styleId;
      import(`../elections/${styleId}.css`).catch(() => {});
    } else {
      delete document.documentElement.dataset.election;
    }
  }, [election, configs]);

  // Sync fingerprint to sessionStorage
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && fingerprint) {
        window.sessionStorage.setItem("fingerprint", fingerprint);
      }
    } catch { /* ignore sessionStorage errors */ }
  }, [fingerprint]);
}

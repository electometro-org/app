import { useEffect } from "react";
import { colors } from "../config/colors";
import { electionConfigs } from "../elections";

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

  // Load election-specific CSS
  useEffect(() => {
    if (election) {
      document.documentElement.dataset.election = election;
      import(`../elections/${election}.css`).catch(() => {});
    } else {
      delete document.documentElement.dataset.election;
    }
  }, [election]);

  // Sync fingerprint to sessionStorage
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && fingerprint) {
        window.sessionStorage.setItem("fingerprint", fingerprint);
      }
    } catch (_) {}
  }, [fingerprint]);
}

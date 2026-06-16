import { useEffect } from "react";
import { useFingerprint } from "./useFingerprint";
import { colors } from "../config/colors";

/**
 * useThemeAndAssets - Side-effect-only: theme CSS variables, election CSS import, fingerprint sync
 */
export function useThemeAndAssets(election, electionConfigs) {
  const { fingerprint } = useFingerprint();

  // Apply theme CSS variables
  useEffect(() => {
    const currentConfig = election ? electionConfigs[election] : null;
    const themeColors = { ...colors, ...currentConfig?.theme };

    Object.entries(themeColors).forEach(([key, hex]) => {
      document.documentElement.style.setProperty(`--${key}`, hex);
    });
  }, [election, electionConfigs]);

  // Load election-specific CSS
  useEffect(() => {
    if (election) {
      document.documentElement.dataset.election = election;
      import(`../elections/${election}.css`).catch(() => {});
    } else {
      delete document.documentElement.dataset.election;
    }
  }, [election]);

  // Fingerprint → sessionStorage sync
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && fingerprint) {
        window.sessionStorage.setItem("fingerprint", fingerprint);
      }
    } catch (_) {}
  }, [fingerprint]);
}

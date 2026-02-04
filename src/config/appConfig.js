// Application configuration for intro screens and flow control

// Parse election IDs from environment (supports comma-separated list)
const rawElectionIds = import.meta.env.VITE_ELECTION_ID || '';
export const configuredElectionIds = rawElectionIds
  ? rawElectionIds.split(',').map(id => id.trim()).filter(Boolean)
  : [];

// Single election mode: only when exactly one election ID is specified
export const isSingleElectionMode = configuredElectionIds.length === 1;
export const preSelectedElectionId = isSingleElectionMode ? configuredElectionIds[0] : null;

// Generic intro screen configuration
// - Shown before election selection (neutral branding)
// - Skipped automatically when VITE_ELECTION_ID is set (single-election build)
// - Can be explicitly disabled via VITE_SHOW_GENERIC_INTRO=false
export const showGenericIntro = (() => {
  // If explicitly set in env, use that value
  if (import.meta.env.VITE_SHOW_GENERIC_INTRO !== undefined) {
    return import.meta.env.VITE_SHOW_GENERIC_INTRO !== 'false';
  }
  // Default: skip generic intro in single-election mode
  return !preSelectedElectionId;
})();

// Election-specific intro screen configuration
// - Shown after election is selected, before quiz starts
// - Uses election-specific branding
// - Can be disabled globally via VITE_SHOW_ELECTION_INTRO=false
// - Can also be controlled per-election in the election config (showIntro: true/false)
export const showElectionIntroDefault = import.meta.env.VITE_SHOW_ELECTION_INTRO !== 'false';

// Helper to determine if election intro should be shown for a specific election
export function shouldShowElectionIntro(electionConfig) {
  // Per-election override takes precedence
  if (electionConfig?.showIntro !== undefined) {
    return electionConfig.showIntro;
  }
  // Otherwise use global default
  return showElectionIntroDefault;
}
// Branding configuration
// Supports neutral branding (multiple elections) and election-specific branding

const BASE_URL = import.meta.env.BASE_URL;

// When true: use election-specific branding once a user selects an election
// When false: always use neutral branding throughout the session (even after election selected)
// This can be controlled via environment variable or set directly here
export const useElectionBranding = import.meta.env.VITE_USE_ELECTION_BRANDING !== 'false';

// Helper to resolve asset path
function resolveAssetPath(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  if (path.startsWith('/')) return `${BASE_URL}${path.slice(1)}`;
  return `${BASE_URL}${path}`;
}

// Neutral/default branding (used when multiple elections or no specific election)
export const defaultBranding = {
  logo: resolveAssetPath('/favicon.svg'),           // Generic logo
  logoAlt: resolveAssetPath('/favicon.svg'),    // Generic alternative logo
  favicon: resolveAssetPath('/favicon.svg'),

  // Dimensions
  logoWidth: 100,
  logoHeight: 100,
};

// Get branding for a specific election config
// Returns election-specific branding if defined, otherwise defaults
export function getBranding(electionConfig) {
  if (!electionConfig?.branding) {
    return defaultBranding;
  }

  const electionBranding = electionConfig.branding;

  return {
    logo: resolveAssetPath(electionBranding.logo) || defaultBranding.logo,
    logoAlt: resolveAssetPath(electionBranding.logoAlt) || defaultBranding.logoAlt,
    favicon: resolveAssetPath(electionBranding.favicon) || defaultBranding.favicon,
    logoWidth: electionBranding.logoWidth ?? defaultBranding.logoWidth,
    logoHeight: electionBranding.logoHeight ?? defaultBranding.logoHeight,
  };
}
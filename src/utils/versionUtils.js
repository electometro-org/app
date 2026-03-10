/**
 * Version Utilities for Quiz Versioning System
 *
 * Handles semantic versioning (major.minor.patch) for tracking quiz data versions
 * across Excel → JSON → App → Database.
 */

/**
 * Parse a version string into components
 * @param {string} version - Version string like "1.2.3"
 * @returns {{ major: number, minor: number, patch: number } | null}
 */
export function parseVersion(version) {
  if (!version || typeof version !== "string") {
    return null;
  }

  const trimmed = version.trim();
  const match = trimmed.match(/^(\d+)\.(\d+)\.(\d+)$/);

  if (!match) {
    return null;
  }

  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

/**
 * Compare two version strings
 * @param {string | null} versionA - First version (e.g., restored version)
 * @param {string | null} versionB - Second version (e.g., current quiz version)
 * @returns {'exact' | 'patch' | 'minor' | 'major' | 'invalid'}
 */
export function compareVersions(versionA, versionB) {
  const parsedA = parseVersion(versionA);
  const parsedB = parseVersion(versionB);

  // If either version is invalid/null, return 'invalid'
  if (!parsedA || !parsedB) {
    return "invalid";
  }

  // Exact match
  if (
    parsedA.major === parsedB.major &&
    parsedA.minor === parsedB.minor &&
    parsedA.patch === parsedB.patch
  ) {
    return "exact";
  }

  // Major version differs
  if (parsedA.major !== parsedB.major) {
    return "major";
  }

  // Minor version differs (major is same)
  if (parsedA.minor !== parsedB.minor) {
    return "minor";
  }

  // Patch version differs (major and minor are same)
  return "patch";
}

/**
 * Encode a version string for mnemonic suffix
 * @param {string} version - Version string like "1.2.3"
 * @returns {string | null} Encoded version like "v1_2_3", or null if invalid
 */
export function encodeVersionForMnemonic(version) {
  const parsed = parseVersion(version);
  if (!parsed) {
    return null;
  }

  return `v${parsed.major}_${parsed.minor}_${parsed.patch}`;
}

/**
 * Decode a version suffix from mnemonic
 * @param {string} encoded - Encoded version like "v1_2_3"
 * @returns {string | null} Decoded version like "1.2.3", or null if invalid
 */
export function decodeVersionFromMnemonic(encoded) {
  if (!encoded || typeof encoded !== "string") {
    return null;
  }

  const trimmed = encoded.trim();
  const match = trimmed.match(/^v(\d+)_(\d+)_(\d+)$/);

  if (!match) {
    return null;
  }

  return `${match[1]}.${match[2]}.${match[3]}`;
}

/**
 * Check if a string is a valid version suffix
 * @param {string} str - String to check
 * @returns {boolean} True if string matches version suffix format
 */
export function isVersionSuffix(str) {
  if (!str || typeof str !== "string") {
    return false;
  }

  return /^v\d+_\d+_\d+$/.test(str.trim());
}

/**
 * Check if versionA is greater than versionB
 * @param {string | null} versionA - First version
 * @param {string | null} versionB - Second version
 * @returns {boolean} True if versionA > versionB, false otherwise (including if either is invalid)
 */
export function isVersionGreaterThan(versionA, versionB) {
  const parsedA = parseVersion(versionA);
  const parsedB = parseVersion(versionB);

  if (!parsedA || !parsedB) {
    return false;
  }

  if (parsedA.major > parsedB.major) return true;
  if (parsedA.major < parsedB.major) return false;

  if (parsedA.minor > parsedB.minor) return true;
  if (parsedA.minor < parsedB.minor) return false;

  return parsedA.patch > parsedB.patch;
}

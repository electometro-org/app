import { describe, it, expect } from 'vitest';
import {
  parseVersion,
  compareVersions,
  encodeVersionForMnemonic,
  decodeVersionFromMnemonic,
  isVersionSuffix,
  isVersionGreaterThan,
} from '../versionUtils';

describe('parseVersion', () => {
  it('parses valid version strings', () => {
    expect(parseVersion('1.2.3')).toEqual({ major: 1, minor: 2, patch: 3 });
    expect(parseVersion('0.0.0')).toEqual({ major: 0, minor: 0, patch: 0 });
    expect(parseVersion('10.20.30')).toEqual({ major: 10, minor: 20, patch: 30 });
  });

  it('returns null for null and undefined', () => {
    expect(parseVersion(null)).toBeNull();
    expect(parseVersion(undefined)).toBeNull();
  });

  it('returns null for invalid formats', () => {
    expect(parseVersion('1.2')).toBeNull();
    expect(parseVersion('1.2.3.4')).toBeNull();
    expect(parseVersion('v1.2.3')).toBeNull();
    expect(parseVersion('abc')).toBeNull();
    expect(parseVersion('')).toBeNull();
  });
});

describe('compareVersions', () => {
  it('returns "exact" for identical versions', () => {
    expect(compareVersions('1.2.3', '1.2.3')).toBe('exact');
  });

  it('returns "patch" when only patch differs', () => {
    expect(compareVersions('1.2.3', '1.2.4')).toBe('patch');
    expect(compareVersions('1.2.9', '1.2.0')).toBe('patch');
  });

  it('returns "minor" when minor differs (major same)', () => {
    expect(compareVersions('1.2.3', '1.3.0')).toBe('minor');
    expect(compareVersions('1.0.0', '1.5.9')).toBe('minor');
  });

  it('returns "major" when major differs', () => {
    expect(compareVersions('1.0.0', '2.0.0')).toBe('major');
    expect(compareVersions('3.1.0', '1.1.0')).toBe('major');
  });

  it('returns "invalid" for null or unparseable versions', () => {
    expect(compareVersions(null, '1.0.0')).toBe('invalid');
    expect(compareVersions('1.0.0', null)).toBe('invalid');
    expect(compareVersions(null, null)).toBe('invalid');
    expect(compareVersions('bad', '1.0.0')).toBe('invalid');
  });
});

describe('encodeVersionForMnemonic', () => {
  it('encodes a valid version string', () => {
    expect(encodeVersionForMnemonic('1.2.3')).toBe('v1_2_3');
    expect(encodeVersionForMnemonic('0.0.0')).toBe('v0_0_0');
    expect(encodeVersionForMnemonic('10.20.30')).toBe('v10_20_30');
  });

  it('returns null for invalid versions', () => {
    expect(encodeVersionForMnemonic(null)).toBeNull();
    expect(encodeVersionForMnemonic('1.2')).toBeNull();
    expect(encodeVersionForMnemonic('v1.2.3')).toBeNull();
  });
});

describe('decodeVersionFromMnemonic', () => {
  it('decodes a valid encoded version', () => {
    expect(decodeVersionFromMnemonic('v1_2_3')).toBe('1.2.3');
    expect(decodeVersionFromMnemonic('v0_0_0')).toBe('0.0.0');
    expect(decodeVersionFromMnemonic('v10_20_30')).toBe('10.20.30');
  });

  it('returns null for invalid encoded versions', () => {
    expect(decodeVersionFromMnemonic(null)).toBeNull();
    expect(decodeVersionFromMnemonic('1_2_3')).toBeNull();
    expect(decodeVersionFromMnemonic('v1.2.3')).toBeNull();
    expect(decodeVersionFromMnemonic('')).toBeNull();
  });
});

describe('isVersionSuffix', () => {
  it('returns true for valid version suffix strings', () => {
    expect(isVersionSuffix('v1_2_3')).toBe(true);
    expect(isVersionSuffix('v0_0_0')).toBe(true);
    expect(isVersionSuffix('v10_20_30')).toBe(true);
  });

  it('returns false for non-suffix strings', () => {
    expect(isVersionSuffix('1.2.3')).toBe(false);
    expect(isVersionSuffix('sol')).toBe(false);
    expect(isVersionSuffix('')).toBe(false);
    expect(isVersionSuffix(null)).toBe(false);
    expect(isVersionSuffix('v1_2')).toBe(false);
  });
});

describe('isVersionGreaterThan', () => {
  it('returns true when major is higher', () => {
    expect(isVersionGreaterThan('2.0.0', '1.9.9')).toBe(true);
  });

  it('returns true when minor is higher (major equal)', () => {
    expect(isVersionGreaterThan('1.3.0', '1.2.9')).toBe(true);
  });

  it('returns true when patch is higher (major/minor equal)', () => {
    expect(isVersionGreaterThan('1.2.4', '1.2.3')).toBe(true);
  });

  it('returns false for equal versions', () => {
    expect(isVersionGreaterThan('1.2.3', '1.2.3')).toBe(false);
  });

  it('returns false when versionA is lower', () => {
    expect(isVersionGreaterThan('1.0.0', '2.0.0')).toBe(false);
    expect(isVersionGreaterThan('1.2.3', '1.2.4')).toBe(false);
  });

  it('returns false for invalid inputs', () => {
    expect(isVersionGreaterThan(null, '1.0.0')).toBe(false);
    expect(isVersionGreaterThan('1.0.0', null)).toBe(false);
    expect(isVersionGreaterThan(null, null)).toBe(false);
  });
});

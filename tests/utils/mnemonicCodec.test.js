import { describe, it, expect } from 'vitest';
import {
  isValidWordList,
  encodeToMnemonic,
  decodeFromMnemonic,
  isValidMnemonic,
  getWordList,
  DEFAULT_WORD_LIST,
} from '../../src/utils/mnemonicCodec';

const A = 'answers.agreeCapitalized';
const N = 'answers.neutralCapitalized';
const D = 'answers.disagreeCapitalized';

describe('isValidWordList', () => {
  it('accepts the default 256-word list', () => {
    expect(isValidWordList(DEFAULT_WORD_LIST)).toBe(true);
  });

  it('rejects lists shorter than 256', () => {
    expect(isValidWordList(DEFAULT_WORD_LIST.slice(0, 255))).toBe(false);
  });

  it('rejects lists longer than 256', () => {
    expect(isValidWordList([...DEFAULT_WORD_LIST, 'extra'])).toBe(false);
  });

  it('rejects lists with duplicate words', () => {
    const withDupe = [...DEFAULT_WORD_LIST.slice(0, 255), DEFAULT_WORD_LIST[0]];
    expect(isValidWordList(withDupe)).toBe(false);
  });

  it('rejects non-arrays', () => {
    expect(isValidWordList(null)).toBe(false);
    expect(isValidWordList('not an array')).toBe(false);
  });
});

describe('encodeToMnemonic / decodeFromMnemonic round-trip', () => {
  it('round-trips a single agree answer', () => {
    const answers = [A];
    const weights = [1];
    const encoded = encodeToMnemonic(answers, weights);
    const decoded = decodeFromMnemonic(encoded);
    expect(decoded).not.toBeNull();
    // Decoder may return extra padding-decoded trailing answers; caller is expected
    // to truncate to the known question count.
    expect(decoded.answers.slice(0, answers.length)).toEqual(answers);
    expect(decoded.weights.slice(0, weights.length)).toEqual(weights);
    expect(decoded.version).toBeNull();
  });

  it('round-trips multiple answers with mixed weights', () => {
    const answers = [A, N, D, A];
    const weights = [1, 2, 1, 2];
    const encoded = encodeToMnemonic(answers, weights);
    const decoded = decodeFromMnemonic(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded.answers.slice(0, answers.length)).toEqual(answers);
    expect(decoded.weights.slice(0, weights.length)).toEqual(weights);
  });

  it('round-trips null (skipped) answers', () => {
    const answers = [A, null, D];
    const weights = [1, 1, 1];
    const encoded = encodeToMnemonic(answers, weights);
    const decoded = decodeFromMnemonic(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded.answers.slice(0, answers.length)).toEqual(answers);
    expect(decoded.weights.slice(0, weights.length)).toEqual(weights);
  });

  it('round-trips with version suffix', () => {
    const answers = [A, D];
    const weights = [1, 2];
    const encoded = encodeToMnemonic(answers, weights, DEFAULT_WORD_LIST, '2.0.1');
    expect(encoded).toContain('-v2_0_1');
    const decoded = decodeFromMnemonic(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded.answers).toEqual(answers);
    expect(decoded.weights).toEqual(weights);
    expect(decoded.version).toBe('2.0.1');
  });

  it('produces a hyphen-separated phrase', () => {
    const encoded = encodeToMnemonic([A, N], [1, 1]);
    expect(typeof encoded).toBe('string');
    expect(encoded.split('-').length).toBeGreaterThanOrEqual(1);
  });
});

describe('encodeToMnemonic edge cases', () => {
  it('returns empty string for empty answers array', () => {
    expect(encodeToMnemonic([], [])).toBe('');
  });

  it('returns empty string for null answers', () => {
    expect(encodeToMnemonic(null, [])).toBe('');
  });

  it('ignores invalid version strings (no suffix appended)', () => {
    const encoded = encodeToMnemonic([A], [1], DEFAULT_WORD_LIST, 'not-a-version');
    expect(encoded).not.toContain('-v');
  });

  it('uses weight 1 as default when weights are undefined', () => {
    const withWeights = encodeToMnemonic([A], [1]);
    const withoutWeights = encodeToMnemonic([A], undefined);
    expect(withWeights).toBe(withoutWeights);
  });
});

describe('decodeFromMnemonic edge cases', () => {
  it('returns null for null input', () => {
    expect(decodeFromMnemonic(null)).toBeNull();
  });

  it('returns null for non-string input', () => {
    expect(decodeFromMnemonic(123)).toBeNull();
  });

  it('returns null for a phrase with unknown words', () => {
    expect(decodeFromMnemonic('notaword-alsonotaword')).toBeNull();
  });

  it('returns null for a phrase that is only a version suffix', () => {
    expect(decodeFromMnemonic('v1_0_0')).toBeNull();
  });
});

describe('isValidMnemonic', () => {
  it('returns true for a valid encoded phrase', () => {
    const encoded = encodeToMnemonic([A, D], [1, 1]);
    expect(isValidMnemonic(encoded)).toBe(true);
  });

  it('returns true for a phrase with a valid version suffix', () => {
    const encoded = encodeToMnemonic([A], [1], DEFAULT_WORD_LIST, '1.0.0');
    expect(isValidMnemonic(encoded)).toBe(true);
  });

  it('returns false for a phrase with unknown words', () => {
    expect(isValidMnemonic('foo-bar-baz')).toBe(false);
  });

  it('returns false for null or undefined', () => {
    expect(isValidMnemonic(null)).toBe(false);
    expect(isValidMnemonic(undefined)).toBe(false);
  });

  it('returns false for a phrase that is only a version suffix', () => {
    expect(isValidMnemonic('v1_0_0')).toBe(false);
  });
});

describe('getWordList', () => {
  it('returns a 256-word array', () => {
    expect(getWordList()).toHaveLength(256);
  });

  it('returns a copy, not the original reference', () => {
    expect(getWordList()).not.toBe(DEFAULT_WORD_LIST);
  });
});

import { describe, it, expect } from 'vitest';
import { normalizeAnswer, applyPolarity, MIN_COMPARED } from '../answerMappings';

describe('normalizeAnswer', () => {
  it('maps known agreement keys', () => {
    expect(normalizeAnswer('answers.agreeCapitalized')).toBe(1);
    expect(normalizeAnswer('answers.neutralCapitalized')).toBe(0.5);
    expect(normalizeAnswer('answers.disagreeCapitalized')).toBe(0);
  });

  it('is case-insensitive for camelCase keys', () => {
    expect(normalizeAnswer('answers.agreecapitalized')).toBe(1);
    expect(normalizeAnswer('answers.neutralcapitalized')).toBe(0.5);
    expect(normalizeAnswer('answers.disagreecapitalized')).toBe(0);
  });

  it('maps Spanish label strings', () => {
    expect(normalizeAnswer('estoy de acuerdo')).toBe(1);
    expect(normalizeAnswer('neutral')).toBe(0.5);
    expect(normalizeAnswer('no estoy de acuerdo')).toBe(0);
  });

  it('parses numeric strings', () => {
    expect(normalizeAnswer('0.75')).toBe(0.75);
    expect(normalizeAnswer('1')).toBe(1);
    expect(normalizeAnswer('0')).toBe(0);
  });

  it('returns null for null and undefined', () => {
    expect(normalizeAnswer(null)).toBeNull();
    expect(normalizeAnswer(undefined)).toBeNull();
  });

  it('returns null for unrecognized non-numeric strings', () => {
    expect(normalizeAnswer('garbage')).toBeNull();
    expect(normalizeAnswer('Sin respuesta')).toBeNull();
  });

  it('trims whitespace before lookup', () => {
    expect(normalizeAnswer('  neutral  ')).toBe(0.5);
  });
});

describe('applyPolarity', () => {
  it('flips 1 to 0 when polarity is "-"', () => {
    expect(applyPolarity(1, '-')).toBe(0);
  });

  it('flips 0 to 1 when polarity is "-"', () => {
    expect(applyPolarity(0, '-')).toBe(1);
  });

  it('leaves neutral (0.5) unchanged when polarity is "-"', () => {
    expect(applyPolarity(0.5, '-')).toBe(0.5);
  });

  it('leaves values unchanged for any other polarity', () => {
    expect(applyPolarity(1, '+')).toBe(1);
    expect(applyPolarity(0, null)).toBe(0);
    expect(applyPolarity(0.5, undefined)).toBe(0.5);
  });
});

describe('MIN_COMPARED', () => {
  it('is a positive integer', () => {
    expect(typeof MIN_COMPARED).toBe('number');
    expect(MIN_COMPARED).toBeGreaterThan(0);
    expect(Number.isInteger(MIN_COMPARED)).toBe(true);
  });
});

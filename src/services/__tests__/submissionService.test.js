import { describe, it, expect } from 'vitest';
import { buildCompactResponses } from '../submissionService';

const questions = [
  { id: 't1' },
  { id: 't2' },
  { id: 't3' },
];

describe('buildCompactResponses', () => {
  it('maps answers to [vote, weight] tuples', () => {
    const result = buildCompactResponses(
      questions,
      ['answers.agreeCapitalized', 'answers.disagreeCapitalized', 'answers.neutralCapitalized'],
      [1, 2, 1]
    );
    expect(result.t1).toEqual([1, 1]);
    expect(result.t2).toEqual([0, 2]);
    expect(result.t3).toEqual([0.5, 1]);
  });

  it('skips null answers', () => {
    const result = buildCompactResponses(questions, [null, null, 'answers.agreeCapitalized'], [1, 1, 1]);
    expect(result.t1).toBeUndefined();
    expect(result.t2).toBeUndefined();
    expect(result.t3).toBeDefined();
  });

  it('skips "Sin respuesta" answers', () => {
    const result = buildCompactResponses(questions, ['Sin respuesta', null, null], [1, 1, 1]);
    expect(result.t1).toBeUndefined();
  });

  it('defaults to weight 1 when weights are not provided', () => {
    const result = buildCompactResponses(questions, ['answers.agreeCapitalized', null, null], null);
    expect(result.t1).toEqual([1, 1]);
  });

  it('falls back to 0.5 for answers that cannot be normalized', () => {
    const result = buildCompactResponses(questions, ['unknownkey', null, null], [1, 1, 1]);
    expect(result.t1).toEqual([0.5, 1]);
  });

  it('returns empty object when all answers are skipped', () => {
    const result = buildCompactResponses(questions, [null, null, null], [1, 1, 1]);
    expect(result).toEqual({});
  });

  it('uses question id as the key in the output', () => {
    const result = buildCompactResponses(
      [{ id: 'custom_q' }],
      ['answers.agreeCapitalized'],
      [1]
    );
    expect(result).toHaveProperty('custom_q');
  });
});

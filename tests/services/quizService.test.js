import { describe, it, expect } from 'vitest';
import {
  computeUniqueIndices,
  findNextUniqueIndex,
  findPrevUniqueIndex,
} from '../../src/services/quizService';

const q = (text) => ({ question: text });

describe('computeUniqueIndices', () => {
  it('returns all indices when all question texts are unique', () => {
    expect(computeUniqueIndices([q('A'), q('B'), q('C')])).toEqual([0, 1, 2]);
  });

  it('excludes duplicate question texts, keeping the first occurrence', () => {
    const questions = [q('A'), q('B'), q('A'), q('C'), q('B')];
    expect(computeUniqueIndices(questions)).toEqual([0, 1, 3]);
  });

  it('returns empty array for empty input', () => {
    expect(computeUniqueIndices([])).toEqual([]);
  });

  it('returns [0] for a single question', () => {
    expect(computeUniqueIndices([q('only')])).toEqual([0]);
  });

  it('returns [0] when all questions have the same text', () => {
    expect(computeUniqueIndices([q('same'), q('same'), q('same')])).toEqual([0]);
  });
});

describe('findNextUniqueIndex', () => {
  const indices = [0, 2, 5, 8];

  it('finds the next unique index after the given position', () => {
    expect(findNextUniqueIndex(indices, 0)).toBe(2);
    expect(findNextUniqueIndex(indices, 2)).toBe(5);
    expect(findNextUniqueIndex(indices, 5)).toBe(8);
  });

  it('returns undefined when already at the last unique index', () => {
    expect(findNextUniqueIndex(indices, 8)).toBeUndefined();
  });

  it('finds next even when currentIndex is not itself a unique index', () => {
    expect(findNextUniqueIndex(indices, 3)).toBe(5);
  });
});

describe('findPrevUniqueIndex', () => {
  const indices = [0, 2, 5, 8];

  it('finds the previous unique index before the given position', () => {
    expect(findPrevUniqueIndex(indices, 8)).toBe(5);
    expect(findPrevUniqueIndex(indices, 5)).toBe(2);
    expect(findPrevUniqueIndex(indices, 2)).toBe(0);
  });

  it('returns undefined when already at the first unique index', () => {
    expect(findPrevUniqueIndex(indices, 0)).toBeUndefined();
  });

  it('finds prev even when currentIndex is not itself a unique index', () => {
    expect(findPrevUniqueIndex(indices, 4)).toBe(2);
  });
});

import { describe, it, expect } from 'vitest';
import {
  isImputedNeutral,
  buildUserAnswers,
  buildUserAnswersWithRaw,
  partitionByCompared,
  filterCandidatesByRound,
  filterPartiesByRound,
  computeResultsFrom,
} from '../resultsService';
import { MIN_COMPARED } from '../../constants/answerMappings';

describe('isImputedNeutral', () => {
  it('returns true for numeric 0.5 without source', () => {
    expect(isImputedNeutral({ vote: 0.5 })).toBe(true);
    expect(isImputedNeutral({ vote: '0.5' })).toBe(true);
  });

  it('returns false for 0.5 when source is present', () => {
    expect(isImputedNeutral({ vote: 0.5, source: 'declaration' })).toBe(false);
  });

  it('returns true for label containing "neutral" without source', () => {
    expect(isImputedNeutral({ vote: 'neutral' })).toBe(true);
    expect(isImputedNeutral({ vote: 'Neutral stance' })).toBe(true);
  });

  it('returns false for non-neutral vote values', () => {
    expect(isImputedNeutral({ vote: 1 })).toBe(false);
    expect(isImputedNeutral({ vote: 0 })).toBe(false);
  });

  it('returns false for null or undefined', () => {
    expect(isImputedNeutral(null)).toBe(false);
    expect(isImputedNeutral(undefined)).toBe(false);
  });
});

const questions = [
  { id: 't1', polarity: '+' },
  { id: 't2', polarity: '+' },
  { id: 't3', polarity: '-' },
];

describe('buildUserAnswers', () => {
  it('maps answers to numeric values with weights', () => {
    const result = buildUserAnswers(
      questions,
      ['answers.agreeCapitalized', 'answers.disagreeCapitalized', null],
      [1, 2, 1]
    );
    expect(result.t1).toEqual({ answer: 1, weight: 1 });
    expect(result.t2).toEqual({ answer: 0, weight: 2 });
    expect(result.t3).toBeUndefined();
  });

  it('applies polarity inversion for "-" polarity questions', () => {
    const result = buildUserAnswers(
      questions,
      [null, null, 'answers.agreeCapitalized'],
      [1, 1, 1]
    );
    // agree=1 inverted by "-" polarity → 0
    expect(result.t3).toEqual({ answer: 0, weight: 1 });
  });

  it('skips "Sin respuesta" and empty string answers', () => {
    const result = buildUserAnswers(questions, ['Sin respuesta', '', null], [1, 1, 1]);
    expect(Object.keys(result)).toHaveLength(0);
  });

  it('defaults weight to 1 when weights array is null', () => {
    const result = buildUserAnswers(questions, ['answers.agreeCapitalized', null, null], null);
    expect(result.t1.weight).toBe(1);
  });

  it('skips answers that cannot be normalized', () => {
    const result = buildUserAnswers(questions, ['garbage', null, null], [1, 1, 1]);
    expect(result.t1).toBeUndefined();
  });
});

describe('buildUserAnswersWithRaw', () => {
  it('includes raw answer string alongside numeric and weight', () => {
    const result = buildUserAnswersWithRaw(
      questions,
      ['answers.agreeCapitalized', null, null],
      [1, 1, 1]
    );
    expect(result.t1).toEqual({ raw: 'answers.agreeCapitalized', numeric: 1, weight: 1 });
  });

  it('skips null and empty answers', () => {
    const result = buildUserAnswersWithRaw(questions, [null, '', null], [1, 1, 1]);
    expect(Object.keys(result)).toHaveLength(0);
  });

  it('applies polarity inversion and stores it in numeric', () => {
    const result = buildUserAnswersWithRaw(
      questions,
      [null, null, 'answers.agreeCapitalized'],
      [1, 1, 1]
    );
    expect(result.t3.raw).toBe('answers.agreeCapitalized');
    expect(result.t3.numeric).toBe(0); // agree=1 inverted by "-"
  });
});

describe('partitionByCompared', () => {
  const items = [
    { id: 'a', compared_questions: MIN_COMPARED },
    { id: 'b', compared_questions: MIN_COMPARED - 1 },
    { id: 'c', compared_questions: MIN_COMPARED + 5 },
    { id: 'd', compared_questions: 0 },
  ];

  it('places items meeting the default threshold into complete', () => {
    const { complete } = partitionByCompared(items);
    expect(complete.map(i => i.id)).toEqual(['a', 'c']);
  });

  it('places items below the threshold into incomplete', () => {
    const { incomplete } = partitionByCompared(items);
    expect(incomplete.map(i => i.id)).toEqual(['b', 'd']);
  });

  it('respects a custom threshold', () => {
    const { complete } = partitionByCompared(items, 2);
    expect(complete.map(i => i.id)).toEqual(['a', 'b', 'c']);
  });

  it('handles missing compared_questions as 0', () => {
    const { incomplete } = partitionByCompared([{ id: 'x' }]);
    expect(incomplete.map(i => i.id)).toEqual(['x']);
  });
});

describe('filterCandidatesByRound', () => {
  const results = [{ id: 'c1' }, { id: 'c2' }, { id: 'c3' }];

  it('filters to only allowed candidates', () => {
    const filtered = filterCandidatesByRound(results, { allowedCandidates: ['c1', 'c3'] });
    expect(filtered.map(r => r.id)).toEqual(['c1', 'c3']);
  });

  it('returns all results when round has no allowedCandidates', () => {
    expect(filterCandidatesByRound(results, {})).toEqual(results);
  });

  it('returns all results when round is null', () => {
    expect(filterCandidatesByRound(results, null)).toEqual(results);
  });
});

describe('filterPartiesByRound', () => {
  const results = [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }];

  it('filters to only allowed parties', () => {
    const filtered = filterPartiesByRound(results, { allowedParties: ['p2'] });
    expect(filtered.map(r => r.id)).toEqual(['p2']);
  });

  it('returns all results when round has no allowedParties', () => {
    expect(filterPartiesByRound(results, {})).toEqual(results);
  });
});

const compactPartyData = {
  parties: {
    p1: {
      id: 'p1',
      name: 'Alpha Party',
      votes: { t1: { vote: 1 }, t2: { vote: 0 } },
    },
    p2: {
      id: 'p2',
      name: 'Beta Party',
      votes: { t1: { vote: 0 }, t2: { vote: 1 } },
    },
  },
};

const userAnswers = {
  t1: { answer: 1, weight: 1 },
  t2: { answer: 0, weight: 1 },
};

describe('computeResultsFrom', () => {
  it('scores the best-matching party highest (100)', () => {
    const results = computeResultsFrom(compactPartyData, 'parties', userAnswers);
    expect(results[0].id).toBe('p1');
    expect(results[0].similarity_score).toBe(100);
  });

  it('scores the worst-matching party lowest (0)', () => {
    const results = computeResultsFrom(compactPartyData, 'parties', userAnswers);
    expect(results[results.length - 1].id).toBe('p2');
    expect(results[results.length - 1].similarity_score).toBe(0);
  });

  it('sets similarity_score to null when user answered no overlapping questions', () => {
    const results = computeResultsFrom(compactPartyData, 'parties', {});
    results.forEach(r => expect(r.similarity_score).toBeNull());
  });

  it('returns empty array for null dataObj', () => {
    expect(computeResultsFrom(null, 'parties', {})).toEqual([]);
  });

  it('exposes compared_questions count', () => {
    const results = computeResultsFrom(compactPartyData, 'parties', userAnswers);
    expect(results[0].compared_questions).toBe(2);
  });

  it('excludes imputed neutral votes from scoring', () => {
    const data = {
      parties: {
        p1: {
          id: 'p1',
          name: 'Party',
          votes: { t1: { vote: 0.5 } }, // imputed neutral — no source
        },
      },
    };
    const results = computeResultsFrom(
      data, 'parties',
      { t1: { answer: 1, weight: 1 } },
      { isImputedNeutral }
    );
    expect(results[0].similarity_score).toBeNull(); // excluded, so no valid comparisons
  });

  it('handles legacy (non-compact) party format', () => {
    const legacyData = {
      parties: {
        'Alpha Party': {
          votes: { t1: { vote: 1 }, t2: { vote: 0 } },
        },
      },
    };
    const results = computeResultsFrom(legacyData, 'parties', userAnswers);
    expect(results[0].name).toBe('Alpha Party');
    expect(results[0].similarity_score).toBe(100);
  });
});

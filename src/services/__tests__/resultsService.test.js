import { describe, it, expect } from 'vitest';
import {
  isImputedNeutral,
  buildUserAnswers,
  buildUserAnswersWithRaw,
  partitionByCompared,
  filterCandidatesByRound,
  filterPartiesByRound,
  computeResultsFrom,
  buildEntityDetails,
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

  it('returns displayName without party suffix for compact candidate format', () => {
    const data = {
      candidates: {
        c1: {
          id: 'c1',
          name: 'Ana García (Partido Verde)',
          party: { id: 'p1', name: 'Partido Verde' },
          votes: { t1: { vote: 1 } },
        },
      },
    };
    const results = computeResultsFrom(data, 'candidates', { t1: { answer: 1, weight: 1 } });
    expect(results[0].displayName).toBe('Ana García');
    expect(results[0].name).toBe('Ana García (Partido Verde)');
  });

  it('extracts party name and id from object in compact candidate format', () => {
    const data = {
      candidates: {
        c1: {
          id: 'c1',
          name: 'Luis Torres',
          party: { id: 'p2', name: 'Alianza' },
          votes: { t1: { vote: 0 } },
        },
      },
    };
    const results = computeResultsFrom(data, 'candidates', { t1: { answer: 0, weight: 1 } });
    expect(results[0].party).toBe('Alianza');
    expect(results[0].partyId).toBe('p2');
  });

  it('uses party as string for legacy candidate format', () => {
    const data = {
      candidates: {
        'Rosa Paz (Frente Unido)': {
          party: 'Frente Unido',
          votes: { t1: { vote: 1 } },
        },
      },
    };
    const results = computeResultsFrom(data, 'candidates', { t1: { answer: 1, weight: 1 } });
    expect(results[0].party).toBe('Frente Unido');
    expect(results[0].partyId).toBeUndefined();
    expect(results[0].id).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// buildEntityDetails
// ---------------------------------------------------------------------------

const compactVotesObj = {
  id: 'c1',
  name: 'Ana García',
  party: { id: 'p1', name: 'Partido Verde' },
  votes: {
    t1: { vote: 1, comment: 'Supports it', source: 'speech' },
    t2: { vote: 0.5 }, // no source → imputed neutral
    t3: { vote: 'text', comment: null }, // non-numeric vote
  },
};

const userAnswersMap = {
  t1: { raw: 'answers.agreeCapitalized', numeric: 1, weight: 1 },
};

describe('buildEntityDetails', () => {
  it('generates correct key patterns for compact format (presidential)', () => {
    const result = buildEntityDetails(compactVotesObj, userAnswersMap, 'presidential');
    const t1 = result.details.find(d => d.id === 't1');
    expect(t1.question_key).toBe('quiz.questions.t1');
    expect(t1.topic_key).toBe('quiz.topics.t1');
    expect(t1.comment_key).toBe('explanations.candidates.c1.t1');
  });

  it('generates correct key patterns for compact format (party)', () => {
    const partyVotesObj = { ...compactVotesObj, id: 'p1' };
    const result = buildEntityDetails(partyVotesObj, userAnswersMap, 'party');
    const t1 = result.details.find(d => d.id === 't1');
    expect(t1.comment_key).toBe('explanations.parties.p1.t1');
  });

  it('sets candidate_meta for presidential type', () => {
    const result = buildEntityDetails(compactVotesObj, userAnswersMap, 'presidential');
    expect(result.candidate_meta).toEqual({ party: compactVotesObj.party });
    expect(result.party_meta).toBeNull();
  });

  it('sets candidate_meta to null for party type', () => {
    const partyVotesObj = { ...compactVotesObj, id: 'p1' };
    const result = buildEntityDetails(partyVotesObj, userAnswersMap, 'party');
    expect(result.candidate_meta).toBeNull();
  });

  it('marks detail as compared when user answered and vote is in analysis', () => {
    const result = buildEntityDetails(compactVotesObj, userAnswersMap, 'presidential');
    const t1 = result.details.find(d => d.id === 't1');
    expect(t1.compared).toBe(true);
    expect(t1.userAnswerRaw).toBe('answers.agreeCapitalized');
    expect(t1.userAnswerNumeric).toBe(1);
  });

  it('marks detail as not compared when user did not answer', () => {
    const result = buildEntityDetails(compactVotesObj, userAnswersMap, 'presidential');
    const t2 = result.details.find(d => d.id === 't2');
    expect(t2.compared).toBe(false);
    expect(t2.userAnswerRaw).toBeNull();
  });

  it('excludes imputed neutral (0.5 without source) from analysis', () => {
    const result = buildEntityDetails(compactVotesObj, {}, 'presidential');
    const t2 = result.details.find(d => d.id === 't2');
    expect(t2.includedInAnalysis).toBe(false);
  });

  it('includes 0.5 vote with source in analysis', () => {
    const votesObj = {
      id: 'c1',
      votes: { t1: { vote: 0.5, source: 'documented' } },
    };
    const result = buildEntityDetails(votesObj, {}, 'presidential');
    expect(result.details[0].includedInAnalysis).toBe(true);
  });

  it('handles non-numeric vote strings as null voteNumeric', () => {
    const result = buildEntityDetails(compactVotesObj, userAnswersMap, 'presidential');
    const t3 = result.details.find(d => d.id === 't3');
    expect(t3.voteNumeric).toBeNull();
    expect(t3.includedInAnalysis).toBe(false);
  });

  it('uses question text from quizData when provided (compact)', () => {
    const quizData = { quiz: { t1: { question: '¿Apoya la reforma?' } } };
    const result = buildEntityDetails(compactVotesObj, {}, 'presidential', quizData);
    const t1 = result.details.find(d => d.id === 't1');
    expect(t1.question).toBe('¿Apoya la reforma?');
  });

  it('handles legacy format with question_key / topic_key prefix transform', () => {
    const legacyVotesObj = {
      votes: {
        q1: {
          vote: 1,
          question: 'Should we?',
          question_key: 'questions.q1',
          topic_key: 'topics.topic1',
          comment_key: 'comments.c.q1',
        },
      },
    };
    const result = buildEntityDetails(legacyVotesObj, {}, 'presidential');
    const q1 = result.details[0];
    expect(q1.question_key).toBe('quiz.questions.q1');
    expect(q1.topic_key).toBe('quiz.topics.topic1');
    expect(q1.comment_key).toBe('comments.c.q1');
    expect(q1.question).toBe('Should we?');
  });

  it('preserves legacy question_key that does not start with questions.', () => {
    const legacyVotesObj = {
      votes: {
        q1: {
          vote: 1,
          question_key: 'custom.key',
          topic_key: 'custom.topic',
          comment_key: null,
        },
      },
    };
    const result = buildEntityDetails(legacyVotesObj, {}, 'presidential');
    expect(result.details[0].question_key).toBe('custom.key');
    expect(result.details[0].topic_key).toBe('custom.topic');
  });
});

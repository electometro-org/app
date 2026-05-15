import { USER_TO_NUM, MIN_COMPARED, normalizeAnswer, applyPolarity } from "../constants/answerMappings";

// 0.5 votes without source = unknown position, excluded from comparison
export function isImputedNeutral(qobj) {
  if (!qobj) return false;
  const v = qobj.vote;
  const numeric = parseFloat(v);
  const isNeutralNumeric = !Number.isNaN(numeric) && numeric === 0.5;
  const isNeutralLabel = typeof v === "string" && v.trim().toLowerCase().includes("neutral");
  const hasSource = !!(qobj.source && String(qobj.source).trim().length > 0);
  return (isNeutralNumeric || isNeutralLabel) && !hasSource;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

export function computeResultsFrom(dataObj, keyName, userAnswers, opts = {}) {
  if (!dataObj) return [];

  // Compact format detection: entries have 'id' and 'name' fields
  const isCompact = Object.values(dataObj[keyName])[0]?.id !== undefined;

  const entries = Object.entries(dataObj[keyName]).map(([key, info]) => {
    let weightedDiff = 0;
    let totalWeight = 0;
    let matchedCount = 0;
    let candidateAvailable = 0;

    for (const [qid, qobj] of Object.entries(info.votes || {})) {
      const nv = parseFloat(qobj.vote);
      if (Number.isNaN(nv)) continue;
      if (opts.isImputedNeutral && opts.isImputedNeutral(qobj)) continue;
      candidateAvailable += 1;

      const ua = userAnswers[qid];
      if (!ua) continue;

      weightedDiff += Math.abs(ua.answer - nv) * ua.weight;
      totalWeight += ua.weight;
      matchedCount += 1;
    }

    const similarity_score = totalWeight ? Math.round((1 - weightedDiff / totalWeight) * 100) : null;

    if (keyName === "parties") {
      // Compact: key is "p1", name is in info.name; Legacy: key is the party name
      const partyName = isCompact ? info.name : key;
      return {
        id: isCompact ? key : undefined,
        name: partyName,
        party: partyName,
        similarity_score,
        compared_questions: matchedCount,
        available_questions: candidateAvailable
      };
    } else {
      // Compact: key is "c1", name is in info.name; Legacy: key is "Full Name (Party)"
      const fullName = isCompact ? info.name : key;
      const displayName = fullName.replace(/\s*[\(\[\{].*?[\)\]\}]\s*$/, "").trim();
      // Party can be string (legacy) or object { id, name } (compact)
      const partyRaw = info.party;
      const party = typeof partyRaw === "object" && partyRaw !== null ? partyRaw.name : partyRaw;
      const partyId = typeof partyRaw === "object" && partyRaw !== null ? partyRaw.id : undefined;
      return {
        id: isCompact ? key : undefined,
        name: fullName,
        displayName,
        party,
        partyId,
        similarity_score,
        compared_questions: matchedCount,
        available_questions: candidateAvailable
      };
    }
  });

  // Shuffle ties to avoid bias
  const groups = entries.reduce((acc, entry) => {
    const key = entry.similarity_score ?? -1;
    (acc[key] = acc[key] || []).push(entry);
    return acc;
  }, {});

  const scores = Object.keys(groups)
    .map(k => Number(k))
    .sort((a, b) => b - a);

  const result = [];
  scores.forEach(score => {
    const bucket = groups[score];
    if (bucket.length > 1) shuffle(bucket);
    result.push(...bucket);
  });

  return result;
}

export function buildUserAnswers(questions, answers, weights) {
  const userAnswers = {};

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const rawAnswer = answers[i];

    if (!rawAnswer || rawAnswer === "Sin respuesta" || (typeof rawAnswer === "string" && rawAnswer.trim() === "")) {
      continue;
    }

    let numericAnswer = normalizeAnswer(rawAnswer);
    if (numericAnswer === null) continue;

    numericAnswer = applyPolarity(numericAnswer, q.polarity);

    const weight = Number(weights?.[i] ?? 1) || 1;
    userAnswers[q.id] = { answer: numericAnswer, weight };
  }

  return userAnswers;
}

export function buildUserAnswersWithRaw(questions, answers, weights) {
  const userAnswersMap = {};

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const raw = answers[i];

    if (!raw || raw === "Sin respuesta" || (typeof raw === "string" && raw.trim() === "")) {
      continue;
    }

    let numeric = normalizeAnswer(raw);
    if (numeric === null) continue;

    numeric = applyPolarity(numeric, q.polarity);

    const weight = Number(weights?.[i] ?? 1) || 1;
    userAnswersMap[q.id] = { raw, numeric, weight };
  }

  return userAnswersMap;
}

export function partitionByCompared(arr, minCompared = MIN_COMPARED) {
  const complete = [];
  const incomplete = [];

  arr.forEach(item => {
    const compared = Number(item.compared_questions || 0);
    if (compared >= minCompared) {
      complete.push(item);
    } else {
      incomplete.push(item);
    }
  });

  return { complete, incomplete };
}

export function filterCandidatesByRound(results, round) {
  if (!round?.allowedCandidates) return results;
  const allowed = new Set(round.allowedCandidates);
  return results.filter(r => allowed.has(r.id));
}

export function filterPartiesByRound(results, round) {
  if (!round?.allowedParties) return results;
  const allowed = new Set(round.allowedParties);
  return results.filter(r => allowed.has(r.id));
}

export function buildEntityDetails(votesObj, userAnswersMap, type, quizData = null) {
  // Compact format detection: entity has 'id' field (like "c1" or "p1")
  const entityId = votesObj.id;
  const isCompact = !!entityId;
  const entityType = type === "presidential" ? "candidates" : "parties";

  const detailsArr = Object.entries(votesObj.votes).map(([qid, qobj]) => {
    const candidateVoteNum = (qobj.vote !== undefined && qobj.vote !== null && !Number.isNaN(parseFloat(qobj.vote)))
      ? parseFloat(qobj.vote)
      : null;
    const includedInAnalysis = candidateVoteNum !== null && !isImputedNeutral(qobj);
    const ua = userAnswersMap[qid];
    const userAnswered = !!ua;
    const compared = userAnswered && includedInAnalysis;

    let questionKey, topicKey, commentKey, question;

    if (isCompact) {
      // Compact format: generate keys from qid (e.g., "t1")
      questionKey = `quiz.questions.${qid}`;
      topicKey = `quiz.topics.${qid}`;
      commentKey = `explanations.${entityType}.${entityId}.${qid}`;
      // Get question text from quizData if available, otherwise null (UI will use translation)
      question = quizData?.quiz?.[qid]?.question ?? null;
    } else {
      // Legacy format: transform existing keys
      questionKey = qobj.question_key?.startsWith('questions.')
        ? `quiz.${qobj.question_key}`
        : qobj.question_key;
      topicKey = qobj.topic_key?.startsWith('topics.')
        ? `quiz.${qobj.topic_key}`
        : qobj.topic_key;
      commentKey = qobj.comment_key;
      question = qobj.question;
    }

    return {
      id: qid,
      question,
      question_key: questionKey,
      topic_key: topicKey,
      vote: qobj.vote,
      voteNumeric: candidateVoteNum,
      comment: qobj.comment,
      comment_key: commentKey,
      source: qobj.source,
      includedInAnalysis,
      userAnswerRaw: ua?.raw ?? null,
      userAnswerNumeric: ua?.numeric ?? null,
      userWeight: ua?.weight ?? null,
      compared
    };
  });

  return {
    candidate_meta: type === "presidential" ? { party: votesObj.party } : null,
    party_meta: null,
    details: detailsArr
  };
}
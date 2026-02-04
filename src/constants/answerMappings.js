export const USER_TO_NUM = {
  "answers.agreeCapitalized": 1,
  "answers.agreecapitalized": 1,
  "answers.neutralCapitalized": 0.5,
  "answers.neutralcapitalized": 0.5,
  "answers.disagreeCapitalized": 0,
  "answers.disagreecapitalized": 0,
  "estoy de acuerdo": 1,
  "neutral": 0.5,
  "no estoy de acuerdo": 0
};

export const MIN_COMPARED = 8;

export function normalizeAnswer(raw) {
  if (raw === null || raw === undefined) return null;
  const normalized = (typeof raw === "string") ? raw.trim().toLowerCase() : raw;
  const mapped = USER_TO_NUM[normalized];
  if (mapped !== undefined) return mapped;
  const parsed = parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function applyPolarity(numericAnswer, polarity) {
  if (polarity !== "-") return numericAnswer;
  if (numericAnswer === 1) return 0;
  if (numericAnswer === 0) return 1;
  return numericAnswer;
}
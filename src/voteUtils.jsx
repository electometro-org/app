import { tolgee } from './tolgee.js';
export { USER_TO_NUM } from './constants/answerMappings';
export { isImputedNeutral } from './services/resultsService';

export const getVoteLabelByVal = () => ({
  "1": tolgee.t('votes.inFavor'),
  "0.5": tolgee.t('votes.neutral'),
  "0": tolgee.t('votes.against')
});

export const getUserAnswerMapping = () => ({
  'answers.agreeCapitalized': tolgee.t('votes.inFavor'),
  'answers.neutralCapitalized': tolgee.t('votes.neutral'),
  'answers.disagreeCapitalized': tolgee.t('votes.against'),
  [tolgee.t('answers.agreeCapitalized')]: tolgee.t('votes.inFavor'),
  [tolgee.t('answers.neutralCapitalized')]: tolgee.t('votes.neutral'),
  [tolgee.t('answers.disagreeCapitalized')]: tolgee.t('votes.against')
});

export const VOTE_LABEL_BY_VAL = getVoteLabelByVal();
export const userAnswerMapping = getUserAnswerMapping();

export function voteToNumeric(v) {
  const n = parseFloat(v);
  if (!Number.isNaN(n)) return n;

  const translatedMap = {
    [tolgee.t('votes.inFavor')]: 1,
    [tolgee.t('votes.neutral')]: 0.5,
    [tolgee.t('votes.against')]: 0
  };

  const fallbackMap = { "A favor": 1, "Neutral": 0.5, "En contra": 0 };

  return translatedMap[v] ?? fallbackMap[v] ?? 0.5;
}

export function formatDate(dateStr) {
  if (!dateStr || dateStr === "N/A") return "N/A";
  const year = dateStr.substring(0, 4);
  const month = parseInt(dateStr.substring(4, 6), 10);
  const day = parseInt(dateStr.substring(6, 8), 10);

  const monthKeys = [
    'months.january', 'months.february', 'months.march', 'months.april',
    'months.may', 'months.june', 'months.july', 'months.august',
    'months.september', 'months.october', 'months.november', 'months.december'
  ];

  const monthName = tolgee.t(monthKeys[month - 1]);
  return `${day} ${monthName} ${year}`;
}

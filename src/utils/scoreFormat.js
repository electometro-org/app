// A similarity score is null when nothing could be compared (e.g. a candidate with no recorded
// positions, or no overlap with the voter's answers): show a dash instead of "null%".
export function formatScore(score) {
  if (score === null || score === undefined || score === "") return "—";
  const numeric = Number(score);
  return Number.isFinite(numeric) ? `${numeric}%` : "—";
}

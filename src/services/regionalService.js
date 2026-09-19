// Pure helpers for regional elections: one compact JSON holds every region
// ({ version, regions: { r1: { id, name, quiz, candidates } } }). Question and
// topic texts are inline (no Tolgee keys), and quiz ids may differ per region.

const dataCache = new Map();

export function loadRegionalData(url) {
  if (!url) return Promise.reject(new Error("Missing regional data URL"));
  if (!dataCache.has(url)) {
    const promise = fetch(url)
      .then(r => {
        if (!r.ok) throw new Error(`Fetch failed for ${url}`);
        return r.json();
      })
      .catch(err => {
        dataCache.delete(url);
        throw err;
      });
    dataCache.set(url, promise);
  }
  return dataCache.get(url);
}

export function clearRegionalCache() {
  dataCache.clear();
}

export function slugifyTopic(topic) {
  return String(topic || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Numeric part of the region id ("r12" -> 12); used to encode the region in a mnemonic.
export function regionNumber(regionId) {
  const match = /^r(\d+)$/.exec(String(regionId || ""));
  return match ? Number(match[1]) : null;
}

export function regionIdFromNumber(n) {
  return Number.isInteger(n) && n >= 0 ? `r${n}` : null;
}

export function getRegion(data, regionId) {
  return data?.regions?.[regionId] ?? null;
}

// Region list for the picker, sorted by name (Spanish collation).
export function listRegions(data) {
  return Object.values(data?.regions || {})
    .map(region => ({
      id: region.id,
      name: region.name,
      candidateCount: Object.keys(region.candidates || {}).length,
      questionCount: Object.keys(region.quiz || {}).length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}

export function buildRegionalQuestions(region) {
  return Object.values(region?.quiz || {}).map(q => ({
    id: q.id,
    question: q.question,
    tema: q.topic,
    question_key: null,
    topic_key: `regional.topics.${slugifyTopic(q.topic) || q.id}`,
    inlineText: true,
    options: [
      "answers.agreeCapitalized",
      "answers.neutralCapitalized",
      "answers.disagreeCapitalized",
    ],
    polarity: "",
  }));
}

// Shape a region like the presidential votes file so the scoring pipeline can be reused.
export function toVotesData(data, regionId) {
  const region = getRegion(data, regionId);
  if (!region) return null;
  return {
    version: data.version,
    inlineText: true,
    quiz: region.quiz,
    candidates: region.candidates,
  };
}

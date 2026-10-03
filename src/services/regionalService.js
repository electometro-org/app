// Pure helpers for regional elections: one compact JSON holds every region
// ({ version, regions: { r1: { id, name, quiz, candidates } } }). Question and topic texts are
// translated via Tolgee keys namespaced by region (quiz.questions.<regionId>.<id>, same for topics),
// with the JSON text as the Tolgee default value so the UI reads correctly even before a key syncs.
// Quiz ids may differ per region, and ids that happen to be shared (e.g. PE1) can have different
// wording per region, which is exactly why the keys are namespaced instead of shared.

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
  const regionId = region?.id;
  return Object.values(region?.quiz || {}).map(q => ({
    id: q.id,
    question: q.question,
    tema: q.topic,
    question_key: `quiz.questions.${regionId}.${q.id}`,
    topic_key: `quiz.topics.${regionId}.${q.id}`,
    options: [
      "answers.agreeCapitalized",
      "answers.neutralCapitalized",
      "answers.disagreeCapitalized",
    ],
    polarity: "",
  }));
}

// Shape a region like the presidential votes file so the scoring pipeline can be reused.
// regionId travels with it so comment keys (explanations.candidates.<regionId>.<id>.<qid>) can be built.
export function toVotesData(data, regionId) {
  const region = getRegion(data, regionId);
  if (!region) return null;
  return {
    version: data.version,
    regionId,
    quiz: region.quiz,
    candidates: region.candidates,
  };
}

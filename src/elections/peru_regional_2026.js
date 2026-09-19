import peru2026 from "./peru_2026";

const qaPrefix = import.meta.env.VITE_TOLGEE_QA_TRANSLATIONS === 'true' ? '/qa' : '';

// Regional & municipal-style election: same look, assets and widgets as peru_2026,
// but the user first picks a region, and quiz + candidates come from that region.
export default {
  ...peru2026,
  id: "peru_regional_2026",
  label: "elections.peruRegional2026",
  defaultLabel: "Perú 2026 - Elecciones Regionales",
  // Opt-in via VITE_ELECTION_ID so it never appears in multi-election builds by accident
  enabled: false,

  meta: {
    title: "Electómetro - Regionales Perú 2026",
    description: "El Electómetro es una aplicación de consejo de voto para las elecciones regionales de Perú 2026.",
    favicon: "peru_2026/favicon.svg",
    canonicalUrl: "https://electometro.decide.pe/regionales/",
    lang: "es",
  },

  // Fallback intro copy (used until Tolgee has welcome.peru_regional_2026.* keys)
  intro: {
    title: "Electómetro regional",
    description1: "Descubre qué candidatos a tu gobierno regional se parecen más a ti.",
    description2: "Primero elegirás tu región y luego responderás preguntas sobre los temas que importan en ella.",
  },

  regional: true,
  regionalVotesUrl: `${import.meta.env.VITE_ELECTIONS_DATA_URL}${qaPrefix}/peru_2026/combined_votes_peru_regions_2026_compact.json`,
  partyVotesUrl: null,
  presVotesUrl: null,
  isPresidentialElection: false,

  rounds: [],
  questionTypes: ["regional"],
  // Regional candidates reuse the candidate ranking pipeline
  resultTypes: ["presidentialCandidates"],
  showLawInfo: false,
  showBattleMode: false,
};

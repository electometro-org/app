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
  // Reuse the national stylesheet (its rules are scoped by [data-election="peru_2026"])
  styleId: "peru_2026",

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

  // Same widgets as peru_2026, except where overridden below
  widgets: peru2026.widgets.map(widget => {
    if (widget.type === "progress-indicator") {
      return {
        ...widget,
        // (mostly copied from peru_2026)
        layouts: {
          lg:  { x: 34, y: 12, w: 28, h: 4 },
          md:  { x: 20, y: 12, w: 32, h: 6 },
          sm:  { x: 1, y: 20, w: 46, h: 6 },
          xs:  { x: 2, y: 20, w: 28, h: 4 },
          xxs: { x: 3, y: 14, w: 18, h: 5 },
        },
      };
    }
    return widget;
  }),

  rounds: [],
  questionTypes: ["regional"],
  // Regional candidates reuse the candidate ranking pipeline
  resultTypes: ["presidentialCandidates"],
  showLawInfo: false,
  showBattleMode: false,
};

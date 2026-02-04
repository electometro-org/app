export default {
  id: "chile_2025",
  label: "elections.chile2025",  // Translation key
  enabled: false,

  // HTML metadata (used at build time)
  meta: {
    title: "Electómetro - Chile 2025",
    description: "El Electómetro es una aplicación de consejo de voto para las elecciones de Chile 2025.",
    favicon: "/favicon.svg",
    canonicalUrl: "https://electometro.org/",
    lang: "es",
  },

  regions: ["Santiago de Chile", "Otro"],

  // Election-specific branding (logos used in components)
  branding: {
    logo: "chile_2025/simple_logo.png",
    logoAlt: "chile_2025/reverseLogo.svg",
    favicon: "chile_2025/favicon.svg",
  },

  // Path to election-specific assets (party logos, etc.)
  assetsPath: "chile_2025/",

  // API endpoints
  partyVotesUrl: "/api/elections/chile_2025/combined_votes_chile_partidos_2025.json",
  presVotesUrl: "/api/elections/chile_2025/combined_votes_chile_pres_2025.json",
  isPresidentialElection: true,
  processCandidateVote: v => v,
  showLawInfo: true,
  questionTypes:   ["presidential"],
  resultTypes:     ["party", 
                    // "parliamentaryCandidates", 
                    "presidentialCandidates"]
}

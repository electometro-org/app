export default {
  id: "peru_2026",
  label: "elections.peru2026",  // Translation key
  enabled: true,

  // HTML metadata (used at build time)
  meta: {
    title: "Electómetro - Perú 2026",
    description: "El Electómetro es una aplicación de consejo de voto para las elecciones de Perú 2026.",
    favicon: "peru_2026/favicon.svg",
    canonicalUrl: "https://electometro.decide.pe/",
    lang: "es",
  },

  regions: [
    "Lima",
    "Extranjero",
    "Amazonas",
    "Áncash",
    "Apurímac",
    "Arequipa",
    "Ayacucho",
    "Cajamarca",
    "Callao",
    "Cusco",
    "Huancavelica",
    "Huánuco",
    "Ica",
    "Junín",
    "La Libertad",
    "Lambayeque",
    "Lima Metropolitana", // Stadtkreis
    "Lima Provincias",    // Landkreis
    "Loreto",
    "Madre de Dios",
    "Moquegua",
    "Pasco",
    "Piura",
    "Puno",
    "San Martín",
    "Tacna",
    "Tumbes",
    "Ucayali",
  ],

  // Election-specific branding (logos used in components)
  branding: {
    logo: "peru_2026/simple_logo.png",
    logoAlt: "peru_2026/reverse_logo.svg",
    favicon: "peru_2026/favicon.svg",
  },

  // Path to election-specific assets (party logos, etc.)
  assetsPath: "peru_2026/",

  // Theme overrides for CSS variables
  // These override the defaults from src/colors.js
  theme: {
    background: "#f5f5f5",
    accent: "#c32e2e",
    accentLight: "#A12727",
    buttonSelected: "#9caea0",
    buttonNext: "#394248",
    fontColor: "#474747",
    fontColorLight: "#ffffff",
    buttonColor: "#ffffff",
    buttonShadow: "#00000026",
    buttonHover: "#f5f5f5",
    buttonNextHover: "#042533",
    introBoxBg: "#f5f5f5",
  },

  // API endpoints
  partyVotesUrl: "/api/elections/peru_2026/combined_votes_peru_partidos_2026.json",
  presVotesUrl: "/api/elections/peru_2026/combined_votes_peru_pres_2026.json",
  isPresidentialElection: true,
  processCandidateVote: v => v,
  showLawInfo: true,
  questionTypes:   ["presidential"],
  resultTypes:     ["party", 
                    // "parliamentaryCandidates", 
                    "presidentialCandidates"]
}

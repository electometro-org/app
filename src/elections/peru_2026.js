// Register election-specific widgets
import './peru_2026/widgets';

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

  // Path to election-specific assets (party logos, etc.)
  assetsPath: "peru_2026/",

  // Election-specific branding (logos used in components)
  branding: {
    logo: "peru_2026/simple_logo.png",
    logoAlt: "peru_2026/reverse_logo.svg",
    favicon: "peru_2026/favicon.svg",
  },

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

  // Theme overrides for loading screen
  loadingScreen: {
    background: "rgba(245, 245, 245, 0.9)",  // Custom background
    spinnerPrimary: "#c32e2e",                // Outer ring color
    spinnerSecondary: "#000000",              // Inner ring color
  },

  // Background configuration
  // Options: 'solid', 'image', 'slideshow', 'gradient'
  // Default is 'solid' which uses var(--background)
  background: {
    // Example slideshow config (uncomment to use):
    // type: "slideshow",
    // images: [
    //   "peru_2026/backgrounds/congress.jpg",
    //   "peru_2026/backgrounds/lima.jpg",
    //   "peru_2026/backgrounds/machu_picchu.jpg",
    // ],
    // mode: "per-question",
    // transitionDuration: 600,
    // overlay: { color: "rgba(0, 0, 0, 0.4)" }
    // =========================================
    type: "solid",
    // =========================================
    // type: "image",
    // src: "peru_2026/backgrounds/Lima-Plaza-de-Armas.svg",
    // size: "cover",
    // position: "center",
    // colorScheme: "light dark",
    // overlay: { color: "rgba(255, 255, 255, 0.65)" }  // optional dark overlay
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
                    "presidentialCandidates"],

  // Widgets configuration
  widgets: [
    { type: "quiz", draggable: false, defaultSlot: "center" },
    { type: "progress-indicator",
      defaultSlot: "top",
      resizable: true,
      style: "dots",
      showOnPhase: ["quiz"],
      layouts: {
        lg:  { x: 41, y: 10, w: 14, h: 5 },
        md:  { x: 0, y: 0, w: 18, h: 6 },
        // sm, xs, xxs will fall back to DEFAULT_LAYOUTS
      },
      dockedTo: "above-question",
      dockTransition: {
        duration: 300,      // milliseconds
        easing: "ease-out",  // CSS easing function

        // Widget animation (reveals widget)
        widget: {
          effect: "fadeDown",  // Reveals from top to bottom
          duration: 400,
          easing: "ease-out"
        }
      }
    },
    // { type: "countdown-timer", defaultSlot: "right", duration: 30 },
    { type: "social-share",
      // defaultSlot: "bottom",
      showOnPhase: ["results"],
      layouts: {
        lg: { x: 43, y: 50, w: 25, h: 6 },
      }
    },
    // Custom election widget
    // {
    //   type: "peru-banner",
    //   id: "election-header",
    //   title: "Elecciones Perú 2026",
    //   subtitle: "Encuentra tu candidato ideal",
    //   layouts: {
    //     lg: { x: 0, y: 0, w: 40, h: 8 },
    //     md: { x: 0, y: 0, w: 30, h: 8 },
    //     sm: { x: 0, y: 0, w: 48, h: 6 },
    //     xs: { x: 0, y: 0, w: 32, h: 6 },
    //     xxs: { x: 0, y: 0, w: 24, h: 6 },
    //   }
    // },
    // Multiple placeholder widgets with unique IDs
    // {
    //   type: "placeholder",
    //   id: "test-header",
    //   label: "Header Area",
    //   resizable: true,
    //   layouts: { lg: { x: 0, y: 0, w: 96, h: 8 } }
    // },
    // {
    //   type: "placeholder",
    //   id: "test-sidebar",
    //   label: "",
    //   layouts: { lg: { x: 0, y: 10, w: 20, h: 40 } },
    //   invisible: false,
    // },
    // {
    //   type: "placeholder",
    //   id: "button-overlay",
    //   color: "rgba(255, 0, 0, 0.2)",  // Custom color
    //   layouts: { lg: { x: 30, y: 45, w: 30, h: 10 } }
    // },
  ]
}
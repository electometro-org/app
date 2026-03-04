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
  partyVotesUrl: `${import.meta.env.VITE_ELECTIONS_DATA_URL}/peru_2026/combined_votes_peru_partidos_2026.json`,
  presVotesUrl: `${import.meta.env.VITE_ELECTIONS_DATA_URL}/peru_2026/combined_votes_peru_pres_2026.json`,
  isPresidentialElection: true,
  processCandidateVote: v => v,
  showLawInfo: true,
  questionTypes:   ["presidential"],
  resultTypes:     ["party",
                    // "parliamentaryCandidates",
                    "presidentialCandidates"],
  // Minimum ratio of answered questions required to finish quiz and show results.
  // Skipped/unanswered questions do not count.
  minAnsweredRatioForResults: 0.5,

  // Widgets configuration
  widgets: [
    { type: "quiz",
      draggable: false,
      defaultSlot: "center",
      layouts: {
        lg:  { x: 24, y: 0, w: 48, h: 40 },
        md:  { x: 12, y: 0, w: 48, h: 35 },
        sm:  { x: 4, y: 8, w: 40, h: 35 },
        xs:  { x: 0, y: 8, w: 32, h: 35 },
        xxs: { x: 0, y: 3, w: 24, h: 40 },
      }
    },
    { type: "progress-indicator",
      defaultSlot: "top",
      resizable: true,
      style: "dots",
      showOnPhase: ["quiz"],
      layouts: {
        lg:  { x: 34, y: 10, w: 28, h: 4 },
        md:  { x: 20, y: 10, w: 32, h: 6 },
        xxs: { x: 3, y: 12, w: 18, h: 5 },
        // sm, xs fall back to DEFAULT_LAYOUTS
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
    // { type: "social-share",
    //   // defaultSlot: "bottom",
    //   showOnPhase: ["results"],
    //   resizable: true,
    //   layouts: {
    //     lg: { x: 43, y: 49, w: 25, h: 8 },
    //     xxs: {x: 0, y: 64, w: 24, h: 7 },
    //   }
    // },
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
    //   id: "1",
    //   label: "1",
    //   resizable: true,
    //   layouts: { lg: { x: 0, y: 0, w: 9, h: 8 } }
    // },
    // {
    //   type: "placeholder",
    //   id: "2",
    //   label: "2",
    //   layouts: { lg: { x: 0, y: 0, w: 9, h: 8 } },
    //   invisible: false,
    //   resizable: true,
    // },
    // {
    //   type: "placeholder",
    //   id: "3",
    //   label: "3",
    //   // color: "rgba(255, 0, 0, 0.2)",  // Custom color
    //   layouts: { lg: { x: 0, y: 0, w: 9, h: 8 } },
    //   resizable: true,
    // },
    // {
    //   type: "placeholder",
    //   id: "4",
    //   label: "4",
    //   resizable: true,
    //   layouts: { lg: { x: 0, y: 0, w: 9, h: 8 } }
    // },
    // {
    //   type: "placeholder",
    //   id: "5",
    //   label: "5",
    //   resizable: true,
    //   layouts: { lg: { x: 0, y: 0, w: 9, h: 8 } }
    // },
    // {
    //   type: "placeholder",
    //   id: "6",
    //   label: "6",
    //   resizable: true,
    //   layouts: { lg: { x: 0, y: 0, w: 9, h: 8 } }
    // },
    // {
    //   type: "placeholder",
    //   id: "7",
    //   label: "7",
    //   resizable: true,
    //   layouts: { lg: { x: 0, y: 0, w: 9, h: 8 } }
    // },
    // {
    //   type: "placeholder",
    //   id: "8",
    //   label: "8",
    //   resizable: true,
    //   layouts: { lg: { x: 0, y: 0, w: 9, h: 8 } }
    // },    {
    //   type: "placeholder",
    //   id: "9",
    //   label: "9",
    //   resizable: true,
    //   layouts: { lg: { x: 0, y: 0, w: 9, h: 8 } }
    // },
    // {
    //   type: "placeholder",
    //   id: "10",
    //   label: "10",
    //   resizable: true,
    //   layouts: { lg: { x: 0, y: 0, w: 9, h: 8 } }
    // },
    // {
    //   type: "placeholder",
    //   id: "11",
    //   label: "11",
    //   resizable: true,
    //   layouts: { lg: { x: 0, y: 0, w: 9, h: 8 } }
    // },
    // {
    //   type: "placeholder",
    //   id: "12",
    //   label: "12",
    //   resizable: true,
    //   layouts: { lg: { x: 0, y: 0, w: 9, h: 8 } }
    // },
    // {
    //   type: "placeholder",
    //   id: "13",
    //   label: "13",
    //   resizable: true,
    //   layouts: { lg: { x: 0, y: 0, w: 9, h: 8 } }
    // },
    // {
    //   type: "placeholder",
    //   id: "14",
    //   label: "14",
    //   resizable: true,
    //   layouts: { lg: { x: 0, y: 0, w: 9, h: 8 } }
    // },
    // {
    //   type: "placeholder",
    //   id: "15",
    //   label: "15",
    //   resizable: true,
    //   layouts: { lg: { x: 0, y: 0, w: 9, h: 8 } }
    // },
    // {
    //   type: "placeholder",
    //   id: "16",
    //   label: "16",
    //   resizable: true,
    //   layouts: { lg: { x: 0, y: 0, w: 9, h: 8 } }
    // },
    // {
    //   type: "placeholder",
    //   id: "17",
    //   label: "17",
    //   resizable: true,
    //   layouts: { lg: { x: 0, y: 0, w: 9, h: 8 } }
    // },
    // {
    //   type: "placeholder",
    //   id: "18",
    //   label: "18",
    //   resizable: true,
    //   layouts: { lg: { x: 0, y: 0, w: 9, h: 8 } }
    // },{
    //   type: "placeholder",
    //   id: "19",
    //   label: "19",
    //   resizable: true,
    //   layouts: { lg: { x: 0, y: 0, w: 9, h: 8 } }
    // },{
    //   type: "placeholder",
    //   id: "20",
    //   label: "20",
    //   resizable: true,
    //   layouts: { lg: { x: 0, y: 0, w: 9, h: 8 } }
    // },


    /* ───────────────────────────────────────────── */
    /* ALWAYS-VISIBLE PLACEHOLDERS (20)              */
    /* STACKED AT x=0, y=21                          */
    /* ───────────────────────────────────────────── */
    //
    // ...Array.from({ length: 20 }, (_, i) => ({
    //   type: "placeholder",
    //   id: `always-${String(i + 1).padStart(2, "0")}`,
    //   label: `Always ${i + 1}`,
    //   resizable: true,
    //   layouts: {
    //     lg: { x: 0, y: 21, w: 9, h: 8 }
    //   }
    // })),
    //
    // /* ───────────────────────────────────────────── */
    // /* ELECTION-INTRO (20 · STACKED)                 */
    // /* x=0, y=0                                     */
    // /* ───────────────────────────────────────────── */
    //
    // ...Array.from({ length: 20 }, (_, i) => ({
    //   type: "placeholder",
    //   id: `election-intro-${String(i + 1).padStart(2, "0")}`,
    //   label: `election-intro ${i + 1}`,
    //   showOnPhase: ["election-intro"],
    //   resizable: true,
    //   layouts: {
    //     lg: { x: 0, y: 0, w: 9, h: 8 }
    //   }
    // })),
    //
    // /* ───────────────────────────────────────────── */
    // /* QUIZ (20 · STACKED)                           */
    // /* x=84, y=45                                   */
    // /* ───────────────────────────────────────────── */
    //
    // ...Array.from({ length: 20 }, (_, i) => ({
    //   type: "placeholder",
    //   id: `quiz-${String(i + 1).padStart(2, "0")}`,
    //   label: `quiz ${i + 1}`,
    //   showOnPhase: ["quiz"],
    //   resizable: true,
    //   layouts: {
    //     lg: { x: 87, y: 3, w: 9, h: 8 }
    //   }
    // })),
    //
    // /* ───────────────────────────────────────────── */
    // /* DEMOGRAPHICS (20 · STACKED)                   */
    // /* x=87, y=3                                    */
    // /* ───────────────────────────────────────────── */
    //
    // ...Array.from({ length: 20 }, (_, i) => ({
    //   type: "placeholder",
    //   id: `demographics-${String(i + 1).padStart(2, "0")}`,
    //   label: `demographics ${i + 1}`,
    //   showOnPhase: ["demographics"],
    //   resizable: true,
    //   layouts: {
    //     lg: { x: 84, y: 45, w: 9, h: 8 }
    //   }
    // })),
    //
    // /* ───────────────────────────────────────────── */
    // /* RESULTS (20 · STACKED)                        */
    // /* x=0, y=45                                    */
    // /* ───────────────────────────────────────────── */
    //
    // ...Array.from({ length: 20 }, (_, i) => ({
    //   type: "placeholder",
    //   id: `results-${String(i + 1).padStart(2, "0")}`,
    //   label: `results ${i + 1}`,
    //   showOnPhase: ["results"],
    //   resizable: true,
    //   layouts: {
    //     lg: { x: 0, y: 45, w: 9, h: 8 }
    //   }
    // })),

    // Gauge widget - shows opinion (color) and importance (arc position)
    // DISABLED: Per-question importance replaced by Topic Importance view
    // {
    //   type: 'gauge',
    //   size: 'medium',
    //   showPointer: true,
    //   layouts: {
    //     lg: {x: 31, y: 31, w: 33, h: 11 },
    //     xxs: {x: 1, y: 32, w: 21, h: 13},
    //   },
    //   agreeColor: '#4a9c6d',
    //   neutralColor: '#6b7280',
    //   disagreeColor: '#c32e2e',
    //   showOnPhase: ['quiz'],
    //   resizable: true,
    //   dockedTo: 'below-question',
    //   dockTransition: {
    //     duration: 300,
    //     easing: 'ease-out',
    //     widget: {
    //       effect: 'fadeDown',
    //       duration: 400,
    //       easing: 'ease-out'
    //     }
    //   }
    // },
    // Opinion buttons - combined opinion + importance selection
    // Replaces default answer buttons and importance slider
    // DISABLED: Per-question importance replaced by Topic Importance view
    // {
    //   type: 'opinion-buttons',
    //   showOnPhase: ['quiz'],
    //   showEmojis: true,
    //   resizable: true,
    //   draggable: true,
    //   layouts: {
    //     lg: {x: 40, y: 19, w: 18, h: 13 },
    //     xxs: {x: 3, y: 20, w: 20, h: 14},
    //   },
    //   emojiNotImportant: '🤷',
    //   emojiNeutral: '🤔',
    //   emojiVeryImportant: '🚨',
    //   agreeColor: '#4a9c6d',
    //   neutralColor: '#6b7280',
    //   disagreeColor: '#c32e2e',
    //   blockDuration: 1000,           // ms to block buttons on new question
    //   hoverReactivateDistance: 10,   // pixels to move before hover reactivates after click
    //   touchConfirmDuration: 500,    // ms to hold touch before confirming selection (mobile)
    //   dockedTo: 'above-buttons',
    //   dockTransition: {
    //     duration: 300,
    //     easing: 'ease-out',
    //     widget: {
    //       effect: 'fadeDown',
    //       duration: 400,
    //       easing: 'ease-out'
    //     }
    //   }
    // }
  ]
}

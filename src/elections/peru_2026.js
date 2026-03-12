// Register election-specific widgets
import './peru_2026/widgets';

// Use /qa/ path prefix for QA environment
const qaPrefix = import.meta.env.VITE_TOLGEE_QA_TRANSLATIONS === 'true' ? '/qa' : '';

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
  // Base URL for assets (bucket) - party logos, candidate photos, etc.
  assetsBaseUrl: import.meta.env.VITE_ELECTIONS_DATA_URL,

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

  // API endpoints (compact JSON format with short keys: t1, c1, p1, etc.)
  // Uses /qa/ prefix when VITE_TOLGEE_QA_TRANSLATIONS is set
  partyVotesUrl: `${import.meta.env.VITE_ELECTIONS_DATA_URL}${qaPrefix}/peru_2026/combined_votes_peru_partidos_2026_compact.json`,
  presVotesUrl: `${import.meta.env.VITE_ELECTIONS_DATA_URL}${qaPrefix}/peru_2026/combined_votes_peru_pres_2026_compact.json`,
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
    
  mnemonicWordList: [
    // A (16 words)
    "abeja","acero","actor","aguja","aire","ala","alga","alma","alto","ancla","anillo","animal","apio","arco","arena","ave",
    // B (16 words)
    "avena","avion","azul","bala","barco","barro","base","bebe","beso","bicho","blusa","boca","bola","borde","bosque","bote",
    // C (32 words)
    "brasa","brazo","brisa","broma","brote","bruja","buho","burro","cabra","cacao","cafe","caja","cal","calor","calma","cama",
    "campo","canal","canoa","canto","cara","carne","carro","carta","casa","castor","cebolla","cedro","celda","cena","censo","cerdo",
    // C-D (16 words)
    "cerca","cerro","chico","chile","chivo","choza","ciclo","cielo","cima","cine","cinta","circo","cisne","claro","clase","clavo",
    // D (16 words)
    "cobre","coco","cola","colina","color","cometa","copa","coral","corcho","corte","costa","cria","cruce","cuadro","cueva","cuero",
    // D-E (16 words)
    "cuota","curva","dado","danza","dardo","dedo","delta","denso","diente","dieta","dique","dolar","domo","dorso","drama","ducha",
    // E-F (16 words)
    "duelo","dulce","duro","eco","edad","eje","elite","embudo","empuje","enojo","entero","envio","epoca","equipo","error","escala",
    // F (16 words)
    "escena","esfera","espada","espejo","espina","espuma","estado","etapa","etica","extra","faja","falda","fama","fase","fauna","fecha",
    // F-G (16 words)
    "feliz","feria","fideo","fiera","fila","filtro","firma","flauta","flor","foco","forma","foto","frase","fresa","frio","fruta",
    // G-H (16 words)
    "fuego","fuente","fuerza","fuga","funda","furia","gafas","gallo","gamba","gancho","ganso","garra","gato","gemelo","genio","gente",
    // H (16 words)
    "germen","gesto","giro","globo","golpe","goma","gorra","gota","grada","grano","grasa","grifo","grillo","grupo","guante","guerra",
    // H-I (16 words)
    "guia","gusto","habla","hacha","hada","harina","helio","heroe","hielo","higo","hilo","hongo","honor","hora","hormiga","horno",
    // I-J (16 words)
    "hotel","hueso","humo","humor","huron","icono","idea","igual","isla","jabon","jarra","jaula","jefe","jinete","joya","juego",
    // J-L (16 words)
    "juez","jugo","junco","lago","lana","lapiz","largo","lata","latir","laurel","lava","lazo","leche","lector","leon","letra",
    // L-M (16 words)
    "libre","limon","lindo","linea","lista","lobo","loco","loma","lote","lucha","lugar","luna","luz","madre","magia","maiz",
    // M (16 words)
    "mango","mano","mapa","marca","marea","marfil","masa","mayor","medal","medio","mejor","melon","menor","mente","menu","mesa",
    // M-N (16 words)
    "metal","metro","miel","mimo","mina","modo","moho","molde","molino","mono","monte","morado","mosca","motor","muelle","muro",
    // N-O (16 words)
    "nabo","nadar","nariz","nata","nave","nectar","negro","neon","nido","niebla","nieve","ninja","nivel","noche","nogal","norma",
    // O-P (16 words)
    "nota","nube","nudo","nueve","nuez","obvio","ocaso","ocho","ocio","oeste","ogro","ola","olivo","olla","olmo","olor",
    // P (16 words)
    "onda","opera","orden","oreja","orilla","oro","oruga","oso","oveja","oxido","padre","paja","palma","palo","pan","panda",
    // P (16 words)
    "papel","pared","parque","parte","pasar","pasta","patio","pato","pausa","pavo","paz","peine","pelar","pena","pensar","peor",
    // P-R (16 words)
    "perla","perro","peso","piano","pico","pie","piedra","piel","pierna","pieza","pila","pilon","pino","pista","plano","plata",
    // R (16 words)
    "playa","plaza","pluma","pobre","poco","poder","poema","polen","polvo","poner","portal","poste","potro","precio","presa","primo",
    // R-S (16 words)
    "proa","probar","puma","punto","queso","rama","rampa","rana","rango","rapto","razon","recto","red","reloj","remo","reina",
    // S (16 words)
    "relato","reno","resto","rio","ritmo","roca","roce","rocio","rodar","rodeo","rojo","romper","ron","rosa","rostro","rueda",
    // S (16 words)
    "ruido","rumbo","rural","saber","sabor","sacar","sal","salir","salon","salsa","salto","salud","samba","santo","sapo","sarten",
    // S-T (16 words)
    "sauce","saxo","seco","seda","selva","senal","serie","sierra","siglo","signo","silbar","silla","sol","solar","solo","soltar",
    // T (16 words)
    "sombra","son","sonar","sopa","soplar","sordo","subir","sucio","suelo","sueno","suerte","suma","sur","surco","tabla","taco",
    // T-U (16 words)
    "talon","tango","tapa","tarde","tarea","tarro","tauro","taza","techo","tejer","tela","tema","temor","templo","tenaz","tenis",
    // U-V (16 words)
    "tenso","tetera","texto","tigre","tijera","tinta","tipo","tirar","titan","titulo","tocar","toldo","tomar","tono","topar","toro",
    // V-Z (16 words)
    "torre","torta","tos","total","trapo","trece","trigo","tripa","trozo","trueno","tubo","tumba","tunel","turbio","turno","tutor",
    // Final (16 words)
    "unico","unir","uva","vaca","vacio","vago","vaina","valle","valor","vapor","vara","vaso","vela","veloz","vena","venta",
    // Final (16 words)
    "ver","verde","verso","viajar","vida","vidrio","viejo","viento","viernes","vigor","vino","vista","viuda","vivir","zanja","zapato"
  ],

  // Widgets configuration
  widgets: [
    { type: "quiz",
      draggable: false,
      defaultSlot: "center",
      // Apply legacy (taller) quiz layout only during results on old Safari/iOS.
      legacyLayoutsOnPhases: ["results"],
      keepLegacySize: true,
      keepLegacyPosition: true,
      layouts: {
        lg:  { x: 24, y: 0, w: 48, h: 40 },
        md:  { x: 12, y: 0, w: 48, h: 35 },
        sm:  { x: 4, y: 8, w: 40, h: 35 },
        xs:  { x: 0, y: 8, w: 32, h: 35 },
        xxs: { x: 0, y: 3, w: 24, h: 40 },
      },
      legacyLayouts: {
        // iOS 12 fallback: extra height avoids compact-results clipping inside quiz widget.
        lg:  { x: 24, y: 0, w: 48, h: 66 },
        md:  { x: 12, y: 0, w: 48, h: 67 },
        sm:  { x: 4, y: 8, w: 40, h: 65 },
        xs:  { x: 0, y: 4, w: 32, h: 70 },
        xxs: { x: 0, y: 3, w: 24, h: 80 },
      }
    },
    { type: "progress-indicator",
      defaultSlot: "top",
      resizable: false,
      style: "dots",
      showOnPhase: ["quiz"],
      layouts: {
        lg:  { x: 34, y: 10, w: 28, h: 4 },
        md:  { x: 20, y: 10, w: 32, h: 6 },
        sm: { x: 1, y: 18, w: 46, h: 6 },
        xs:  { x: 2, y: 18, w: 28, h: 4 },
        xxs: { x: 3, y: 12, w: 18, h: 5 }
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

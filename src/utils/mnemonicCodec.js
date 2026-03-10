/**
 * Mnemonic Codec for Quiz State
 *
 * Encodes quiz answers + weights into a memorable phrase like:
 * "sol-luna-rio-mar-cielo-nube-flor-ave"
 *
 * Each question uses 3 bits:
 * - 2 bits for answer (agree=0, neutral=1, disagree=2, skip=3)
 * - 1 bit for weight (normal=0, important=1)
 *
 * For skipped questions, weight bit is always 0.
 *
 * Elections can provide a custom 256-word list via config.mnemonicWordList
 */

// Answer key mappings
const ANSWER_KEYS = {
  "answers.agreeCapitalized": 0,
  "answers.neutralCapitalized": 1,
  "answers.disagreeCapitalized": 2,
};
const ANSWER_VALUES = [
  "answers.agreeCapitalized",
  "answers.neutralCapitalized",
  "answers.disagreeCapitalized",
  null, // skipped
];

// Default 256 curated Spanish words - short, common, distinct, family-friendly
export const DEFAULT_WORD_LIST = [
  // Nature (0-31)
  "sol", "luna", "mar", "rio", "aire", "agua", "nube", "flor",
  "arbol", "hoja", "rama", "raiz", "cielo", "tierra", "monte", "valle",
  "playa", "ola", "roca", "arena", "lago", "luz", "fuego", "viento",
  "lluvia", "nieve", "hielo", "bosque", "campo", "prado", "selva", "costa",
  // Animals (32-63)
  "gato", "perro", "leon", "tigre", "oso", "lobo", "zorro", "liebre",
  "ave", "pato", "buho", "aguila", "pez", "rana", "sapo", "tortuga",
  "abeja", "mosca", "hormiga", "araña", "cabra", "oveja", "vaca", "toro",
  "cerdo", "burro", "caballo", "ciervo", "raton", "conejo", "mono", "foca",
  // Colors (64-79)
  "rojo", "azul", "verde", "rosa", "blanco", "negro", "gris", "oro",
  "plata", "bronce", "coral", "crema", "lila", "marron", "naranja", "morado",
  // Body (80-95)
  "mano", "pie", "ojo", "nariz", "boca", "oreja", "dedo", "brazo",
  "pierna", "cara", "pelo", "cuello", "espalda", "pecho", "codo", "rodilla",
  // Objects (96-127)
  "casa", "mesa", "silla", "cama", "puerta", "ventana", "techo", "pared",
  "libro", "pluma", "papel", "caja", "bolsa", "copa", "vaso", "plato",
  "cuchara", "tenedor", "olla", "sarten", "reloj", "llave", "anillo", "espejo",
  "vela", "lampara", "alfombra", "cortina", "cuadro", "foto", "radio", "carro",
  // Food (128-159)
  "pan", "leche", "queso", "huevo", "arroz", "pasta", "sopa", "carne",
  "pollo", "pescado", "fruta", "manzana", "pera", "uva", "limon", "naranja",
  "fresa", "cereza", "melon", "sandia", "tomate", "papa", "cebolla", "ajo",
  "sal", "pimienta", "aceite", "miel", "azucar", "cafe", "te", "jugo",
  // Actions (160-191)
  "saltar", "correr", "andar", "nadar", "volar", "subir", "bajar", "entrar",
  "salir", "abrir", "cerrar", "dar", "tomar", "poner", "sacar", "meter",
  "ver", "oir", "oler", "tocar", "hablar", "cantar", "bailar", "reir",
  "llorar", "dormir", "soñar", "pensar", "creer", "saber", "sentir", "querer",
  // Places (192-223)
  "ciudad", "pueblo", "calle", "plaza", "parque", "jardin", "tienda", "mercado",
  "escuela", "iglesia", "museo", "teatro", "cine", "hotel", "banco", "oficina",
  "fabrica", "puerto", "torre", "puente", "fuente", "estatua", "templo", "castillo",
  "granja", "molino", "mina", "cueva", "isla", "desierto", "oasis", "cumbre",
  // Abstract & misc (224-255)
  "paz", "amor", "vida", "alma", "sueño", "tiempo", "espacio", "fuerza",
  "calma", "prisa", "gozo", "pena", "risa", "llanto", "furia", "miedo",
  "fe", "honor", "gloria", "fama", "suerte", "destino", "camino", "viaje",
  "norte", "sur", "este", "oeste", "centro", "borde", "fondo", "cima",
];

// Pre-built reverse lookup for default list
const DEFAULT_WORD_TO_INDEX = Object.fromEntries(
  DEFAULT_WORD_LIST.map((word, index) => [word, index])
);

/**
 * Build reverse lookup map for a word list
 * @param {string[]} wordList - Array of 256 words
 * @returns {Object} Map from word to index
 */
function buildWordToIndex(wordList) {
  if (wordList === DEFAULT_WORD_LIST) {
    return DEFAULT_WORD_TO_INDEX;
  }
  return Object.fromEntries(
    wordList.map((word, index) => [word.toLowerCase(), index])
  );
}

/**
 * Validate a word list
 * @param {string[]} wordList - Array to validate
 * @returns {boolean} True if valid (exactly 256 unique words)
 */
export function isValidWordList(wordList) {
  if (!Array.isArray(wordList) || wordList.length !== 256) {
    return false;
  }
  const uniqueWords = new Set(wordList.map((w) => String(w).toLowerCase()));
  return uniqueWords.size === 256;
}

/**
 * Encode quiz state to mnemonic phrase
 * @param {Array} answers - Array of answer keys (e.g., "answers.agreeCapitalized") or null
 * @param {Array} weights - Array of weights (2 = normal, 3 = important)
 * @param {string[]} [wordList] - Optional custom 256-word list (defaults to DEFAULT_WORD_LIST)
 * @returns {string} Hyphen-separated mnemonic phrase
 */
export function encodeToMnemonic(answers, weights, wordList = DEFAULT_WORD_LIST) {
  if (!Array.isArray(answers) || answers.length === 0) {
    return "";
  }

  const words = wordList || DEFAULT_WORD_LIST;

  // Build bit string: 3 bits per question
  let bits = "";
  for (let i = 0; i < answers.length; i++) {
    const answer = answers[i];
    const weight = weights?.[i] ?? 2;

    // Encode answer (2 bits): agree=0, neutral=1, disagree=2, skip=3
    let answerCode = 3; // default to skip
    if (answer != null && ANSWER_KEYS[answer] !== undefined) {
      answerCode = ANSWER_KEYS[answer];
    }

    // Encode weight (1 bit): normal(2)=0, important(3)=1
    const weightBit = answerCode === 3 ? 0 : (weight >= 3 ? 1 : 0);

    // Combine: answerCode (2 bits) + weightBit (1 bit)
    const combined = (answerCode << 1) | weightBit;
    bits += combined.toString(2).padStart(3, "0");
  }

  // Pad to multiple of 8 bits
  const paddingNeeded = (8 - (bits.length % 8)) % 8;
  bits += "0".repeat(paddingNeeded);

  // Convert to bytes and map to words
  const result = [];
  for (let i = 0; i < bits.length; i += 8) {
    const byte = parseInt(bits.slice(i, i + 8), 2);
    result.push(words[byte]);
  }

  return result.join("-");
}

/**
 * Decode mnemonic phrase to quiz state
 * @param {string} phrase - Hyphen-separated mnemonic phrase
 * @param {string[]} [wordList] - Optional custom 256-word list (defaults to DEFAULT_WORD_LIST)
 * @returns {{ answers: Array, weights: Array } | null} Decoded state or null if invalid
 */
export function decodeFromMnemonic(phrase, wordList = DEFAULT_WORD_LIST) {
  if (!phrase || typeof phrase !== "string") {
    return null;
  }

  const words = wordList || DEFAULT_WORD_LIST;
  const wordToIndex = buildWordToIndex(words);

  const phraseWords = phrase.toLowerCase().trim().split("-");
  if (phraseWords.length === 0 || phraseWords.some((w) => !w)) {
    return null;
  }

  // Convert words to bytes
  const bytes = [];
  for (const word of phraseWords) {
    const index = wordToIndex[word];
    if (index === undefined) {
      return null; // Invalid word
    }
    bytes.push(index);
  }

  // Convert bytes to bit string
  let bits = bytes.map((b) => b.toString(2).padStart(8, "0")).join("");

  // Decode 3 bits per question
  const answers = [];
  const weights = [];
  let i = 0;

  while (i + 3 <= bits.length) {
    const chunk = bits.slice(i, i + 3);
    const combined = parseInt(chunk, 2);

    const answerCode = (combined >> 1) & 0b11;
    const weightBit = combined & 0b1;

    // Stop if we hit padding (all remaining bits are 0 and answer is skip)
    if (answerCode === 3 && weightBit === 0) {
      // Check if remaining bits are all zeros (padding)
      const remaining = bits.slice(i);
      if (remaining.split("").every((b) => b === "0")) {
        break;
      }
    }

    const answer = ANSWER_VALUES[answerCode];
    const weight = answerCode === 3 ? 2 : (weightBit === 1 ? 3 : 2);

    answers.push(answer);
    weights.push(weight);
    i += 3;
  }

  return { answers, weights };
}

/**
 * Validate mnemonic phrase format
 * @param {string} phrase - Hyphen-separated mnemonic phrase
 * @param {string[]} [wordList] - Optional custom 256-word list (defaults to DEFAULT_WORD_LIST)
 * @returns {boolean} True if valid format
 */
export function isValidMnemonic(phrase, wordList = DEFAULT_WORD_LIST) {
  if (!phrase || typeof phrase !== "string") {
    return false;
  }

  const words = wordList || DEFAULT_WORD_LIST;
  const wordToIndex = buildWordToIndex(words);

  const phraseWords = phrase.toLowerCase().trim().split("-");
  if (phraseWords.length === 0 || phraseWords.some((w) => !w)) {
    return false;
  }

  // All words must be in the list
  return phraseWords.every((word) => wordToIndex[word] !== undefined);
}

/**
 * Get the default word list
 * @returns {string[]} The default 256-word list
 */
export function getWordList() {
  return [...DEFAULT_WORD_LIST];
}
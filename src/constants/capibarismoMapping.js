/**
 * Mapping of candidate display names (with accents) to Capibarismo slugified IDs.
 * IDs sourced from capibarismo-com/src/data/domains/base.ts
 */
export const CAPIBARISMO_CANDIDATE_MAP = {
  // Main candidates
  "Rafael López Aliaga": "rafael-lopezaliaga",
  "Keiko Fujimori": "keiko-fujimori",
  "César Acuña": "cesar-acuna",
  "José Luna Gálvez": "jose-luna",
  "George Forsyth": "george-forsyth",
  "Fernando Olivera": "luis-olivera",
  "Mesías Guevara": "mesias-guevara",
  "Jorge Nieto": "jorge-nieto",
  "Álvaro Paz de la Barra": "alvaro-paz",
  "Roberto Sánchez": "roberto-sanchez",
  "Mario Vizcarra": "mario-vizcarra",
  "Herbert Caller": "herbert-caller",
  "Paul Jaimes": "paul-jaimes",
  "Charlie Carrasco": "charlie-carrasco",
  "Carlos Jaico": "carlos-jaico",
  "Rosario Fernández": "rosario-fernandez",
  "Alfonso López Chau": "lopez-chau",

  // Additional candidates
  "Ricardo Belmont": "ricardo-belmont",
  "Roberto Chiabra": "roberto-chiabra",
  "Vladimir Cerrón": "vladimir-cerron",
  "Fiorella Molinelli": "fiorella-molinelli",
  "Ronald Atencio": "ronald-atencio",
  "Darwin Atencio": "ronald-atencio",
  "Pitter Valderrama": "pitter-valderrama",
  "Walter Chirinos": "walter-chirinos",
  "Wolfgang Grozo": "wolfgang-grozo",
  "Napoleón Becerra": "napoleon-becerra",
  "Rafael Belaúnde": "rafael-belaunde",
  "María Soledad Pérez Tello": "maria-perez",
  "María Pérez Tello": "maria-perez",
  "José Daniel Williams": "jose-williams",
  "José Williams": "jose-williams",
  "Francisco Diezcanseco": "francisco-diez-canseco",
  "Francisco Diez-Canseco": "francisco-diez-canseco",
  "Antonia Ortiz": "antonio-ortiz",
  "Antonio Ortiz": "antonio-ortiz",
  "Armando Masse": "armando-masse",
  "Carlos Álvarez": "carlos-alvarez",
  "Alex Gonzales": "alex-gonzales",
  "Alfonso Carlos Espá": "alfonso-espa",
  "Yonhy Lescano": "yonhy-lescano",
};

/**
 * Extracts the candidate name (without party) from a display name like "Name (Party)"
 * @param {string} displayName - Full display name with party
 * @returns {string} - Just the candidate name
 */
export function extractCandidateName(displayName) {
  if (!displayName || typeof displayName !== "string") return "";
  const match = displayName.match(/^([^(]+)/);
  if (match && match[1]) return match[1].trim();
  return displayName.trim();
}

/**
 * Gets the Capibarismo slug for a candidate
 * @param {string} displayName - Candidate display name (may include party)
 * @returns {string|null} - Capibarismo slug or null if not found
 */
export function getCapibarismoSlug(displayName) {
  const name = extractCandidateName(displayName);
  return CAPIBARISMO_CANDIDATE_MAP[name] || null;
}

/**
 * Builds the Capibarismo redirect URL with top 4 candidates
 * @param {Array} candidates - Array of candidate objects with displayName property
 * @returns {string} - Full redirect URL
 */
export function buildCapibarismoUrl(candidates) {
  const slugs = candidates
    .slice(0, 4)
    .map((c) => getCapibarismoSlug(c.displayName || c.name))
    .filter(Boolean);

  if (slugs.length < 4) {
    console.warn("Could not map all 4 candidates to Capibarismo slugs");
  }

  return `https://capibarismo.com/jugar?ref=dpe&semifinal=${slugs.join(",")}`;
}

/**
 * Background Registry
 *
 * Provides a registry pattern for background types, allowing anyone to add
 * custom implementations without modifying core files.
 */

const backgroundRegistry = new Map();

/**
 * Register a background type
 * @param {Object} config - Background configuration
 * @param {string} config.id - Unique identifier for the background type
 * @param {React.ComponentType} config.component - React component that renders the background
 */
export function registerBackground({ id, component }) {
  if (!id || typeof id !== 'string') {
    throw new Error('Background registration requires a string id');
  }
  if (!component) {
    throw new Error(`Background "${id}" requires a component`);
  }
  backgroundRegistry.set(id, component);
}

/**
 * Get a registered background component by id
 * @param {string} id - Background type identifier
 * @returns {React.ComponentType|null} - The background component or null if not found
 */
export function getBackground(id) {
  return backgroundRegistry.get(id) || null;
}

/**
 * Get all registered background type ids
 * @returns {string[]} - Array of registered background type ids
 */
export function getBackgroundTypes() {
  return Array.from(backgroundRegistry.keys());
}

/**
 * Check if a background type is registered
 * @param {string} id - Background type identifier
 * @returns {boolean}
 */
export function hasBackground(id) {
  return backgroundRegistry.has(id);
}

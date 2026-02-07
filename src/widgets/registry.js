/**
 * Widget Registry
 *
 * Provides a registry pattern for widget types, allowing anyone to add
 * custom implementations without modifying core files.
 */

const widgetRegistry = new Map();

/**
 * Register a widget type
 * @param {Object} config - Widget configuration
 * @param {string} config.id - Unique identifier for the widget type
 * @param {React.ComponentType} config.component - React component that renders the widget
 * @param {Object} [config.defaults] - Default configuration values for this widget type
 */
export function registerWidget({ id, component, defaults = {} }) {
  if (!id || typeof id !== 'string') {
    throw new Error('Widget registration requires a string id');
  }
  if (!component) {
    throw new Error(`Widget "${id}" requires a component`);
  }
  widgetRegistry.set(id, { component, defaults });
}

/**
 * Get a registered widget by id
 * @param {string} id - Widget type identifier
 * @returns {{ component: React.ComponentType, defaults: Object }|null}
 */
export function getWidget(id) {
  return widgetRegistry.get(id) || null;
}

/**
 * Get all registered widget type ids
 * @returns {string[]} - Array of registered widget type ids
 */
export function getWidgetTypes() {
  return Array.from(widgetRegistry.keys());
}

/**
 * Check if a widget type is registered
 * @param {string} id - Widget type identifier
 * @returns {boolean}
 */
export function hasWidget(id) {
  return widgetRegistry.has(id);
}

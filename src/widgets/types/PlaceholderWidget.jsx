import React from 'react';
import { registerWidget } from '../registry';
import './PlaceholderWidget.css';

/**
 * PlaceholderWidget
 *
 * An empty, resizable widget for testing layout placement.
 * Can be instantiated multiple times with different IDs.
 *
 * Config options:
 * - label: Optional text to display in the placeholder
 * - color: Optional background color (default: semi-transparent)
 * - invisible: If true, widget is fully transparent but still occupies space
 */
function PlaceholderWidget({ config }) {
  const { label, color, id, invisible } = config;

  if (invisible) {
    // Invisible spacer - occupies space but renders nothing visible
    return <div className="placeholder-widget placeholder-widget--invisible" />;
  }

  const style = color ? { backgroundColor: color } : {};

  return (
    <div className="placeholder-widget" style={style}>
      {label && <span className="placeholder-label">{label}</span>}
      {!label && id && <span className="placeholder-id">{id}</span>}
    </div>
  );
}

// Register with defaults
registerWidget({
  id: 'placeholder',
  component: PlaceholderWidget,
  defaults: {
    draggable: true,
  },
});

export default PlaceholderWidget;
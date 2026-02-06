import React from 'react';

/**
 * SolidBackground
 *
 * Default background that matches current behavior.
 * Uses the CSS variable --background for the color.
 *
 * Config options:
 *   - color: Optional override color (default: uses --background CSS variable)
 */
export function SolidBackground({ config }) {
  const style = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: config?.color || 'var(--background)',
  };

  return <div style={style} />;
}

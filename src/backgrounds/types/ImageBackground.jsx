import React from 'react';
import './ImageBackground.css';

/**
 * ImageBackground
 *
 * Static image background with configurable positioning and optional overlay.
 *
 * Config options:
 *   - src: string - Image source URL or path
 *   - size: 'cover' | 'contain' | 'auto' - CSS background-size (default: 'cover')
 *   - position: string - CSS background-position (default: 'center')
 *   - overlay: { color: string } - Optional overlay for text readability
 */
export function ImageBackground({ config }) {
  const {
    src,
    size = 'cover',
    position = 'center',
    overlay,
  } = config || {};

  if (!src) {
    return null;
  }

  return (
    <div className="image-background">
      <div
        className="image-background__image"
        style={{
          backgroundImage: `url(${src})`,
          backgroundSize: size,
          backgroundPosition: position,
        }}
      />
      {overlay?.color && (
        <div
          className="image-background__overlay"
          style={{ backgroundColor: overlay.color }}
        />
      )}
    </div>
  );
}

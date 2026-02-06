import React, { useMemo } from 'react';
import { useBackgroundContext } from './BackgroundContext';
import { getBackground } from './registry';
import './BackgroundLayer.css';

// Import built-in types (registers them)
import './types';

/**
 * BackgroundLayer
 *
 * Renders the active background component based on election config.
 * Positioned at z-index: 0, behind all content, with pointer-events: none.
 */
export function BackgroundLayer() {
  const { config, quizState } = useBackgroundContext();

  // Get the background component for the configured type
  const BackgroundComponent = useMemo(() => {
    const type = config?.type || 'solid';
    const component = getBackground(type);

    if (!component) {
      console.warn(`Background type "${type}" not found, falling back to solid`);
      return getBackground('solid');
    }

    return component;
  }, [config?.type]);

  if (!BackgroundComponent) {
    return null;
  }

  return (
    <div className="background-layer">
      <BackgroundComponent config={config} quizState={quizState} />
    </div>
  );
}

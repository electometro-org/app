import React, { useEffect } from 'react';
import { useDockingZone } from './useDocking';
import './DockingZone.css';
import debug from '../utils/debug';

/**
 * DockingZone
 *
 * A component that creates a docking zone where widgets can attach.
 * When a widget is docked, it renders a placeholder that reserves space.
 *
 * Usage:
 * ```jsx
 * <DockingZone id="below-question">
 *   <p>This content can be hidden when a widget docks here</p>
 * </DockingZone>
 * ```
 *
 * Or without children (just a docking point):
 * ```jsx
 * <QuestionText />
 * <DockingZone id="below-question" />
 * <AnswerButtons />
 * ```
 *
 * @param {string} id - Zone ID: 'above-question', 'below-question', 'above-buttons', 'below-buttons'
 * @param {React.ReactNode} children - Optional content to show when not docked
 * @param {string} className - Additional CSS classes
 */
export function DockingZone({ id, children, className = '' }) {
  const {
    zoneRef,
    dockedWidget,
    placeholderStyle,
    isHighlighted,
  } = useDockingZone(id);

  useEffect(() => {
    debug.log('[DockingZone] Component mounted:', id);
    return () => {
      debug.log('[DockingZone] Component unmounted:', id);
    };
  }, [id]);

  const hasContent = React.Children.count(children) > 0;
  const isDocked = !!dockedWidget;

  return (
    <div
      ref={zoneRef}
      className={`docking-zone ${className} ${isDocked ? 'docking-zone--docked' : ''} ${isHighlighted ? 'docking-zone--highlighted' : ''}`}
      data-zone-id={id}
    >
      {/* Original content - hidden when docked */}
      {hasContent && (
        <div className={`docking-zone__content ${isDocked ? 'docking-zone__content--hidden' : ''}`}>
          {children}
        </div>
      )}

      {/* Placeholder for docked widget - always rendered for smooth transitions */}
      <div
        className={`docking-zone__placeholder ${isDocked ? 'docking-zone__placeholder--active' : ''}`}
        style={placeholderStyle}
        data-docked-widget={dockedWidget || undefined}
      />

      {/* Visual indicator when dragging near zone */}
      {isHighlighted && !isDocked && (
        <div className="docking-zone__indicator">
          <span>Drop here</span>
        </div>
      )}
    </div>
  );
}

export default DockingZone;

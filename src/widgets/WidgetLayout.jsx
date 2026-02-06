import React, { useCallback, useMemo, useState, useEffect } from 'react';
import ReactGridLayout, { useContainerWidth, getCompactor } from 'react-grid-layout';
import { useWidgetContext } from './WidgetContext';
import { getWidget } from './registry';
import 'react-grid-layout/css/styles.css';
import './WidgetLayout.css';

// Import built-in types (registers them)
import './types';

// Grid configuration - ultra-fine grid for pixel-like placement
const COLS = 96;       // 8x finer than original 12
const ROW_HEIGHT = 8;  // 8px rows for fine vertical control

// Compactor with allowOverlap enabled, no compaction (null), no collision prevention
const overlappingCompactor = getCompactor(null, true, false);

// Quiz position (centered in 96-col grid)
// Original: x:3, w:6 on 12-col = 25% margin, 50% width
// New: x:24, w:48 on 96-col = same proportions
const QUIZ_LAYOUT = {
  i: 'quiz',
  x: 24,
  y: 0,
  w: 48,
  h: 63,  // ~500px equivalent (63 * 8 = 504px)
  static: false,
};

// Default positions for widgets (scaled 8x for columns, adjusted for 8px rows)
const DEFAULT_WIDGET_POSITIONS = {
  'progress-indicator': { x: 0, y: 0, w: 24, h: 6 },    // top-left
  'countdown-timer': { x: 72, y: 0, w: 24, h: 12 },     // top-right
  'social-share': { x: 24, y: 63, w: 48, h: 12 },       // below quiz
};

/**
 * Generate initial layout for widgets
 */
function generateInitialLayout(widgets, savedLayout) {
  return widgets.map(widget => {
    const isQuiz = widget.type === 'quiz';

    if (isQuiz) {
      return QUIZ_LAYOUT;
    }

    const saved = savedLayout[widget.type];
    const defaultPos = DEFAULT_WIDGET_POSITIONS[widget.type] || { x: 0, y: 0, w: 2, h: 2 };

    return {
      i: widget.type,
      x: saved?.x ?? defaultPos.x,
      y: saved?.y ?? defaultPos.y,
      w: saved?.w ?? defaultPos.w,
      h: saved?.h ?? defaultPos.h,
      minW: 1,
      minH: 1,
      static: widget.draggable === false,
    };
  });
}

/**
 * WidgetLayout
 *
 * Grid-based layout using react-grid-layout v2 API with allowOverlap.
 * Quiz is static in center, other widgets can be freely positioned.
 */
export function WidgetLayout({ children }) {
  const {
    widgets,
    layout: savedLayout,
    quizState,
    onLayoutChange,
  } = useWidgetContext();

  // v2 hook for container width measurement
  const { width, containerRef, mounted } = useContainerWidth();

  // Check if widget should be visible based on phase
  const isWidgetVisible = useCallback((widget) => {
    if (widget.showOnPhase) {
      const phases = Array.isArray(widget.showOnPhase) ? widget.showOnPhase : [widget.showOnPhase];
      if (!phases.includes(quizState.phase)) return false;
    }
    if (widget.hideOnPhase) {
      const phases = Array.isArray(widget.hideOnPhase) ? widget.hideOnPhase : [widget.hideOnPhase];
      if (phases.includes(quizState.phase)) return false;
    }
    return true;
  }, [quizState.phase]);

  // Get visible widgets
  const visibleWidgets = useMemo(() => {
    return widgets.filter(isWidgetVisible);
  }, [widgets, isWidgetVisible]);

  // Manage layout state internally
  const [layout, setLayout] = useState(() =>
    generateInitialLayout(visibleWidgets, savedLayout)
  );

  // Update layout when visible widgets change
  useEffect(() => {
    setLayout(generateInitialLayout(visibleWidgets, savedLayout));
  }, [visibleWidgets]); // Only regenerate when widgets change, NOT when savedLayout changes

  // Handle layout change - update internal state AND persist
  const handleLayoutChange = useCallback((newLayout) => {
    setLayout(newLayout);

    // Persist changes for non-quiz widgets
    newLayout.forEach(item => {
      if (item.i === 'quiz') return;

      onLayoutChange(item.i, {
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
      });
    });
  }, [onLayoutChange]);

  return (
    <div ref={containerRef} className="widget-layout">
      {mounted && (
        <ReactGridLayout
          className="layout"
          width={width}
          layout={layout}
          gridConfig={{
            cols: COLS,
            rowHeight: ROW_HEIGHT,
          }}
          dragConfig={{
            enabled: true,
            handle: '.widget-drag-handle',
          }}
          resizeConfig={{
            enabled: true,
          }}
          compactor={overlappingCompactor}
          onLayoutChange={handleLayoutChange}
        >
          {visibleWidgets.map(widget => {
            const registered = getWidget(widget.type);
            if (!registered) return null;

            const { component: Component } = registered;
            const isQuiz = widget.type === 'quiz';
            const isDraggable = !isQuiz && widget.draggable !== false;

            const widgetProps = {
              config: widget,
              quizState,
              ...(isQuiz && { children }),
            };

            return (
              <div
                key={widget.type}
                className={`widget-item ${isQuiz ? 'quiz-widget' : 'floating-widget'}`}
              >
                {isDraggable && (
                  <div className="widget-drag-handle">
                    <span className="drag-handle-icon" />
                  </div>
                )}
                <Component {...widgetProps} />
              </div>
            );
          })}
        </ReactGridLayout>
      )}
    </div>
  );
}
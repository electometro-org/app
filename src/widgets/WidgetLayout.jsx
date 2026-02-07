import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { Responsive, useContainerWidth, getCompactor } from 'react-grid-layout';
import { useWidgetContext } from './WidgetContext';
import { getWidget } from './registry';
import 'react-grid-layout/css/styles.css';
import './WidgetLayout.css';

// Import built-in types (registers them)
import './types';

// Grid configuration
const ROW_HEIGHT = 8;  // 8px rows for fine vertical control

// Breakpoints (min-width in pixels)
const BREAKPOINTS = {
  lg: 1200,  // Desktop
  md: 996,   // Tablet landscape
  sm: 768,   // Tablet portrait
  xs: 480,   // Mobile landscape
  xxs: 0,    // Mobile portrait
};

// Columns per breakpoint (fine grid, scaled by viewport)
const COLS = {
  lg: 96,
  md: 72,
  sm: 48,
  xs: 32,
  xxs: 24,
};

// Compactor with allowOverlap enabled, no compaction (null), no collision prevention
const overlappingCompactor = getCompactor(null, true, false);

// Default layouts per breakpoint
const DEFAULT_LAYOUTS = {
  lg: {
    'quiz': { x: 24, y: 0, w: 48, h: 63 },
    'progress-indicator': { x: 0, y: 0, w: 24, h: 6 },
    'countdown-timer': { x: 72, y: 0, w: 24, h: 12 },
    'social-share': { x: 24, y: 63, w: 48, h: 12 },
  },
  md: {
    'quiz': { x: 12, y: 0, w: 48, h: 63 },
    'progress-indicator': { x: 0, y: 0, w: 18, h: 6 },
    'countdown-timer': { x: 54, y: 0, w: 18, h: 12 },
    'social-share': { x: 12, y: 63, w: 48, h: 12 },
  },
  sm: {
    'quiz': { x: 4, y: 8, w: 40, h: 63 },
    'progress-indicator': { x: 0, y: 0, w: 48, h: 6 },
    'countdown-timer': { x: 36, y: 0, w: 12, h: 8 },
    'social-share': { x: 4, y: 71, w: 40, h: 10 },
  },
  xs: {
    'quiz': { x: 0, y: 8, w: 32, h: 63 },
    'progress-indicator': { x: 0, y: 0, w: 32, h: 6 },
    'countdown-timer': { x: 24, y: 0, w: 8, h: 6 },
    'social-share': { x: 0, y: 71, w: 32, h: 10 },
  },
  xxs: {
    'quiz': { x: 0, y: 8, w: 24, h: 75 },
    'progress-indicator': { x: 0, y: 0, w: 24, h: 6 },
    'countdown-timer': { x: 18, y: 0, w: 6, h: 6 },
    'social-share': { x: 0, y: 83, w: 24, h: 10 },
  },
};

/**
 * Generate layouts for all breakpoints
 */
function generateResponsiveLayouts(widgets, savedLayouts) {
  const layouts = {};

  Object.keys(BREAKPOINTS).forEach(breakpoint => {
    layouts[breakpoint] = widgets.map(widget => {
      const defaultPos = DEFAULT_LAYOUTS[breakpoint]?.[widget.type] || { x: 0, y: 0, w: 8, h: 8 };
      const saved = savedLayouts?.[breakpoint]?.[widget.type];

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
  });

  return layouts;
}

/**
 * WidgetLayout
 *
 * Responsive grid-based layout using react-grid-layout v2 API with allowOverlap.
 * Different layouts for different viewport sizes.
 */
export function WidgetLayout({ children }) {
  const {
    widgets,
    layout: savedLayouts,
    quizState,
    onLayoutChange,
  } = useWidgetContext();

  // v2 hook for container width measurement
  const { width, containerRef, mounted } = useContainerWidth();

  // Track current breakpoint
  const [currentBreakpoint, setCurrentBreakpoint] = useState('lg');

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

  // Manage layouts state for all breakpoints
  const [layouts, setLayouts] = useState(() =>
    generateResponsiveLayouts(visibleWidgets, savedLayouts)
  );

  // Ref to track ALL widget positions (including hidden ones)
  // This persists positions even when widgets are temporarily hidden
  const allWidgetPositionsRef = useRef({});

  // Initialize ref from savedLayouts on first render
  if (Object.keys(allWidgetPositionsRef.current).length === 0 && savedLayouts) {
    Object.keys(BREAKPOINTS).forEach(bp => {
      allWidgetPositionsRef.current[bp] = savedLayouts[bp] || {};
    });
  }

  // Track visible widget IDs to detect actual changes
  const visibleWidgetIds = useMemo(() =>
    visibleWidgets.map(w => w.type).sort().join(','),
    [visibleWidgets]
  );

  // Update layouts only when visible widgets actually change (not on every render)
  useEffect(() => {
    const newLayouts = {};
    const allPositions = allWidgetPositionsRef.current;

    Object.keys(BREAKPOINTS).forEach(breakpoint => {
      const breakpointPositions = allPositions[breakpoint] || {};

      // Generate new layout, preserving positions from ref
      newLayouts[breakpoint] = visibleWidgets.map(widget => {
        // First priority: use existing position from ref (includes hidden widgets)
        if (breakpointPositions[widget.type]) {
          return {
            ...breakpointPositions[widget.type],
            static: widget.draggable === false,
          };
        }

        // Second priority: use saved position from localStorage
        const saved = savedLayouts?.[breakpoint]?.[widget.type];
        if (saved) {
          return {
            i: widget.type,
            ...saved,
            minW: 1,
            minH: 1,
            static: widget.draggable === false,
          };
        }

        // Fallback: use default position
        const defaultPos = DEFAULT_LAYOUTS[breakpoint]?.[widget.type] || { x: 0, y: 0, w: 8, h: 8 };
        return {
          i: widget.type,
          ...defaultPos,
          minW: 1,
          minH: 1,
          static: widget.draggable === false,
        };
      });
    });

    setLayouts(newLayouts);
  }, [visibleWidgetIds]); // Only regenerate when widget IDs actually change

  // Handle breakpoint change
  const handleBreakpointChange = useCallback((newBreakpoint) => {
    setCurrentBreakpoint(newBreakpoint);
  }, []);

  // Track layout changes in ref - MERGE with existing positions (doesn't trigger re-render)
  const handleLayoutChange = useCallback((currentLayout, allLayouts) => {
    // Merge new positions with existing ones (preserves positions of hidden widgets)
    Object.keys(allLayouts).forEach(breakpoint => {
      if (!allWidgetPositionsRef.current[breakpoint]) {
        allWidgetPositionsRef.current[breakpoint] = {};
      }
      allLayouts[breakpoint].forEach(item => {
        allWidgetPositionsRef.current[breakpoint][item.i] = item;
      });
    });
  }, []);

  // Persist layout changes on drag/resize stop (not on every layout change)
  const handleDragStop = useCallback((layout, oldItem, newItem) => {
    if (newItem.i === 'quiz') return;
    onLayoutChange(newItem.i, {
      x: newItem.x,
      y: newItem.y,
      w: newItem.w,
      h: newItem.h,
      breakpoint: currentBreakpoint,
    });
  }, [onLayoutChange, currentBreakpoint]);

  const handleResizeStop = useCallback((layout, oldItem, newItem) => {
    if (newItem.i === 'quiz') return;
    onLayoutChange(newItem.i, {
      x: newItem.x,
      y: newItem.y,
      w: newItem.w,
      h: newItem.h,
      breakpoint: currentBreakpoint,
    });
  }, [onLayoutChange, currentBreakpoint]);

  return (
    <div ref={containerRef} className="widget-layout">
      {mounted && (
        <Responsive
          className="layout"
          width={width}
          layouts={layouts}
          breakpoints={BREAKPOINTS}
          cols={COLS}
          rowHeight={ROW_HEIGHT}
          compactor={overlappingCompactor}
          onBreakpointChange={handleBreakpointChange}
          onLayoutChange={handleLayoutChange}
          onDragStop={handleDragStop}
          onResizeStop={handleResizeStop}
          dragConfig={{
            enabled: true,
            handle: '.widget-drag-handle',
          }}
          resizeConfig={{
            enabled: true,
          }}
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
        </Responsive>
      )}
    </div>
  );
}
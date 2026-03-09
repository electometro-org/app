import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { Responsive, getCompactor } from 'react-grid-layout';
import { useWidgetContext } from './WidgetContext';
import { getWidget } from './registry';
import 'react-grid-layout/css/styles.css';
import './WidgetLayout.css';
import debug from '../debug';

// Import built-in types (registers them)
import './types';

// Debug mode: show grid coordinates on widgets
// Enabled via VITE_WIDGET_DEBUG=true or automatically in development
const DEBUG_MODE_AVAILABLE = import.meta.env.VITE_WIDGET_DEBUG === 'true' ||
  (import.meta.env.DEV && import.meta.env.VITE_WIDGET_DEBUG !== 'false');

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

function shouldUseLegacyLayoutMode() {
  if (typeof CSS === 'undefined' || typeof CSS.supports !== 'function') return false;
  // Align with existing legacy fallback strategy used in project CSS.
  const lacksGap = !CSS.supports('gap: 1rem');
  const lacksInset = !CSS.supports('inset: 0');
  return lacksGap || lacksInset;
}

function useSafeContainerWidth() {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return undefined;

    let rafId = 0;
    let resizeObserver = null;
    let pollId = null;

    const measure = () => {
      const el = containerRef.current;
      const measured = el?.clientWidth || el?.offsetWidth || 0;
      const fallback = typeof window !== 'undefined' ? window.innerWidth : 0;
      const next = measured || fallback;
      if (next > 0) {
        setWidth((prev) => (prev !== next ? next : prev));
      }
    };

    const scheduleMeasure = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(measure);
    };

    scheduleMeasure();
    window.addEventListener('resize', scheduleMeasure, { passive: true });
    window.addEventListener('orientationchange', scheduleMeasure, { passive: true });

    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      resizeObserver = new ResizeObserver(() => scheduleMeasure());
      resizeObserver.observe(containerRef.current);
    } else {
      // Safari 12 fallback when ResizeObserver is not available.
      pollId = setInterval(scheduleMeasure, 350);
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (pollId) clearInterval(pollId);
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', scheduleMeasure);
      window.removeEventListener('orientationchange', scheduleMeasure);
    };
  }, [mounted]);

  return { width, containerRef, mounted };
}

/**
 * Get unique key for a widget (supports multiple instances of same type)
 */
function getWidgetKey(widget) {
  return widget.id || widget.type;
}

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
 * Get layout for a widget at a specific breakpoint.
 * Priority: savedLayouts > widget.layouts > DEFAULT_LAYOUTS > fallback
 * Always ensures x, y, w, h are present by merging with defaults.
 */
function getWidgetLayout(widget, breakpoint, savedLayouts, useLegacyLayout = false, phase = null) {
  const widgetKey = getWidgetKey(widget);

  // Get base defaults (fallback chain: DEFAULT_LAYOUTS > config > absolute fallback)
  const absoluteFallback = { x: 0, y: 0, w: 8, h: 8 };
  // For DEFAULT_LAYOUTS, use widget.type (not id) since defaults are per-type
  const defaultLayout = DEFAULT_LAYOUTS[breakpoint]?.[widget.type] || absoluteFallback;
  const shouldUseLegacyForPhase = shouldUseLegacyForWidgetPhase(widget, useLegacyLayout, phase);

  const configLayout = shouldUseLegacyForPhase
    ? (widget.legacyLayouts?.[breakpoint] || widget.layouts?.[breakpoint])
    : widget.layouts?.[breakpoint];

  // Build base from defaults, then config override
  const base = { ...defaultLayout, ...configLayout };

  // User-saved position (from localStorage) takes highest priority
  // Use widgetKey for saved positions (allows multiple instances)
  const saved = savedLayouts?.[breakpoint]?.[widgetKey];
  if (saved && (saved.x !== undefined || saved.y !== undefined)) {
    const lockLegacySize = shouldUseLegacyForPhase && widget.keepLegacySize === true;
    const lockLegacyPosition = shouldUseLegacyForPhase && widget.keepLegacyPosition === true;
    if (lockLegacySize || lockLegacyPosition) {
      return {
        ...base,
        ...saved,
        x: lockLegacyPosition ? base.x : (saved.x ?? base.x),
        y: lockLegacyPosition ? base.y : (saved.y ?? base.y),
        w: lockLegacySize ? base.w : (saved.w ?? base.w),
        h: lockLegacySize ? base.h : (saved.h ?? base.h),
      };
    }
    // Merge saved with base to ensure w/h are always present
    return { ...base, ...saved };
  }

  return base;
}

function shouldUseLegacyForWidgetPhase(widget, useLegacyLayout, phase) {
  const phaseLimitedLegacy = Array.isArray(widget.legacyLayoutsOnPhases)
    ? widget.legacyLayoutsOnPhases
    : null;
  return useLegacyLayout && (!phaseLimitedLegacy || phaseLimitedLegacy.includes(phase));
}

/**
 * Generate layouts for all breakpoints
 */
function generateResponsiveLayouts(widgets, savedLayouts, useLegacyLayout = false, phase = null) {
  const layouts = {};

  Object.keys(BREAKPOINTS).forEach(breakpoint => {
    layouts[breakpoint] = widgets.map(widget => {
      const widgetKey = getWidgetKey(widget);
      const pos = getWidgetLayout(widget, breakpoint, savedLayouts, useLegacyLayout, phase);

      return {
        i: widgetKey,
        x: pos.x,
        y: pos.y,
        w: pos.w,
        h: pos.h,
        minW: 1,
        minH: 1,
        isDraggable: widget.draggable !== false,
        isResizable: widget.resizable === true,  // Default false
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
    // Widget deletion (debug mode)
    deletedWidgets,
    deleteWidget,
    restoreAllWidgets,
    // Widget visibility (debug mode)
    hiddenWidgets,
    toggleWidgetVisibility,
    showAllWidgets,
    // Docking system
    registerWidgetElement,
    unregisterWidgetElement,
    activeDocks,
    clearWidgetDock,
    getWidgetBoundsFromRef,
    onWidgetDragStart,
    onWidgetDrag,
    onWidgetDragEnd,
    updateAllBounds,
  } = useWidgetContext();

  // Safari-safe container width measurement (react-grid-layout breakpoints rely on this).
  const { width, containerRef, mounted } = useSafeContainerWidth();

  const useLegacyLayout = useMemo(() => {
    return shouldUseLegacyLayoutMode();
  }, []);

  // Track current breakpoint
  const [currentBreakpoint, setCurrentBreakpoint] = useState('lg');

  // Debug mode toggle (only available when DEBUG_MODE_AVAILABLE is true)
  const [debugMode, setDebugMode] = useState(DEBUG_MODE_AVAILABLE);

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
    generateResponsiveLayouts(visibleWidgets, savedLayouts, useLegacyLayout, quizState.phase)
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
    visibleWidgets.map(w => getWidgetKey(w)).sort().join(','),
    [visibleWidgets]
  );

  // Track previous visible widgets to detect when widgets become invisible
  const prevVisibleWidgetIdsRef = useRef(visibleWidgetIds);

  // Clear docks for widgets that became invisible (so animation replays when they return)
  useEffect(() => {
    const prevIds = prevVisibleWidgetIdsRef.current.split(',').filter(Boolean);
    const currentIds = visibleWidgetIds.split(',').filter(Boolean);

    // Find widgets that were visible but are no longer
    const hiddenWidgets = prevIds.filter(id => !currentIds.includes(id));

    // Clear their docks
    hiddenWidgets.forEach(widgetKey => {
      clearWidgetDock(widgetKey);
    });

    // Update ref for next comparison
    prevVisibleWidgetIdsRef.current = visibleWidgetIds;
  }, [visibleWidgetIds, clearWidgetDock]);

  // Update layouts only when visible widgets actually change (not on every render)
  useEffect(() => {
    const newLayouts = {};
    const allPositions = allWidgetPositionsRef.current;

    Object.keys(BREAKPOINTS).forEach(breakpoint => {
      const breakpointPositions = allPositions[breakpoint] || {};

      // Generate new layout, preserving positions from ref
      newLayouts[breakpoint] = visibleWidgets.map(widget => {
        const widgetKey = getWidgetKey(widget);

        // Always get base layout first (ensures w/h are present)
        const basePos = getWidgetLayout(widget, breakpoint, savedLayouts, useLegacyLayout, quizState.phase);

        // If we have a cached position in ref, merge it with base
        if (breakpointPositions[widgetKey]) {
          const shouldUseLegacyForPhase = shouldUseLegacyForWidgetPhase(widget, useLegacyLayout, quizState.phase);
          const lockLegacySize = shouldUseLegacyForPhase && widget.keepLegacySize === true;
          const lockLegacyPosition = shouldUseLegacyForPhase && widget.keepLegacyPosition === true;
          return {
            i: widgetKey,
            // Start with base (has guaranteed w/h), then overlay cached position
            x: lockLegacyPosition ? basePos.x : (breakpointPositions[widgetKey].x ?? basePos.x),
            y: lockLegacyPosition ? basePos.y : (breakpointPositions[widgetKey].y ?? basePos.y),
            w: lockLegacySize ? basePos.w : (breakpointPositions[widgetKey].w ?? basePos.w),
            h: lockLegacySize ? basePos.h : (breakpointPositions[widgetKey].h ?? basePos.h),
            minW: 1,
            minH: 1,
            isDraggable: widget.draggable !== false,
            isResizable: widget.resizable === true,
          };
        }

        // Use the priority chain: saved > config > default > fallback
        return {
          i: widgetKey,
          x: basePos.x,
          y: basePos.y,
          w: basePos.w,
          h: basePos.h,
          minW: 1,
          minH: 1,
          isDraggable: widget.draggable !== false,
          isResizable: widget.resizable === true,
        };
      });
    });

    setLayouts(newLayouts);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleWidgetIds, useLegacyLayout, quizState.phase]); // Only regenerate when widget IDs or phase change

  // Handle breakpoint change
  const handleBreakpointChange = useCallback((newBreakpoint) => {
    setCurrentBreakpoint(newBreakpoint);
  }, []);

  // Track current layout for debug overlay
  const [debugLayout, setDebugLayout] = useState({});

  // Update debug layout when layouts or breakpoint changes
  useEffect(() => {
    if (debugMode && layouts[currentBreakpoint]) {
      const layoutMap = {};
      layouts[currentBreakpoint].forEach(item => {
        layoutMap[item.i] = { x: item.x, y: item.y, w: item.w, h: item.h };
      });
      setDebugLayout(layoutMap);
    }
  }, [layouts, currentBreakpoint, debugMode]);

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

    // Update debug layout for current breakpoint
    if (debugMode) {
      const layoutMap = {};
      currentLayout.forEach(item => {
        layoutMap[item.i] = { x: item.x, y: item.y, w: item.w, h: item.h };
      });
      setDebugLayout(layoutMap);
    }
  }, [debugMode]);

  // Handle drag start - notify docking system
  const handleDragStart = useCallback((layout, oldItem, newItem) => {
    debug.log('[WidgetLayout] handleDragStart called:', newItem.i);
    if (newItem.i === 'quiz') return;
    onWidgetDragStart(newItem.i);
  }, [onWidgetDragStart]);

  // Handle drag - update docking detection
  const handleDrag = useCallback((layout, oldItem, newItem) => {
    if (newItem.i === 'quiz') return;

    // Try ref first, fallback to DOM query
    let rect = getWidgetBoundsFromRef(newItem.i);

    if (!rect) {
      // Fallback: find the widget by data attribute, then get its parent grid item
      const widgetEl = document.querySelector(`[data-widget-key="${newItem.i}"]`);
      if (widgetEl) {
        // The parent should be the react-grid-item
        const gridItem = widgetEl.closest('.react-grid-item');
        if (gridItem) {
          rect = gridItem.getBoundingClientRect();
          debug.log('[WidgetLayout] Got rect from DOM query');
        }
      }
    }

    debug.log('[WidgetLayout] handleDrag called:', newItem.i, rect ? 'got rect' : 'NO RECT');
    if (rect) {
      onWidgetDrag(newItem.i, rect);
    }
  }, [onWidgetDrag, getWidgetBoundsFromRef]);

  // Persist layout changes on drag/resize stop (not on every layout change)
  const handleDragStop = useCallback((layout, oldItem, newItem) => {
    if (newItem.i === 'quiz') return;

    // Check if widget was docked
    const dockInfo = onWidgetDragEnd(newItem.i);

    // Save position (whether docked or not)
    onLayoutChange(newItem.i, {
      x: newItem.x,
      y: newItem.y,
      w: newItem.w,
      h: newItem.h,
      breakpoint: currentBreakpoint,
      // Store dock info if docked
      ...(dockInfo && { dockedTo: dockInfo.zoneId }),
    });

    // Update bounds after drag ends
    requestAnimationFrame(updateAllBounds);
  }, [onLayoutChange, currentBreakpoint, onWidgetDragEnd, updateAllBounds]);

  const handleResizeStop = useCallback((layout, oldItem, newItem) => {
    if (newItem.i === 'quiz') return;
    onLayoutChange(newItem.i, {
      x: newItem.x,
      y: newItem.y,
      w: newItem.w,
      h: newItem.h,
      breakpoint: currentBreakpoint,
    });
    // Update bounds after resize
    requestAnimationFrame(updateAllBounds);
  }, [onLayoutChange, currentBreakpoint, updateAllBounds]);

  // Register widget elements after render using DOM query
  // (refs don't work reliably because react-grid-layout clones children)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Use requestAnimationFrame to ensure DOM is fully rendered
    // Then retry after a short delay to handle zones registering after widgets
    const registerWidgets = () => {
      const widgetElements = container.querySelectorAll('[data-widget-key]');
      debug.log('[WidgetLayout] Found widget elements in DOM:', widgetElements.length);

      widgetElements.forEach(element => {
        const widgetKey = element.getAttribute('data-widget-key');
        if (widgetKey) {
          debug.log('[WidgetLayout] Registering widget from DOM:', widgetKey);
          registerWidgetElement(widgetKey, element);
        }
      });
    };

    // Initial registration after DOM updates
    const rafId = requestAnimationFrame(() => {
      registerWidgets();
    });

    // Retry after a short delay to catch cases where zones register after widgets
    const retryTimeout = setTimeout(() => {
      registerWidgets();
    }, 100);

    // Cleanup: unregister widgets that are no longer visible
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(retryTimeout);
      visibleWidgets.forEach(widget => {
        const widgetKey = getWidgetKey(widget);
        unregisterWidgetElement(widgetKey);
      });
    };
  }, [visibleWidgets, registerWidgetElement, unregisterWidgetElement]);

  return (
    <div ref={containerRef} className="widget-layout" data-widget-debug={debugMode || undefined} data-phase={quizState.phase}>
      {/* Debug mode toggle button */}
      {DEBUG_MODE_AVAILABLE && (
        <div className="debug-buttons">
          <button
            className="debug-toggle-button"
            onClick={() => setDebugMode(prev => !prev)}
            title={debugMode ? 'Disable debug mode' : 'Enable debug mode'}
          >
            {debugMode ? '🔧' : '👁️'}
          </button>
          {debugMode && deletedWidgets.size > 0 && (
            <button
              className="debug-restore-button"
              onClick={restoreAllWidgets}
              title={`Restore ${deletedWidgets.size} deleted widget(s)`}
            >
              ↩ {deletedWidgets.size}
            </button>
          )}
          {debugMode && hiddenWidgets.size > 0 && (
            <button
              className="debug-show-button"
              onClick={showAllWidgets}
              title={`Show ${hiddenWidgets.size} hidden widget(s)`}
            >
              👁️ {hiddenWidgets.size}
            </button>
          )}
        </div>
      )}
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
          onDragStart={handleDragStart}
          onDrag={handleDrag}
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

            const widgetKey = getWidgetKey(widget);
            const { component: Component } = registered;
            const isQuiz = widget.type === 'quiz';
            const isDraggable = !isQuiz && widget.draggable !== false;
            const isDocked = !!activeDocks[widgetKey];
            const dockInfo = activeDocks[widgetKey];

            const widgetProps = {
              config: widget,
              quizState,
              ...(isQuiz && { children }),
            };

            const debugInfo = debugMode && debugLayout[widgetKey];

            // Get widget transition settings
            const widgetTransition = dockInfo?.transition?.widget || widget.dockTransition?.widget;
            const widgetTransitionStyle = widgetTransition ? {
              '--dock-widget-duration': `${widgetTransition.duration || 300}ms`,
              '--dock-widget-easing': widgetTransition.easing || 'ease-out',
            } : {};

            // Check if widget is waiting to dock (has dockedTo config but not yet docked)
            const isPendingDock = !isDocked && widget.dockedTo && widgetTransition?.effect;

            // Check if widget is hidden (debug mode visibility toggle)
            const isHidden = hiddenWidgets.has(widgetKey);

            return (
              <div
                key={widgetKey}
                className={`widget-item ${isQuiz ? 'quiz-widget' : 'floating-widget'} ${isDocked ? 'widget-item--docked' : ''} ${isPendingDock ? 'widget-item--pending-dock' : ''} ${isHidden ? 'widget-item--hidden' : ''}`}
                data-widget-key={widgetKey}
                data-docked-to={dockInfo?.zoneId || undefined}
                data-dock-effect={isDocked && widgetTransition?.effect ? widgetTransition.effect : undefined}
                style={widgetTransitionStyle}
              >
                {isDraggable && (
                  <div className="widget-drag-handle">
                    <span className="drag-handle-icon" />
                  </div>
                )}
                <Component {...widgetProps} />
                {debugInfo && (
                  <div className="widget-debug-overlay">
                    <span className="widget-debug-id">{widgetKey}</span>
                    <span className="widget-debug-coords">
                      x:{debugInfo.x} y:{debugInfo.y} w:{debugInfo.w} h:{debugInfo.h}
                    </span>
                    <span className="widget-debug-breakpoint">{currentBreakpoint}</span>
                    {isDocked && <span className="widget-debug-docked">DOCKED: {dockInfo.zoneId}</span>}
                    {!isQuiz && (
                      <>
                        <button
                          className="widget-debug-visibility"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWidgetVisibility(widgetKey);
                          }}
                          title={isHidden ? 'Show widget' : 'Hide widget'}
                        >
                          {isHidden ? '👁️' : '🙈'}
                        </button>
                        <button
                          className="widget-debug-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteWidget(widgetKey);
                          }}
                          title="Delete widget (persists until page config changes)"
                        >
                          ✕
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </Responsive>
      )}
    </div>
  );
}

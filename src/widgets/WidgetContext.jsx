import React, { createContext, useContext, useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { useQuizContext } from '../contexts/useQuizContext';
import { useLayoutPersistence } from './useLayoutPersistence';
import { getWidget } from './registry';

const WidgetContext = createContext(null);

/**
 * Predefined docking zones where widgets can attach
 */
const DOCKING_ZONES = [
  'above-question',  // Before question text
  'below-question',  // Between question and buttons
  'above-buttons',   // Just before answer buttons
  'below-buttons',   // After answer buttons
];

// Default slot for each widget type
const DEFAULT_SLOTS = {
  'quiz': 'center',
  'progress-indicator': 'top',
  'countdown-timer': 'top',
  'social-share': 'bottom',
};

// Valid slots (top, bottom, left, right of quiz)
const VALID_SLOTS = ['top', 'bottom', 'left', 'right'];

/**
 * Determine current quiz phase
 */
function getQuizPhase(state, showGenericIntro, showElectionIntro, showTopicImportance, showDemographics, turnstileVerified) {
  if (showGenericIntro) return 'intro';
  if (showElectionIntro) return 'election-intro';
  if (!state.questions || state.questions.length === 0) return 'loading';
  if (state.currentQuestionIndex < state.questions.length) return 'quiz';
  if (showTopicImportance) return 'topic-importance';
  if (showDemographics && !turnstileVerified) return 'demographics';
  if (state.comparisonResults) return 'results';
  return 'loading';
}

/**
 * WidgetProvider
 *
 * Provides widget configuration and layout state to all widgets.
 */
export function WidgetProvider({ children }) {
  const quizContext = useQuizContext();
  const {
    config,
    state,
    election,
    showGenericIntro,
    showElectionIntro,
    showTopicImportance,
    showDemographics,
    turnstileVerified,
    displayIndex,
    totalQuestions,
  } = quizContext;

  // ============ DOCKING SYSTEM ============
  // Registry of docking zones (quiz elements that can receive widgets)
  const dockingZonesRef = useRef(new Map()); // Map<zoneId, HTMLElement>
  const [zoneBounds, setZoneBounds] = useState({}); // { zoneId: DOMRect }

  // Registry of widget elements for position tracking
  const widgetElementsRef = useRef(new Map()); // Map<widgetKey, HTMLElement>
  const [widgetBounds, setWidgetBounds] = useState({}); // { widgetKey: DOMRect }

  // Active docks: which widgets are docked to which zones
  // { widgetKey: { zoneId, placeholder: { width, height } } }
  const [activeDocks, setActiveDocks] = useState({});

  // Pending docks from config - waiting for both zone and widget to be ready
  // { widgetKey: zoneId }
  const pendingDocksRef = useRef({});

  // Widget currently being dragged
  const [draggingWidget, setDraggingWidget] = useState(null);

  // Gauge preview state (for OpinionButtons hover coordination)
  // { value: number, color: string, isPointerTingling: boolean, isColorCycling: boolean }
  const [gaugePreview, setGaugePreview] = useState(null);

  // Shared pulse opacity for synchronized pulsing (0.3 to 1)
  const [pulseOpacity, setPulseOpacity] = useState(1);
  const pulseIntervalRef = useRef(null);
  const pulseStartTimeRef = useRef(null);

  // Run pulse animation when gaugePreview is active (using interval for efficiency)
  useEffect(() => {
    if (gaugePreview) {
      // Use a shared start time so all elements stay in sync
      if (!pulseStartTimeRef.current) {
        pulseStartTimeRef.current = performance.now();
      }
      const duration = 1000; // 1 second cycle
      const updateRate = 50; // Update every 50ms (20fps) - smooth enough, CPU-friendly

      const updateOpacity = () => {
        const elapsed = performance.now() - pulseStartTimeRef.current;
        const phase = (elapsed % duration) / duration;
        // Ease in-out sine wave: 0.3 to 1 and back
        const opacity = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(phase * 2 * Math.PI - Math.PI / 2));
        setPulseOpacity(opacity);
      };

      updateOpacity(); // Initial update
      pulseIntervalRef.current = setInterval(updateOpacity, updateRate);

      return () => {
        if (pulseIntervalRef.current) {
          clearInterval(pulseIntervalRef.current);
        }
        setPulseOpacity(1);
      };
    } else {
      // Reset start time when not hovering so next hover starts fresh
      pulseStartTimeRef.current = null;
    }
  }, [gaugePreview]);

  // Register a docking zone
  const registerDockingZone = useCallback((zoneId, element) => {
    if (element && DOCKING_ZONES.includes(zoneId)) {
      dockingZonesRef.current.set(zoneId, element);
      const bounds = element.getBoundingClientRect();
      console.log('[Docking] Zone registered:', zoneId, bounds);
      setZoneBounds(prev => ({ ...prev, [zoneId]: bounds }));

      // Check if any pending docks are waiting for this zone
      Object.entries(pendingDocksRef.current).forEach(([widgetKey, pendingDock]) => {
        // Support both old string format and new object format
        const pendingZoneId = pendingDock?.zoneId || pendingDock;
        if (pendingZoneId === zoneId) {
          // Check if widget is also registered
          const widgetElement = widgetElementsRef.current.get(widgetKey);
          if (widgetElement) {
            const widgetBounds = widgetElement.getBoundingClientRect();
            console.log('[Docking] Activating pending dock:', widgetKey, '->', zoneId);
            const transition = pendingDock?.transition || { duration: 300, easing: 'ease-out' };
            setActiveDocks(prev => ({
              ...prev,
              [widgetKey]: {
                zoneId,
                placeholder: {
                  width: widgetBounds.width,
                  height: widgetBounds.height,
                },
                transition,
                fromConfig: true,
              },
            }));
            delete pendingDocksRef.current[widgetKey];
          }
        }
      });
    }
  }, []);

  // Unregister a docking zone
  const unregisterDockingZone = useCallback((zoneId) => {
    console.log('[Docking] Zone UNregistered:', zoneId);
    dockingZonesRef.current.delete(zoneId);
    setZoneBounds(prev => {
      const next = { ...prev };
      delete next[zoneId];
      return next;
    });
  }, []);

  // Register a widget element for tracking
  const registerWidgetElement = useCallback((widgetKey, element) => {
    if (element) {
      widgetElementsRef.current.set(widgetKey, element);
      const bounds = element.getBoundingClientRect();
      console.log('[Docking] Widget registered:', widgetKey, bounds);
      setWidgetBounds(prev => ({ ...prev, [widgetKey]: bounds }));

      // Check if this widget has a pending dock
      const pendingDock = pendingDocksRef.current[widgetKey];
      const pendingZoneId = pendingDock?.zoneId || pendingDock; // Support both old string and new object format
      console.log('[Docking] Checking pending dock for', widgetKey, ':', pendingZoneId);
      console.log('[Docking] Available zones:', Array.from(dockingZonesRef.current.keys()));

      if (pendingZoneId) {
        // Check if zone is registered
        const zoneElement = dockingZonesRef.current.get(pendingZoneId);
        console.log('[Docking] Zone element for', pendingZoneId, ':', !!zoneElement);
        if (zoneElement) {
          console.log('[Docking] Activating pending dock:', widgetKey, '->', pendingZoneId);
          const transition = pendingDock?.transition || { duration: 300, easing: 'ease-out' };
          setActiveDocks(prev => ({
            ...prev,
            [widgetKey]: {
              zoneId: pendingZoneId,
              placeholder: {
                width: bounds.width,
                height: bounds.height,
              },
              transition,
              fromConfig: true,
            },
          }));
          delete pendingDocksRef.current[widgetKey];
        } else {
          console.log('[Docking] Zone not ready yet, keeping pending dock');
        }
      }

      // If widget is already docked, update placeholder size with actual dimensions
      setActiveDocks(prev => {
        if (prev[widgetKey] && prev[widgetKey].fromConfig) {
          return {
            ...prev,
            [widgetKey]: {
              ...prev[widgetKey],
              placeholder: {
                width: bounds.width,
                height: bounds.height,
              },
            },
          };
        }
        return prev;
      });
    }
  }, []);

  // Unregister a widget element
  const unregisterWidgetElement = useCallback((widgetKey) => {
    widgetElementsRef.current.delete(widgetKey);
    setWidgetBounds(prev => {
      const next = { ...prev };
      delete next[widgetKey];
      return next;
    });
  }, []);

  // Check if widget's center is within zone's vertical bounds
  // This works better for tall widgets docking to short zones
  const isWidgetCenterInZone = useCallback((widgetRect, zoneRect) => {
    if (!widgetRect || !zoneRect) return false;

    // Widget's vertical center
    const widgetCenterY = widgetRect.top + widgetRect.height / 2;

    // Check if widget center is within zone's vertical bounds (with some tolerance)
    const tolerance = 20; // pixels
    const inVerticalRange = widgetCenterY >= zoneRect.top - tolerance &&
                            widgetCenterY <= zoneRect.bottom + tolerance;

    // Also check horizontal overlap (widget should be over the zone horizontally)
    const horizontalOverlap = widgetRect.right > zoneRect.left &&
                              widgetRect.left < zoneRect.right;

    return inVerticalRange && horizontalOverlap;
  }, []);

  // Update all bounds (call on resize/scroll)
  const updateAllBounds = useCallback(() => {
    // Update zone bounds
    const newZoneBounds = {};
    dockingZonesRef.current.forEach((element, zoneId) => {
      if (element) {
        newZoneBounds[zoneId] = element.getBoundingClientRect();
      }
    });
    setZoneBounds(newZoneBounds);

    // Update widget bounds
    const newWidgetBounds = {};
    widgetElementsRef.current.forEach((element, widgetKey) => {
      if (element) {
        newWidgetBounds[widgetKey] = element.getBoundingClientRect();
      }
    });
    setWidgetBounds(newWidgetBounds);
  }, []);

  // Get current bounds for a widget from the ref (for use during drag)
  const getWidgetBoundsFromRef = useCallback((widgetKey) => {
    const element = widgetElementsRef.current.get(widgetKey);
    console.log('[Docking] getWidgetBoundsFromRef:', widgetKey, 'element:', element ? 'FOUND' : 'NOT FOUND');
    console.log('[Docking] widgetElementsRef has:', Array.from(widgetElementsRef.current.keys()));
    if (element) {
      return element.getBoundingClientRect();
    }
    return null;
  }, []);

  // Check docking for a specific widget (uses refs directly to avoid stale state)
  const checkDocking = useCallback((widgetKey, widgetRect) => {
    if (!widgetRect) {
      console.log('[Docking] checkDocking: no widgetRect');
      return null;
    }

    // Get fresh zone bounds from refs
    const freshZoneBounds = {};
    dockingZonesRef.current.forEach((element, zoneId) => {
      if (element) {
        freshZoneBounds[zoneId] = element.getBoundingClientRect();
      }
    });

    console.log('[Docking] checkDocking for', widgetKey);
    console.log('[Docking] Widget rect:', { top: widgetRect.top, left: widgetRect.left, width: widgetRect.width, height: widgetRect.height });
    console.log('[Docking] Available zones (from ref):', Object.keys(freshZoneBounds));

    // Find the first zone where widget's center is within the zone
    let bestMatch = null;
    let bestDistance = Infinity;

    Object.entries(freshZoneBounds).forEach(([zoneId, zoneRect]) => {
      const isInZone = isWidgetCenterInZone(widgetRect, zoneRect);
      // Calculate distance from widget center to zone center for tie-breaking
      const widgetCenterY = widgetRect.top + widgetRect.height / 2;
      const zoneCenterY = zoneRect.top + zoneRect.height / 2;
      const distance = Math.abs(widgetCenterY - zoneCenterY);

      console.log('[Docking] Zone', zoneId, 'inZone:', isInZone, 'distance:', distance.toFixed(0) + 'px');

      if (isInZone && distance < bestDistance) {
        bestDistance = distance;
        bestMatch = {
          zoneId,
          placeholder: {
            width: widgetRect.width,
            height: widgetRect.height,
          },
        };
      }
    });

    return bestMatch;
  }, [isWidgetCenterInZone]);

  // Update docking state for a widget during drag
  const updateWidgetDocking = useCallback((widgetKey, widgetRect) => {
    const dockInfo = checkDocking(widgetKey, widgetRect);

    setActiveDocks(prev => {
      if (dockInfo) {
        // Widget is docked
        return { ...prev, [widgetKey]: dockInfo };
      } else {
        // Widget is not docked - remove from active docks
        if (prev[widgetKey]) {
          const next = { ...prev };
          delete next[widgetKey];
          return next;
        }
        return prev;
      }
    });

    return dockInfo;
  }, [checkDocking]);

  // Handle drag start
  const onWidgetDragStart = useCallback((widgetKey) => {
    console.log('[Docking] Drag START:', widgetKey);
    // Get fresh zone bounds from ref instead of state (avoids stale closure)
    const freshZoneBounds = {};
    dockingZonesRef.current.forEach((element, zoneId) => {
      if (element) {
        freshZoneBounds[zoneId] = element.getBoundingClientRect();
      }
    });
    console.log('[Docking] Fresh zone bounds:', Object.keys(freshZoneBounds));
    setZoneBounds(freshZoneBounds);
    setDraggingWidget(widgetKey);
  }, []);

  // Handle drag (called continuously during drag)
  const onWidgetDrag = useCallback((widgetKey, widgetRect) => {
    console.log('[Docking] Drag MOVE:', widgetKey, widgetRect ? 'has rect' : 'NO RECT');
    // Update widget bounds for zone highlighting
    if (widgetRect) {
      setWidgetBounds(prev => ({ ...prev, [widgetKey]: widgetRect }));
    }
    // Check docking
    const dockResult = updateWidgetDocking(widgetKey, widgetRect);
    if (dockResult) {
      console.log('[Docking] DOCK DETECTED:', dockResult.zoneId);
    }
  }, [updateWidgetDocking]);

  // Handle drag end - returns dock info if snapped
  const onWidgetDragEnd = useCallback((widgetKey) => {
    console.log('[Docking] Drag END:', widgetKey);
    setDraggingWidget(null);
    const dockInfo = activeDocks[widgetKey];
    console.log('[Docking] Final dock info:', dockInfo);
    return dockInfo;
  }, [activeDocks]);

  // Update bounds on resize
  useEffect(() => {
    const handleResize = () => {
      requestAnimationFrame(updateAllBounds);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateAllBounds]);

  // ============ END DOCKING SYSTEM ============

  // Build default layout from widget configs
  const defaultLayout = useMemo(() => {
    const widgets = config?.widgets || [];
    const layout = {};

    // Start with defaults
    Object.entries(DEFAULT_SLOTS).forEach(([type, slot]) => {
      layout[type] = { slot };
    });

    // Override with widget-specific defaults
    widgets.forEach(widget => {
      if (widget.defaultSlot && VALID_SLOTS.includes(widget.defaultSlot)) {
        layout[widget.type] = { slot: widget.defaultSlot };
      }
    });

    return layout;
  }, [config?.widgets]);

  // Layout persistence per-election
  const { layout, setLayout, resetLayout } = useLayoutPersistence(election, defaultLayout);

  // Deleted widgets persistence (debug mode feature)
  const deletedStorageKey = election ? `electometro-deleted-widgets-${election}` : null;

  const [deletedWidgets, setDeletedWidgets] = useState(() => {
    if (!deletedStorageKey) return new Set();
    try {
      const saved = localStorage.getItem(deletedStorageKey);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Persist deleted widgets to localStorage
  useEffect(() => {
    if (!deletedStorageKey) return;
    try {
      localStorage.setItem(deletedStorageKey, JSON.stringify([...deletedWidgets]));
    } catch (e) {
      console.warn('Failed to save deleted widgets:', e);
    }
  }, [deletedStorageKey, deletedWidgets]);

  // Delete a widget (debug mode only)
  const deleteWidget = useCallback((widgetKey) => {
    setDeletedWidgets(prev => new Set([...prev, widgetKey]));
  }, []);

  // Restore a deleted widget
  const restoreWidget = useCallback((widgetKey) => {
    setDeletedWidgets(prev => {
      const next = new Set(prev);
      next.delete(widgetKey);
      return next;
    });
  }, []);

  // Restore all deleted widgets
  const restoreAllWidgets = useCallback(() => {
    setDeletedWidgets(new Set());
  }, []);

  // Hidden widgets persistence (debug mode feature - visibility toggle)
  const hiddenStorageKey = election ? `electometro-hidden-widgets-${election}` : null;

  const [hiddenWidgets, setHiddenWidgets] = useState(() => {
    if (!hiddenStorageKey) return new Set();
    try {
      const saved = localStorage.getItem(hiddenStorageKey);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Persist hidden widgets to localStorage
  useEffect(() => {
    if (!hiddenStorageKey) return;
    try {
      localStorage.setItem(hiddenStorageKey, JSON.stringify([...hiddenWidgets]));
    } catch (e) {
      console.warn('Failed to save hidden widgets:', e);
    }
  }, [hiddenStorageKey, hiddenWidgets]);

  // Toggle widget visibility (debug mode only)
  const toggleWidgetVisibility = useCallback((widgetKey) => {
    setHiddenWidgets(prev => {
      const next = new Set(prev);
      if (next.has(widgetKey)) {
        next.delete(widgetKey);
      } else {
        next.add(widgetKey);
      }
      return next;
    });
  }, []);

  // Show all hidden widgets
  const showAllWidgets = useCallback(() => {
    setHiddenWidgets(new Set());
  }, []);

  // Build quiz state slice for widgets
  const quizState = useMemo(() => ({
    currentQuestionIndex: state.currentQuestionIndex,
    totalQuestions: state.questions?.length || totalQuestions || 0,
    displayIndex: displayIndex || state.currentQuestionIndex + 1,
    phase: getQuizPhase(state, showGenericIntro, showElectionIntro, showTopicImportance, showDemographics, turnstileVerified),
    election,
    answers: state.answers,
    weights: state.weights,
    questions: state.questions,
    seenQuestions: state.seenQuestions || [],
  }), [
    state.currentQuestionIndex,
    state.questions,
    state.answers,
    state.weights,
    state.seenQuestions,
    totalQuestions,
    displayIndex,
    showGenericIntro,
    showElectionIntro,
    showTopicImportance,
    showDemographics,
    turnstileVerified,
    election,
  ]);

  // Get widgets from config with defaults (excluding deleted ones)
  const widgets = useMemo(() => {
    const configWidgets = config?.widgets || [];

    // If no widgets configured, return default quiz widget only
    if (configWidgets.length === 0) {
      return [{
        type: 'quiz',
        draggable: false,
        defaultSlot: 'center',
      }];
    }

    return configWidgets
      .map(widget => {
        const registered = getWidget(widget.type);
        return {
          ...registered?.defaults,
          ...widget,
        };
      })
      .filter(widget => {
        const widgetKey = widget.id || widget.type;
        // Never delete the quiz widget
        if (widget.type === 'quiz') return true;
        return !deletedWidgets.has(widgetKey);
      });
  }, [config?.widgets, deletedWidgets]);

  // Initialize pending docks from widget configs OR saved layouts
  useEffect(() => {
    console.log('[Docking] useEffect running, widgets:', widgets.map(w => ({ key: w.id || w.type, dockedTo: w.dockedTo })));
    console.log('[Docking] Saved layout:', layout);
    console.log('[Docking] Current zones:', Array.from(dockingZonesRef.current.keys()));
    console.log('[Docking] Current widget elements:', Array.from(widgetElementsRef.current.keys()));
    console.log('[Docking] Current activeDocks:', Object.keys(activeDocks));

    widgets.forEach(widget => {
      const widgetKey = widget.id || widget.type;

      // Check for dockedTo in saved layout first (user's drag-drop), then fall back to config
      let zoneId = null;

      // Check all breakpoints in saved layout for this widget's dockedTo
      if (layout) {
        Object.values(layout).forEach(breakpointLayout => {
          if (breakpointLayout?.[widgetKey]?.dockedTo) {
            zoneId = breakpointLayout[widgetKey].dockedTo;
          }
        });
      }

      // Fall back to widget config
      if (!zoneId && widget.dockedTo) {
        zoneId = widget.dockedTo;
      }

      if (zoneId && DOCKING_ZONES.includes(zoneId)) {
        // Skip if already docked
        if (activeDocks[widgetKey]) {
          console.log('[Docking] Skipping', widgetKey, '- already docked');
          return;
        }

        const zoneElement = dockingZonesRef.current.get(zoneId);
        const widgetElement = widgetElementsRef.current.get(widgetKey);

        console.log('[Docking] Checking', widgetKey, '-> zone:', zoneId, 'zoneEl:', !!zoneElement, 'widgetEl:', !!widgetElement);

        // Get transition config from widget
        const dockTransition = widget.dockTransition || {};

        // If both zone and widget are already registered, activate immediately
        if (zoneElement && widgetElement) {
          const widgetBounds = widgetElement.getBoundingClientRect();
          console.log('[Docking] Activating dock (both ready):', widgetKey, '->', zoneId, widgetBounds);
          setActiveDocks(prev => ({
            ...prev,
            [widgetKey]: {
              zoneId,
              placeholder: {
                width: widgetBounds.width,
                height: widgetBounds.height,
              },
              transition: {
                duration: dockTransition.duration ?? 300,
                easing: dockTransition.easing ?? 'ease-out',
                widget: dockTransition.widget || null,
              },
              fromConfig: true,
            },
          }));
        } else if (!pendingDocksRef.current[widgetKey]) {
          // Otherwise store as pending (include transition config)
          pendingDocksRef.current[widgetKey] = {
            zoneId,
            transition: {
              duration: dockTransition.duration ?? 300,
              easing: dockTransition.easing ?? 'ease-out',
              widget: dockTransition.widget || null,
            },
          };
          console.log('[Docking] Stored as pending:', widgetKey, '->', zoneId);
        }
      }
    });
  }, [widgets, layout, activeDocks]);

  // Handle layout changes from grid (supports both slot-based and x/y/w/h)
  const onLayoutChange = useCallback((widgetType, layoutData) => {
    setLayout(widgetType, layoutData);
  }, [setLayout]);

  // Clear dock for a widget (used when widget becomes invisible)
  const clearWidgetDock = useCallback((widgetKey) => {
    setActiveDocks(prev => {
      if (prev[widgetKey]) {
        const next = { ...prev };
        delete next[widgetKey];
        return next;
      }
      return prev;
    });
  }, []);

  const value = useMemo(() => ({
    widgets,
    layout,
    quizState,
    onLayoutChange,
    resetLayout,
    VALID_SLOTS,
    // Widget deletion (debug mode)
    deletedWidgets,
    deleteWidget,
    restoreWidget,
    restoreAllWidgets,
    // Widget visibility (debug mode)
    hiddenWidgets,
    toggleWidgetVisibility,
    showAllWidgets,
    // Docking system
    DOCKING_ZONES,
    registerDockingZone,
    unregisterDockingZone,
    registerWidgetElement,
    unregisterWidgetElement,
    activeDocks,
    clearWidgetDock,
    draggingWidget,
    zoneBounds,
    widgetBounds,
    getWidgetBoundsFromRef,
    onWidgetDragStart,
    onWidgetDrag,
    onWidgetDragEnd,
    updateAllBounds,
    // Gauge preview (for OpinionButtons coordination)
    gaugePreview,
    setGaugePreview,
    pulseOpacity,
  }), [
    widgets,
    layout,
    quizState,
    onLayoutChange,
    resetLayout,
    deletedWidgets,
    deleteWidget,
    restoreWidget,
    restoreAllWidgets,
    hiddenWidgets,
    toggleWidgetVisibility,
    showAllWidgets,
    registerDockingZone,
    unregisterDockingZone,
    registerWidgetElement,
    unregisterWidgetElement,
    activeDocks,
    clearWidgetDock,
    draggingWidget,
    zoneBounds,
    widgetBounds,
    getWidgetBoundsFromRef,
    onWidgetDragStart,
    onWidgetDrag,
    onWidgetDragEnd,
    updateAllBounds,
    gaugePreview,
    setGaugePreview,
    pulseOpacity,
  ]);

  return (
    <WidgetContext.Provider value={value}>
      {children}
    </WidgetContext.Provider>
  );
}

/**
 * Hook to access widget context
 */
export function useWidgetContext() {
  const context = useContext(WidgetContext);
  if (!context) {
    throw new Error('useWidgetContext must be used within a WidgetProvider');
  }
  return context;
}

export { WidgetContext };
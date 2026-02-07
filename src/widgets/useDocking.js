import { useEffect, useRef, useCallback } from 'react';
import { useWidgetContext } from './WidgetContext';

/**
 * useDockingZone
 *
 * Hook for quiz elements to register as docking zones where widgets can attach.
 *
 * Usage:
 * ```jsx
 * function QuestionArea() {
 *   const { zoneRef, dockedWidget, placeholderStyle } = useDockingZone('below-question');
 *
 *   return (
 *     <div ref={zoneRef} className="question-area">
 *       <p>Question text...</p>
 *       {dockedWidget && (
 *         <div className="dock-placeholder" style={placeholderStyle} />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 *
 * @param {string} zoneId - One of: 'above-question', 'below-question', 'above-buttons', 'below-buttons'
 * @returns {{ zoneRef: RefCallback, dockedWidget: string|null, placeholderStyle: object|null, isHighlighted: boolean }}
 */
export function useDockingZone(zoneId) {
  const {
    registerDockingZone,
    unregisterDockingZone,
    activeDocks,
    draggingWidget,
    zoneBounds,
    widgetBounds,
  } = useWidgetContext();

  const elementRef = useRef(null);

  // Register zone when element is available
  // Note: We use useEffect instead of ref callback because React Strict Mode
  // can cause ref callbacks to not fire on remount
  useEffect(() => {
    const element = elementRef.current;
    if (element) {
      console.log('[useDockingZone] useEffect registering', zoneId);
      registerDockingZone(zoneId, element);
    }
    return () => {
      console.log('[useDockingZone] useEffect cleanup for', zoneId);
      // Don't unregister here - let the ref callback handle it
    };
  }, [zoneId, registerDockingZone]);

  // Ref callback to capture the element
  const zoneRef = useCallback((element) => {
    console.log('[useDockingZone] Ref callback for', zoneId, element ? 'ELEMENT' : 'null');
    elementRef.current = element;
    if (element) {
      registerDockingZone(zoneId, element);
    }
    // Note: Don't unregister on null - zones may be remounting
  }, [zoneId, registerDockingZone]);

  // Find which widget (if any) is docked to this zone
  const dockedWidget = Object.entries(activeDocks).find(
    ([, dock]) => dock.zoneId === zoneId
  )?.[0] || null;

  // Get placeholder style for docked widget
  const dockInfo = dockedWidget ? activeDocks[dockedWidget] : null;
  const placeholderStyle = dockInfo ? {
    width: dockInfo.placeholder.width,
    height: dockInfo.placeholder.height,
    minHeight: dockInfo.placeholder.height,
  } : null;

  // Check if this zone should be highlighted (widget center near zone)
  let isHighlighted = false;
  if (draggingWidget && zoneBounds[zoneId] && widgetBounds[draggingWidget]) {
    const zRect = zoneBounds[zoneId];
    const wRect = widgetBounds[draggingWidget];

    // Widget's vertical center
    const widgetCenterY = wRect.top + wRect.height / 2;

    // Check if widget center is near zone (with tolerance)
    const tolerance = 40; // pixels - slightly larger for highlighting
    const inVerticalRange = widgetCenterY >= zRect.top - tolerance &&
                            widgetCenterY <= zRect.bottom + tolerance;

    // Also check horizontal overlap
    const horizontalOverlap = wRect.right > zRect.left && wRect.left < zRect.right;

    isHighlighted = inVerticalRange && horizontalOverlap;
  }

  return {
    zoneRef,
    dockedWidget,
    placeholderStyle,
    isHighlighted,
  };
}

/**
 * useWidgetDocking
 *
 * Hook for WidgetLayout to handle widget docking during drag operations.
 *
 * @param {string} widgetKey - The widget's unique key
 * @returns {{ elementRef: RefCallback, isDocked: boolean, dockInfo: object|null }}
 */
export function useWidgetDocking(widgetKey) {
  const {
    registerWidgetElement,
    unregisterWidgetElement,
    activeDocks,
  } = useWidgetContext();

  const elementRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unregisterWidgetElement(widgetKey);
    };
  }, [widgetKey, unregisterWidgetElement]);

  // Ref callback to register the widget element
  const refCallback = useCallback((element) => {
    elementRef.current = element;
    if (element) {
      registerWidgetElement(widgetKey, element);
    } else {
      unregisterWidgetElement(widgetKey);
    }
  }, [widgetKey, registerWidgetElement, unregisterWidgetElement]);

  const dockInfo = activeDocks[widgetKey] || null;
  const isDocked = !!dockInfo;

  return {
    elementRef: refCallback,
    isDocked,
    dockInfo,
  };
}

/**
 * useActiveDocks
 *
 * Hook to get all active docks (useful for debugging or visualization).
 *
 * @returns {Object} Map of widgetKey -> dockInfo
 */
export function useActiveDocks() {
  const { activeDocks } = useWidgetContext();
  return activeDocks;
}

/**
 * useDraggingWidget
 *
 * Hook to get the currently dragging widget.
 *
 * @returns {string|null} The widget key being dragged, or null
 */
export function useDraggingWidget() {
  const { draggingWidget } = useWidgetContext();
  return draggingWidget;
}
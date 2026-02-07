import { useState, useCallback, useEffect } from 'react';

const STORAGE_PREFIX = 'electometro-layout-';

/**
 * Hook for persisting widget layouts per-election in localStorage
 * @param {string} electionId - Current election identifier
 * @param {Object} defaultLayout - Default layout when no saved layout exists
 * @returns {{ layout: Object, setLayout: Function, resetLayout: Function }}
 */
export function useLayoutPersistence(electionId, defaultLayout = {}) {
  const storageKey = electionId ? `${STORAGE_PREFIX}${electionId}` : null;

  // Initialize layout from localStorage or defaults
  const [layout, setLayoutState] = useState(() => {
    if (!storageKey) return defaultLayout;

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge saved with defaults to ensure new widgets get default layouts
        return { ...defaultLayout, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to load widget layout from localStorage:', e);
    }
    return defaultLayout;
  });

  // Update layout when election changes
  useEffect(() => {
    if (!storageKey) {
      setLayoutState(defaultLayout);
      return;
    }

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setLayoutState({ ...defaultLayout, ...parsed });
      } else {
        setLayoutState(defaultLayout);
      }
    } catch (e) {
      console.warn('Failed to load widget layout from localStorage:', e);
      setLayoutState(defaultLayout);
    }
  }, [storageKey, defaultLayout]);

  // Save to localStorage whenever layout changes
  useEffect(() => {
    if (!storageKey) return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(layout));
    } catch (e) {
      console.warn('Failed to save widget layout to localStorage:', e);
    }
  }, [storageKey, layout]);

  // Update a single widget's layout (supports breakpoint-specific data)
  const setLayout = useCallback((widgetId, layoutData) => {
    const { breakpoint, ...position } = layoutData;

    setLayoutState(prev => {
      if (breakpoint) {
        // Breakpoint-specific layout
        return {
          ...prev,
          [breakpoint]: {
            ...prev[breakpoint],
            [widgetId]: { ...prev[breakpoint]?.[widgetId], ...position },
          },
        };
      }
      // Flat layout (legacy)
      return {
        ...prev,
        [widgetId]: { ...prev[widgetId], ...position },
      };
    });
  }, []);

  // Reset to default layout
  const resetLayout = useCallback(() => {
    setLayoutState(defaultLayout);
    if (storageKey) {
      try {
        localStorage.removeItem(storageKey);
      } catch (e) {
        console.warn('Failed to remove widget layout from localStorage:', e);
      }
    }
  }, [defaultLayout, storageKey]);

  return { layout, setLayout, resetLayout };
}
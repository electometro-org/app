import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { useQuizContext } from '../contexts/useQuizContext';
import { useLayoutPersistence } from './useLayoutPersistence';
import { getWidget } from './registry';

const WidgetContext = createContext(null);

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
function getQuizPhase(state, showGenericIntro, showElectionIntro, showDemographics, turnstileVerified) {
  if (showGenericIntro) return 'intro';
  if (showElectionIntro) return 'election-intro';
  if (!state.questions || state.questions.length === 0) return 'loading';
  if (state.currentQuestionIndex < state.questions.length) return 'quiz';
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
    showDemographics,
    turnstileVerified,
    displayIndex,
    totalQuestions,
  } = quizContext;

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

  // Build quiz state slice for widgets
  const quizState = useMemo(() => ({
    currentQuestionIndex: state.currentQuestionIndex,
    totalQuestions: state.questions?.length || totalQuestions || 0,
    displayIndex: displayIndex || state.currentQuestionIndex + 1,
    phase: getQuizPhase(state, showGenericIntro, showElectionIntro, showDemographics, turnstileVerified),
    election,
    answers: state.answers,
    questions: state.questions,
  }), [
    state.currentQuestionIndex,
    state.questions,
    state.answers,
    totalQuestions,
    displayIndex,
    showGenericIntro,
    showElectionIntro,
    showDemographics,
    turnstileVerified,
    election,
  ]);

  // Get widgets from config with defaults
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

    return configWidgets.map(widget => {
      const registered = getWidget(widget.type);
      return {
        ...registered?.defaults,
        ...widget,
      };
    });
  }, [config?.widgets]);

  // Handle layout changes from grid (supports both slot-based and x/y/w/h)
  const onLayoutChange = useCallback((widgetType, layoutData) => {
    setLayout(widgetType, layoutData);
  }, [setLayout]);

  const value = useMemo(() => ({
    widgets,
    layout,
    quizState,
    onLayoutChange,
    resetLayout,
    VALID_SLOTS,
  }), [
    widgets,
    layout,
    quizState,
    onLayoutChange,
    resetLayout,
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
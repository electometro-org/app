import React, { createContext, useContext, useMemo, useEffect } from 'react';
import { useQuizContext } from '../contexts/useQuizContext';

const BackgroundContext = createContext(null);

/**
 * BackgroundProvider
 *
 * Provides background configuration and quiz state to background components.
 * Reads background config from the current election config.
 */
export function BackgroundProvider({ children }) {
  const { config, state, election } = useQuizContext();

  // Extract background config from election config (or use defaults)
  const backgroundConfig = useMemo(() => {
    return config?.background || { type: 'solid' };
  }, [config?.background]);

  // Apply colorScheme override when background config changes
  useEffect(() => {
    const { colorScheme } = backgroundConfig;

    if (colorScheme) {
      // Override color-scheme on html element
      document.documentElement.style.colorScheme = colorScheme;
    }

    // For non-solid backgrounds, make html/body transparent so image shows through
    if (backgroundConfig.type && backgroundConfig.type !== 'solid') {
      document.documentElement.style.backgroundColor = 'transparent';
      document.body.style.backgroundColor = 'transparent';
    }

    return () => {
      // Cleanup: restore defaults
      document.documentElement.style.colorScheme = '';
      document.documentElement.style.backgroundColor = '';
      document.body.style.backgroundColor = '';
    };
  }, [backgroundConfig]);

  // Build quiz state slice for backgrounds
  const quizState = useMemo(() => ({
    currentQuestionIndex: state.currentQuestionIndex,
    totalQuestions: state.questions?.length || 0,
    phase: getQuizPhase(state),
    election,
  }), [state.currentQuestionIndex, state.questions?.length, state, election]);

  const value = useMemo(() => ({
    config: backgroundConfig,
    quizState,
  }), [backgroundConfig, quizState]);

  return (
    <BackgroundContext.Provider value={value}>
      {children}
    </BackgroundContext.Provider>
  );
}

/**
 * Hook to access background context
 */
export function useBackgroundContext() {
  const context = useContext(BackgroundContext);
  if (!context) {
    throw new Error('useBackgroundContext must be used within a BackgroundProvider');
  }
  return context;
}

/**
 * Determine current quiz phase
 */
function getQuizPhase(state) {
  if (!state.questions || state.questions.length === 0) {
    return 'loading';
  }
  if (state.currentQuestionIndex < state.questions.length) {
    return 'quiz';
  }
  if (state.comparisonResults) {
    return 'results';
  }
  return 'demographics';
}

export { BackgroundContext };

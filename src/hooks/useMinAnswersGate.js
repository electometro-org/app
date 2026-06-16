import { useState } from "react";
import { trackEvent } from "../utils/analytics";

/**
 * useMinAnswersGate - Completion gating
 * Takes state/dispatch, config
 * Returns: { minAnswersGate, closeMinAnswersGate, getMinAnswersStats, handleEndQuiz }
 */
export function useMinAnswersGate(state, dispatch, config, onTransitionToTopicImportance) {
  const [minAnswersGate, setMinAnswersGate] = useState({
    open: false,
    answered: 0,
    required: 0,
  });

  const getMinAnswersStats = () => {
    const answeredCount = Object.values(state.answers || {}).filter(answer => answer != null).length;
    const minRatioValue = Number(config?.minAnsweredRatioForResults ?? 0.5);
    const clampedMinRatio = Number.isFinite(minRatioValue) ? Math.min(1, Math.max(0, minRatioValue)) : 0.5;
    const requiredCount = Math.ceil((state.questions?.length || 0) * clampedMinRatio);
    return {
      answeredCount,
      requiredCount,
      requiredRatio: clampedMinRatio,
      meetsThreshold: answeredCount >= requiredCount,
    };
  };

  const closeMinAnswersGate = () => {
    setMinAnswersGate(prev => ({ ...prev, open: false }));
  };

  const handleEndQuiz = () => {
    const {
      answeredCount,
      requiredCount,
      requiredRatio,
      meetsThreshold,
    } = getMinAnswersStats();

    if (!meetsThreshold) {
      setMinAnswersGate({
        open: true,
        answered: answeredCount,
        required: requiredCount,
      });
      trackEvent("quiz_finish_blocked_min_answers", {
        total_questions: state.questions.length,
        answered_count: answeredCount,
        required_count: requiredCount,
        required_ratio: requiredRatio,
      });
      return;
    }

    trackEvent("quiz_completed", {
      total_questions: state.questions.length,
      answered_count: answeredCount
    });

    dispatch({ type: "SET_SELECTED_ENTITY", payload: null });
    dispatch({ type: "SET_CURRENT_QUESTION_INDEX", payload: state.questions.length });

    onTransitionToTopicImportance?.();
  };

  const reset = () => {
    setMinAnswersGate({ open: false, answered: 0, required: 0 });
  };

  return {
    minAnswersGate,
    closeMinAnswersGate,
    getMinAnswersStats,
    handleEndQuiz,
    reset,
  };
}

import { useState } from "react";

/**
 * useMinAnswersGate
 * Manages: completion gating based on minimum answered questions
 *
 * Args:
 * - state: quiz state from useQuiz (for questions, answers)
 * - config: election config (for minAnsweredRatioForResults)
 *
 * Returns:
 * - minAnswersGate { open, answered, required }
 * - getMinAnswersStats()
 * - closeMinAnswersGate
 * - reset()
 */
export function useMinAnswersGate({ state, config }) {
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

  const openMinAnswersGate = () => {
    const stats = getMinAnswersStats();
    setMinAnswersGate({
      open: true,
      answered: stats.answeredCount,
      required: stats.requiredCount,
    });
  };

  const setGate = (gateObj) => {
    setMinAnswersGate(gateObj);
  };

  const reset = () => {
    setMinAnswersGate({ open: false, answered: 0, required: 0 });
  };

  return {
    minAnswersGate,
    getMinAnswersStats,
    closeMinAnswersGate,
    openMinAnswersGate,
    setGate,
    reset,
  };
}

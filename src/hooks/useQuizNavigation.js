import { useState, useEffect, useMemo } from "react";
import { computeUniqueIndices, findNextUniqueIndex, findPrevUniqueIndex } from "../services/quizService";

/**
 * useQuizNavigation
 * Manages: question traversal + UI chrome state (menu, mobile)
 *
 * Args:
 * - state: quiz state from useQuiz (for questions, currentQuestionIndex)
 * - dispatch: quiz dispatch from useQuiz (for SET_CURRENT_QUESTION_INDEX, SET_HOVERED_OPTION)
 *
 * Returns:
 * - uniqueIndices, totalQuestions, displayIndex, hasReachedLastQuestion
 * - handleSkip, handleGoBack, goToNextUnanswered
 * - showMenu, setShowMenu, isMobile, mobileOpen, setMobileOpen
 * - reset()
 */
export function useQuizNavigation({ state, dispatch }) {
  const [showMenu, setShowMenu] = useState(false);
  const isClient = typeof window !== "undefined";
  const [isMobile, setIsMobile] = useState(isClient ? window.innerWidth < 768 : false);
  const [mobileOpen, setMobileOpen] = useState(null);
  const [hasReachedLastQuestion, setHasReachedLastQuestion] = useState(false);

  // Unique question indices (for navigation)
  const uniqueIndices = useMemo(() => computeUniqueIndices(state.questions), [state.questions]);

  const totalQuestions = uniqueIndices.length;
  const displayIndex = uniqueIndices.indexOf(state.currentQuestionIndex) + 1;

  // Navigation helpers using imported functions
  const goToUniqueAfter = (currentIndex) => findNextUniqueIndex(uniqueIndices, currentIndex);
  const goToUniqueBefore = (currentIndex) => findPrevUniqueIndex(uniqueIndices, currentIndex);

  // Handle window resize for mobile detection
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Clear hover/focus when question changes
  useEffect(() => {
    dispatch({ type: "SET_HOVERED_OPTION", payload: null });
    if (typeof document !== "undefined" && document.activeElement?.blur) {
      document.activeElement.blur();
    }
  }, [state.currentQuestionIndex, dispatch]);

  // Track if the user has reached the last question at least once
  useEffect(() => {
    const lastIndex = (state.questions?.length || 0) - 1;
    if (lastIndex >= 0 && state.currentQuestionIndex >= lastIndex) {
      setHasReachedLastQuestion(true);
    }
  }, [state.currentQuestionIndex, state.questions]);

  const handleSkip = () => {
    const next = goToUniqueAfter(state.currentQuestionIndex);
    if (next !== undefined) dispatch({ type: "SET_CURRENT_QUESTION_INDEX", payload: next });
  };

  const handleGoBack = () => {
    const prev = goToUniqueBefore(state.currentQuestionIndex);
    if (prev !== undefined) dispatch({ type: "SET_CURRENT_QUESTION_INDEX", payload: prev });
  };

  const goToNextUnanswered = () => {
    const nextUnanswered = uniqueIndices.find(index => state.answers?.[index] == null);
    if (nextUnanswered !== undefined) {
      dispatch({ type: "SET_CURRENT_QUESTION_INDEX", payload: nextUnanswered });
      window.scrollTo(0, 0);
    }
  };

  const reset = () => {
    setShowMenu(false);
    setMobileOpen(null);
    setHasReachedLastQuestion(false);
  };

  return {
    uniqueIndices,
    totalQuestions,
    displayIndex,
    hasReachedLastQuestion,
    handleSkip,
    handleGoBack,
    goToNextUnanswered,
    showMenu,
    setShowMenu,
    isMobile,
    mobileOpen,
    setMobileOpen,
    reset,
  };
}

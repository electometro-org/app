import React, { createContext, useEffect, useMemo, useState } from "react";
import { useQuiz } from "../hooks/useQuiz";
import { trackEvent } from "../utils/analytics";
import { USER_TO_NUM, MIN_COMPARED } from "../constants/answerMappings";
import { getBranding, defaultBranding, useElectionBranding } from "../config/branding";
import { preSelectedElectionId, shouldShowElectionIntro } from "../config/appConfig";
import { electionConfigs } from "../elections";
import { findNextUniqueIndex } from "../services/quizService";

// Import the new focused hooks
import { useElectionFlow } from "../hooks/useElectionFlow";
import { useQuizNavigation } from "../hooks/useQuizNavigation";
import { useMinAnswersGate } from "../hooks/useMinAnswersGate";
import { useTopicImportance } from "../hooks/useTopicImportance";
import { useResultsComputation } from "../hooks/useResultsComputation";
import { useDemographicsAndSubmission } from "../hooks/useDemographicsAndSubmission";
import { useMnemonicRestore } from "../hooks/useMnemonicRestore";
import { useThemeAndAssets } from "../hooks/useThemeAndAssets";

const QuizContext = createContext(null);

export function QuizProvider({ children }) {
  // 1. Election flow management (initialize first)
  const {
    election,
    setElection,
    showGenericIntro,
    setShowGenericIntro,
    showElectionIntro,
    setShowElectionIntro,
    electionIntroInitialized,
    handleGenericIntroContinue,
    handleSelectElection,
    handleStartQuiz,
    reset: resetElectionFlow,
  } = useElectionFlow();

  // Core quiz state management (depends on election)
  const { state, dispatch, config, electionConfigs, enabledElections } = useQuiz(election);

  // Round selection state (needed before useResultsComputation)
  const [selectedRoundId, setSelectedRoundId] = useState(null);
  const [selectedResultType, setSelectedResultType] = useState(null);
  const rounds = config?.rounds || [];
  const selectedRound = rounds.find(r => r.id === selectedRoundId) ?? rounds[rounds.length - 1] ?? null;
  const resultTypes = config?.resultTypes || [];

  // 2. Quiz navigation & UI chrome
  const {
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
    reset: resetNavigation,
  } = useQuizNavigation({ state, dispatch });

  // 3. Min answers gating
  const {
    minAnswersGate,
    getMinAnswersStats,
    closeMinAnswersGate,
    openMinAnswersGate,
    reset: resetMinAnswersGate,
  } = useMinAnswersGate({ state, config });

  // 4. Results computation (provides `computeAndDispatchResults` callback)
  const {
    votesDataCacheRef,
    getVotesData,
    quizDataVersion,
    setQuizDataVersion,
    partyComplete,
    partyIncomplete,
    presComplete,
    presIncomplete,
    sortByScoreDesc,
    handleEntityClick,
    computeAndDispatchResults,
    reset: resetResults,
  } = useResultsComputation({ state, dispatch, config, selectedRound });

  // 5. Topic importance (uses computeAndDispatchResults from step 4)
  const {
    uniqueTopics,
    showTopicImportance,
    setShowTopicImportance,
    handleToggleTopicImportance,
    applyTopicImportanceToWeights,
    handleTopicImportanceContinue,
    reset: resetTopicImportance,
  } = useTopicImportance({ state, dispatch, computeAndDispatchResults });

  // 6. Demographics & submission
  const {
    showDemographics,
    setShowDemographics,
    demographics,
    setDemographics,
    showTurnstileOverlay,
    setShowTurnstileOverlay,
    turnstileVerified,
    setTurnstileVerified,
    submitAnswersToAPI,
    submitDemographicsAndComputeResults,
    handleTurnstileSuccess,
    handleBackToSurvey,
    fingerprint,
    fingerprintLoading,
    reset: resetDemographicsAndSubmission,
  } = useDemographicsAndSubmission({ state, quizDataVersion });

  // 7. Mnemonic restore (uses computeAndDispatchResults from step 4)
  const {
    restoredFromMnemonic,
    setRestoredFromMnemonic,
    restoredVersion,
    versionMismatchType,
    setVersionMismatchType,
    restoreFromMnemonic,
    clearMnemonicFromUrl,
    reset: resetMnemonicRestore,
  } = useMnemonicRestore({
    state,
    dispatch,
    config,
    computeAndDispatchResults,
    setShowTopicImportance,
    setShowDemographics,
    setShowTurnstileOverlay,
    setTurnstileVerified,
    submitAnswersToAPI,
    setQuizDataVersion,
  });

  // 8. Theme & assets (side-effect-only)
  useThemeAndAssets({ election, fingerprint, electionConfigs });

  // Sync selectedResultType when resultTypes or selectedRound changes
  useEffect(() => {
    if (resultTypes.length) setSelectedResultType(selectedRound?.defaultResultType ?? resultTypes[0]);
  }, [resultTypes, selectedRound]);

  // Reset selectedRoundId when election changes
  useEffect(() => {
    setSelectedRoundId(null);
  }, [election]);

  // Handle answer click with mnemonic clearing
  const handleAnswerClick = (option, { advance = true } = {}) => {
    const currentIndex = state.currentQuestionIndex;
    const currentQuestion = state.questions[currentIndex] || {};

    clearMnemonicFromUrl();

    trackEvent("answer_selected", {
      question_id: currentQuestion.id ?? null,
      question_index: currentIndex,
      answer: option
    });

    const text = currentQuestion.question;
    state.questions.forEach((q, i) => {
      if (q.question === text) {
        dispatch({ type: "ANSWER", index: i, answer: option });
      }
    });

    if (advance) {
      const next = findNextUniqueIndex(uniqueIndices, state.currentQuestionIndex);
      if (next !== undefined) dispatch({ type: "SET_CURRENT_QUESTION_INDEX", payload: next });
    }
  };

  // Handle mobile entity toggle
  const handleMobileToggle = (entity, type) => {
    const id = type === "party" ? entity.party : entity.name;
    setMobileOpen(prev => {
      const isSame = prev === id;
      if (!isSame) handleEntityClick(entity, type);
      return isSame ? null : id;
    });
  };

  // Handle end quiz with gating
  const handleEndQuiz = () => {
    const stats = getMinAnswersStats();

    if (!stats.meetsThreshold) {
      openMinAnswersGate();
      trackEvent("quiz_finish_blocked_min_answers", {
        total_questions: state.questions.length,
        answered_count: stats.answeredCount,
        required_count: stats.requiredCount,
        required_ratio: stats.requiredRatio,
      });
      return;
    }

    trackEvent("quiz_completed", {
      total_questions: state.questions.length,
      answered_count: stats.answeredCount
    });

    setShowTopicImportance(true);
    dispatch({ type: "SET_SELECTED_ENTITY", payload: null });
    dispatch({ type: "SET_CURRENT_QUESTION_INDEX", payload: state.questions.length });
    window.scrollTo(0, 0);
  };

  // Unified reset function
  const handleReset = () => {
    clearMnemonicFromUrl();
    resetElectionFlow();
    resetNavigation();
    resetMinAnswersGate();
    resetTopicImportance();
    resetDemographicsAndSubmission();
    resetMnemonicRestore();
    resetResults();
    dispatch({ type: "RESET" });
    window.scrollTo(0, 0);
  };

  // Assemble context value
  const value = {
    // Core quiz state
    election,
    setElection,
    state,
    dispatch,
    config,
    electionConfigs,
    enabledElections,
    resultTypes,

    // UI state
    showMenu,
    setShowMenu,
    isMobile,
    selectedResultType,
    setSelectedResultType,
    mobileOpen,
    setMobileOpen,
    showTopicImportance,
    setShowTopicImportance,
    hasReachedLastQuestion,
    minAnswersGate,
    showDemographics,
    setShowDemographics,
    demographics,
    setDemographics,
    showGenericIntro,
    setShowGenericIntro,
    showElectionIntro,
    setShowElectionIntro,
    showTurnstileOverlay,
    setShowTurnstileOverlay,
    turnstileVerified,
    setTurnstileVerified,
    restoredFromMnemonic,
    setRestoredFromMnemonic,

    // Version tracking
    quizDataVersion,
    restoredVersion,
    versionMismatchType,
    setVersionMismatchType,

    // Fingerprint
    fingerprint,
    fingerprintLoading,

    // Computed values
    uniqueIndices,
    totalQuestions,
    displayIndex,
    canFinishQuizNow: hasReachedLastQuestion && getMinAnswersStats().meetsThreshold,
    uniqueTopics,
    partyComplete,
    partyIncomplete,
    presComplete,
    presIncomplete,

    // Branding
    branding: (election && useElectionBranding) ? getBranding(config) : defaultBranding,

    // Handlers
    handleSkip,
    handleGoBack,
    handleAnswerClick,
    handleMobileToggle,
    handleEndQuiz,
    closeMinAnswersGate,
    goToNextUnanswered,
    handleTopicImportanceContinue,
    handleToggleTopicImportance,
    handleEntityClick,
    handleBackToSurvey,
    handleReset,
    handleTurnstileSuccess,
    submitDemographicsAndComputeResults,
    handleGenericIntroContinue,
    handleSelectElection,
    handleStartQuiz,
    restoreFromMnemonic,

    // Round selection
    rounds,
    selectedRound,
    handleRoundChange: setSelectedRoundId,

    // Constants
    USER_TO_NUM,
    MIN_COMPARED,
  };

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
}

export { QuizContext };

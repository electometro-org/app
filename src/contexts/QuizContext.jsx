import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useQuiz } from "../hooks/useQuiz";
import { trackEvent } from "../utils/analytics";
import { USER_TO_NUM, MIN_COMPARED } from "../constants/answerMappings";
import { getBranding, defaultBranding, useElectionBranding } from "../config/branding";
import { findNextUniqueIndex } from "../services/quizService";

import { useElectionFlow } from "../hooks/useElectionFlow";
import { useQuizNavigation } from "../hooks/useQuizNavigation";
import { useMinAnswersGate } from "../hooks/useMinAnswersGate";
import { useTopicImportance } from "../hooks/useTopicImportance";
import { useResultsComputation } from "../hooks/useResultsComputation";
import { useDemographicsAndSubmission } from "../hooks/useDemographicsAndSubmission";
import { useMnemonicRestore } from "../hooks/useMnemonicRestore";
import { useThemeAndAssets } from "../hooks/useThemeAndAssets";

import { ElectionContext } from "./ElectionContext";
import { QuizFlowContext } from "./QuizFlowContext";
import { ResultsContext } from "./ResultsContext";
import { UIContext } from "./UIContext";

export function QuizProvider({ children }) {
  // 1. Election flow management (initialize first)
  const {
    election,
    setElection,
    showGenericIntro,
    setShowGenericIntro,
    showElectionIntro,
    setShowElectionIntro,
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
  const rounds = useMemo(() => config?.rounds || [], [config?.rounds]);
  const selectedRound = useMemo(
    () => rounds.find(r => r.id === selectedRoundId) ?? rounds[rounds.length - 1] ?? null,
    [rounds, selectedRoundId]
  );
  const resultTypes = useMemo(() => config?.resultTypes || [], [config?.resultTypes]);

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
    setGate,
    reset: resetMinAnswersGate,
  } = useMinAnswersGate({ state, config });

  // 4. Results computation (provides `computeAndDispatchResults` callback)
  const {
    quizDataVersion,
    partyComplete,
    partyIncomplete,
    presComplete,
    presIncomplete,
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
    handleTopicImportanceContinue: _handleTopicImportanceContinue,
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
    submitDemographicsAndComputeResults,
    handleTurnstileSuccess,
    handleBackToSurvey,
    fingerprint,
    fingerprintLoading,
    reset: resetDemographicsAndSubmission,
  } = useDemographicsAndSubmission({
    state,
    quizDataVersion,
    setShowTopicImportance,
    setGate,
    dispatch,
  });

  const handleTopicImportanceContinue = useCallback(() => {
    _handleTopicImportanceContinue();
    setShowDemographics(true);
  }, [_handleTopicImportanceContinue, setShowDemographics]);

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
    setShowElectionIntro,
    quizDataVersion,
  });

  // 8. Theme & assets (side-effect-only)
  useThemeAndAssets({ election, fingerprint, electionConfigs });

  useEffect(() => {
    if (resultTypes.length) setSelectedResultType(selectedRound?.defaultResultType ?? resultTypes[0]);
  }, [resultTypes, selectedRound]);

  useEffect(() => {
    setSelectedRoundId(null);
  }, [election]);

  // Duplicate-question sync is handled in the reducer (ANSWER_SYNCED action).
  const handleAnswerClick = useCallback((option, { advance = true } = {}) => {
    const currentIndex = state.currentQuestionIndex;
    const currentQuestion = state.questions[currentIndex] || {};

    clearMnemonicFromUrl();

    trackEvent("answer_selected", {
      question_id: currentQuestion.id ?? null,
      question_index: currentIndex,
      answer: option
    });

    dispatch({ type: "ANSWER_SYNCED", questionText: currentQuestion.question, answer: option });

    if (advance) {
      const next = findNextUniqueIndex(uniqueIndices, currentIndex);
      if (next !== undefined) dispatch({ type: "SET_CURRENT_QUESTION_INDEX", payload: next });
    }
  }, [state.currentQuestionIndex, state.questions, uniqueIndices, dispatch, clearMnemonicFromUrl]);

  const handleMobileToggle = useCallback((entity, type) => {
    const id = type === "party" ? entity.party : entity.name;
    setMobileOpen(prev => {
      const isSame = prev === id;
      if (!isSame) handleEntityClick(entity, type);
      return isSame ? null : id;
    });
  }, [setMobileOpen, handleEntityClick]);

  const handleEndQuiz = useCallback(() => {
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
  }, [getMinAnswersStats, openMinAnswersGate, state.questions.length, setShowTopicImportance, dispatch]);

  const handleReset = useCallback(() => {
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
  }, [
    clearMnemonicFromUrl, resetElectionFlow, resetNavigation, resetMinAnswersGate,
    resetTopicImportance, resetDemographicsAndSubmission, resetMnemonicRestore,
    resetResults, dispatch,
  ]);

  const branding = useMemo(
    () => (election && useElectionBranding) ? getBranding(config) : defaultBranding,
    [election, config]
  );

  // --- ElectionContext value ---
  const electionValue = useMemo(() => ({
    election,
    setElection,
    config,
    electionConfigs,
    enabledElections,
    branding,
    rounds,
    selectedRound,
    handleRoundChange: setSelectedRoundId,
    handleSelectElection,
    handleStartQuiz,
    handleGenericIntroContinue,
  }), [
    election, setElection, config, electionConfigs, enabledElections, branding,
    rounds, selectedRound, handleSelectElection, handleStartQuiz, handleGenericIntroContinue,
  ]);

  // --- QuizFlowContext value ---
  const canFinishQuizNow = hasReachedLastQuestion && getMinAnswersStats().meetsThreshold;
  const quizFlowValue = useMemo(() => ({
    state,
    dispatch,
    uniqueIndices,
    totalQuestions,
    displayIndex,
    hasReachedLastQuestion,
    canFinishQuizNow,
    handleSkip,
    handleGoBack,
    handleAnswerClick,
    handleEndQuiz,
    goToNextUnanswered,
    handleReset,
    restoreFromMnemonic,
    quizDataVersion,
    restoredVersion,
    restoredFromMnemonic,
    setRestoredFromMnemonic,
    versionMismatchType,
    setVersionMismatchType,
  }), [
    state, dispatch, uniqueIndices, totalQuestions, displayIndex,
    hasReachedLastQuestion, canFinishQuizNow,
    handleSkip, handleGoBack, handleAnswerClick, handleEndQuiz,
    goToNextUnanswered, handleReset, restoreFromMnemonic,
    quizDataVersion, restoredVersion, restoredFromMnemonic, setRestoredFromMnemonic,
    versionMismatchType, setVersionMismatchType,
  ]);

  // --- ResultsContext value ---
  const resultsValue = useMemo(() => ({
    partyComplete,
    partyIncomplete,
    presComplete,
    presIncomplete,
    resultTypes,
    selectedResultType,
    setSelectedResultType,
    isMobile,
    mobileOpen,
    setMobileOpen,
    uniqueTopics,
    handleEntityClick,
    handleMobileToggle,
    USER_TO_NUM,
    MIN_COMPARED,
  }), [
    partyComplete, partyIncomplete, presComplete, presIncomplete,
    resultTypes, selectedResultType, isMobile, mobileOpen, setMobileOpen,
    uniqueTopics, handleEntityClick, handleMobileToggle,
  ]);

  // --- UIContext value ---
  const uiValue = useMemo(() => ({
    showMenu,
    setShowMenu,
    showGenericIntro,
    setShowGenericIntro,
    showElectionIntro,
    setShowElectionIntro,
    showTopicImportance,
    setShowTopicImportance,
    minAnswersGate,
    closeMinAnswersGate,
    showDemographics,
    setShowDemographics,
    demographics,
    setDemographics,
    showTurnstileOverlay,
    setShowTurnstileOverlay,
    turnstileVerified,
    setTurnstileVerified,
    fingerprint,
    fingerprintLoading,
    handleToggleTopicImportance,
    handleTopicImportanceContinue,
    handleBackToSurvey,
    handleTurnstileSuccess,
    submitDemographicsAndComputeResults,
  }), [
    showMenu, setShowMenu, showGenericIntro, setShowGenericIntro,
    showElectionIntro, setShowElectionIntro, showTopicImportance, setShowTopicImportance,
    minAnswersGate, closeMinAnswersGate, showDemographics, setShowDemographics,
    demographics, setDemographics, showTurnstileOverlay, setShowTurnstileOverlay,
    turnstileVerified, setTurnstileVerified, fingerprint, fingerprintLoading,
    handleToggleTopicImportance, handleTopicImportanceContinue,
    handleBackToSurvey, handleTurnstileSuccess, submitDemographicsAndComputeResults,
  ]);

  return (
    <ElectionContext.Provider value={electionValue}>
      <QuizFlowContext.Provider value={quizFlowValue}>
        <ResultsContext.Provider value={resultsValue}>
          <UIContext.Provider value={uiValue}>
            {children}
          </UIContext.Provider>
        </ResultsContext.Provider>
      </QuizFlowContext.Provider>
    </ElectionContext.Provider>
  );
}

import React, { createContext, useState, useEffect, useCallback, useMemo } from "react";
import { useQuiz } from "../hooks/useQuiz";
import { useFingerprint } from "../hooks/useFingerprint";
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

const QuizContext = createContext(null);

export function QuizProvider({ children }) {
  // 1. Initialize election first (from preSelectedElectionId or null)
  // We need this before calling useQuiz
  const [electionState, setElectionState] = useState(() => {
    // Import preSelectedElectionId locally to avoid circular dependency
    try {
      // eslint-disable-next-line global-require
      const { preSelectedElectionId: preSelected } = require("../config/appConfig");
      return preSelected;
    } catch {
      return null;
    }
  });

  // Core quiz state - now with the correct election
  const { state, dispatch, config, electionConfigs, enabledElections } = useQuiz(electionState);
  const resultTypes = useMemo(() => config?.resultTypes || [], [config]);

  // Round selection
  const [selectedRoundId, setSelectedRoundId] = useState(null);
  const rounds = useMemo(() => config?.rounds || [], [config]);
  const selectedRound = useMemo(
    () => rounds.find(r => r.id === selectedRoundId) ?? rounds[rounds.length - 1] ?? null,
    [rounds, selectedRoundId]
  );

  // Selected result type
  const [selectedResultType, setSelectedResultType] = useState(resultTypes[0] || null);

  // Sync selectedResultType when resultTypes or selectedRound changes
  useEffect(() => {
    if (resultTypes.length) setSelectedResultType(selectedRound?.defaultResultType ?? resultTypes[0]);
  }, [resultTypes, selectedRound]);

  // Fingerprint
  const { fingerprint, loading: fingerprintLoading } = useFingerprint();

  // === Compose all hooks ===

  // 1. Election Flow - Now properly wired with setElectionState
  const electionFlow = useElectionFlow(config, electionConfigs);
  
  // Wire election changes from electionFlow to our state
  useEffect(() => {
    if (electionFlow.election !== null && electionFlow.election !== electionState) {
      setElectionState(electionFlow.election);
    }
  }, [electionFlow.election, electionState]);

  // Reset round selection when election changes
  useEffect(() => {
    setSelectedRoundId(null);
  }, [electionState]);

  // 2. Theme & Assets (side-effect only)
  useThemeAndAssets(electionState, electionConfigs);

  // 3. Quiz Navigation
  const navigation = useQuizNavigation(state, dispatch);
  const { handleSkip, handleGoBack, goToNextUnanswered, showMenu, setShowMenu, isMobile, mobileOpen, setMobileOpen } = navigation;

  // 4. Results Computation (needed by topic importance and mnemonic restore)
  const results = useResultsComputation(state, dispatch, config, selectedRound, selectedResultType);
  const { quizDataVersion, partyComplete, partyIncomplete, presComplete, presIncomplete, handleEntityClick, computeAndDispatchResults } = results;

  // 5. Topic Importance (uses computeAndDispatchResults)
  const clearMnemonicFromUrl = useCallback(() => {
    const currentHash = window.location.hash;
    if (currentHash.includes("?r=")) {
      const basePath = currentHash.split("?")[0] || "#/";
      window.history.replaceState(null, "", `${window.location.pathname}${basePath}`);
    }
  }, []);

  const topicImportance = useTopicImportance(
    state,
    dispatch,
    config,
    selectedRound,
    computeAndDispatchResults,
    clearMnemonicFromUrl
  );
  const { showTopicImportance, setShowTopicImportance, handleToggleTopicImportance, handleTopicImportanceContinue } = topicImportance;

  // 6. Min Answers Gate (transitions to topic importance)
  const minAnswersGate = useMinAnswersGate(
    state,
    dispatch,
    config,
    () => {
      setShowTopicImportance(true);
      window.scrollTo(0, 0);
    }
  );
  const { minAnswersGate: minAnswersGateState, closeMinAnswersGate, handleEndQuiz, getMinAnswersStats } = minAnswersGate;

  // 7. Demographics & Submission (uses quizDataVersion)
  const demographics = useDemographicsAndSubmission(
    state,
    quizDataVersion,
    () => {
      // handleBackToSurvey flow
      setShowTopicImportance(false);
      dispatch({ type: "SET_CURRENT_QUESTION_INDEX", payload: state.questions.length - 1 });
    }
  );
  const { showDemographics, setShowDemographics, demographics: demographicsData, setDemographics, showTurnstileOverlay, setShowTurnstileOverlay, turnstileVerified, setTurnstileVerified, submitDemographicsAndComputeResults, handleTurnstileSuccess: handleTurnstileSuccessBase, handleBackToSurvey } = demographics;

  // Wrap handleTurnstileSuccess to pass restoredFromMnemonic
  const handleTurnstileSuccess = (token, captchaType, restoredFromMnemonic) => {
    return handleTurnstileSuccessBase(token, captchaType, restoredFromMnemonic);
  };

  // 8. Mnemonic Restore (uses computeAndDispatchResults)
  const mnemonicRestore = useMnemonicRestore(
    state,
    dispatch,
    config,
    selectedRound,
    computeAndDispatchResults,
    (uiState) => {
      // Setup UI after successful restore
      if (uiState.showTopicImportance !== undefined) setShowTopicImportance(uiState.showTopicImportance);
      if (uiState.showDemographics !== undefined) setShowDemographics(uiState.showDemographics);
      if (uiState.showTurnstileOverlay !== undefined) setShowTurnstileOverlay(uiState.showTurnstileOverlay);
      if (uiState.turnstileVerified !== undefined) setTurnstileVerified(uiState.turnstileVerified);
    }
  );
  const { restoredFromMnemonic, restoredVersion, versionMismatchType, setVersionMismatchType, restoreFromMnemonic } = mnemonicRestore;

  // Additional handlers that need dispatch and state references
  const handleAnswerClick = (option, { advance = true } = {}) => {
    const currentIndex = state.currentQuestionIndex;
    const currentQuestion = state.questions[currentIndex] || {};

    // Clear mnemonic from URL when user changes answers
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
      const next = findNextUniqueIndex(navigation.uniqueIndices, state.currentQuestionIndex);
      if (next !== undefined) dispatch({ type: "SET_CURRENT_QUESTION_INDEX", payload: next });
    }
  };

  const handleMobileToggle = (entity, type) => {
    const id = type === "party" ? entity.party : entity.name;
    setMobileOpen(prev => {
      const isSame = prev === id;
      if (!isSame) handleEntityClick(entity, type);
      return isSame ? null : id;
    });
  };

  // Handle reset - call reset on all hooks
  const handleReset = () => {
    clearMnemonicFromUrl();
    electionFlow.reset();
    navigation.reset();
    minAnswersGate.reset();
    topicImportance.reset();
    results.reset();
    demographics.reset();
    mnemonicRestore.reset();
    dispatch({ type: "RESET" });
    window.scrollTo(0, 0);
  };

  // Branding
  const branding = (election && useElectionBranding) ? getBranding(config) : defaultBranding;

  // Context value
  const value = {
    // Core quiz state
    election: electionState,
    setElection: setElectionState,
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
    hasReachedLastQuestion: navigation.hasReachedLastQuestion,
    minAnswersGate: minAnswersGateState,
    showDemographics,
    setShowDemographics,
    demographics: demographicsData,
    setDemographics,
    showGenericIntro: electionFlow.showGenericIntro,
    setShowGenericIntro: () => {}, // Handled by electionFlow
    showElectionIntro: electionFlow.showElectionIntro,
    setShowElectionIntro: () => {}, // Handled by electionFlow
    showTurnstileOverlay,
    setShowTurnstileOverlay,
    turnstileVerified,
    setTurnstileVerified,
    restoredFromMnemonic,
    setRestoredFromMnemonic: () => {},

    // Version tracking
    quizDataVersion,
    restoredVersion,
    versionMismatchType,
    setVersionMismatchType,

    // Fingerprint
    fingerprint,
    fingerprintLoading,

    // Computed values
    uniqueIndices: navigation.uniqueIndices,
    totalQuestions: navigation.totalQuestions,
    displayIndex: navigation.displayIndex,
    canFinishQuizNow: navigation.hasReachedLastQuestion && getMinAnswersStats().meetsThreshold,
    uniqueTopics: topicImportance.uniqueTopics,
    partyComplete,
    partyIncomplete,
    presComplete,
    presIncomplete,

    // Branding
    branding,

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
    handleGenericIntroContinue: electionFlow.handleGenericIntroContinue,
    handleSelectElection: (electionId) => {
      electionFlow.handleSelectElection(electionId);
      setElectionState(electionId);
    },
    handleStartQuiz: electionFlow.handleStartQuiz,
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

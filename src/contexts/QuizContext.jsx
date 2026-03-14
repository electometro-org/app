import React, { createContext, useState, useEffect, useMemo, useRef } from "react";
import { useQuiz } from "../useQuiz";
import { collectFingerprintPayload, useFingerprint } from "../useFingerprint";
import { trackEvent, setAnalyticsConsent } from "../analytics";
import { colors } from "../colors";
import { USER_TO_NUM, MIN_COMPARED } from "../constants/answerMappings";
import {
  isImputedNeutral,
  computeResultsFrom,
  buildUserAnswers,
  buildUserAnswersWithRaw,
  partitionByCompared,
  buildEntityDetails
} from "../services/resultsService";
import { fetchJsonSafe, computeUniqueIndices, findNextUniqueIndex, findPrevUniqueIndex } from "../services/quizService";
import { buildSubmissionPayload, submitQuizAnswers } from "../services/submissionService";
import { getBranding, defaultBranding, useElectionBranding } from "../config/branding";
import {
  preSelectedElectionId,
  showGenericIntro as showGenericIntroConfig,
  shouldShowElectionIntro
} from "../config/appConfig";
import { decodeFromMnemonic, encodeToMnemonic, isValidMnemonic } from "../utils/mnemonicCodec";
import { compareVersions, isVersionGreaterThan } from "../utils/versionUtils";

const QuizContext = createContext(null);

export function QuizProvider({ children }) {
  // Initialize election from env var if set (for single-election builds)
  const [election, setElection] = useState(preSelectedElectionId);

  // Generic intro: shown before election selection (neutral branding)
  // Starts as true if configured, but skipped when election is pre-selected
  const [showGenericIntro, setShowGenericIntro] = useState(
    showGenericIntroConfig && !preSelectedElectionId
  );

  // Election intro: shown after election is selected, before quiz starts
  // Initial state is false; will be set via effect when config loads (for pre-selected election)
  const [showElectionIntro, setShowElectionIntro] = useState(false);
  const [electionIntroInitialized, setElectionIntroInitialized] = useState(false);

  const { state, dispatch, config, electionConfigs, enabledElections } = useQuiz(election);
  const resultTypes = config?.resultTypes || [];

  // Initialize election intro for pre-selected election once config is loaded
  useEffect(() => {
    if (preSelectedElectionId && config && !electionIntroInitialized) {
      setShowElectionIntro(shouldShowElectionIntro(config));
      setElectionIntroInitialized(true);
    }
  }, [config, electionIntroInitialized]);

  // UI state
  const [showMenu, setShowMenu] = useState(false);
  const isClient = typeof window !== "undefined";
  const [isMobile, setIsMobile] = useState(isClient ? window.innerWidth < 768 : false);
  const [selectedResultType, setSelectedResultType] = useState(resultTypes[0] || null);
  const [mobileOpen, setMobileOpen] = useState(null);
  const [showTopicImportance, setShowTopicImportance] = useState(false);
  const [hasReachedLastQuestion, setHasReachedLastQuestion] = useState(false);
  const [minAnswersGate, setMinAnswersGate] = useState({
    open: false,
    answered: 0,
    required: 0,
  });
  const [showDemographics, setShowDemographics] = useState(false);
  const [demographics, setDemographics] = useState(null);
  const [showTurnstileOverlay, setShowTurnstileOverlay] = useState(false);
  const [turnstileVerified, setTurnstileVerified] = useState(false);
  const [restoredFromMnemonic, setRestoredFromMnemonic] = useState(false);
  const votesDataCacheRef = useRef({});

  // Version tracking state
  const [quizDataVersion, setQuizDataVersion] = useState(null);
  const [restoredVersion, setRestoredVersion] = useState(null);
  const [versionMismatchType, setVersionMismatchType] = useState(null);

  // Fingerprint
  const { fingerprint, loading: fingerprintLoading } = useFingerprint();

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && fingerprint) {
        window.sessionStorage.setItem("fingerprint", fingerprint);
      }
    } catch (_) {}
  }, [fingerprint]);

  // Apply theme CSS variables
  useEffect(() => {
    const currentConfig = election ? electionConfigs[election] : null;
    const themeColors = { ...colors, ...currentConfig?.theme };

    Object.entries(themeColors).forEach(([key, hex]) => {
      document.documentElement.style.setProperty(`--${key}`, hex);
    });
  }, [election, electionConfigs]);

  // Load election-specific CSS
  useEffect(() => {
    if (election) {
      document.documentElement.dataset.election = election;
      import(`../elections/${election}.css`).catch(() => {});
    } else {
      delete document.documentElement.dataset.election;
    }
  }, [election]);

  // Handle window resize for mobile detection
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Sync selectedResultType when resultTypes change
  useEffect(() => {
    if (resultTypes.length) setSelectedResultType(resultTypes[0]);
  }, [resultTypes]);

  useEffect(() => {
    votesDataCacheRef.current = {};
  }, [election, config?.partyVotesUrl, config?.presVotesUrl]);

  // Clear hover/focus when question changes
  useEffect(() => {
    dispatch({ type: "SET_HOVERED_OPTION", payload: null });
    if (typeof document !== "undefined" && document.activeElement?.blur) {
      document.activeElement.blur();
    }
  }, [state.currentQuestionIndex, dispatch]);

  // Unique question indices (for navigation)
  const uniqueIndices = useMemo(() => computeUniqueIndices(state.questions), [state.questions]);

  const totalQuestions = uniqueIndices.length;
  const displayIndex = uniqueIndices.indexOf(state.currentQuestionIndex) + 1;

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

  // Compute unique topics from questions for Topic Importance view
  // Each topic includes its questions for the info dialog
  const uniqueTopics = useMemo(() => {
    const topicMap = new Map();
    state.questions.forEach(q => {
      if (!q.topic_key) return;
      if (!topicMap.has(q.topic_key)) {
        topicMap.set(q.topic_key, {
          label: q.tema || q.topic_key,
          topic_key: q.topic_key,
          questions: [],
        });
      }
      topicMap.get(q.topic_key).questions.push({
        id: q.id,
        question: q.question,
        question_key: q.question_key,
      });
    });
    return Array.from(topicMap.values());
  }, [state.questions]);

  // Navigation helpers using imported functions
  const goToUniqueAfter = (currentIndex) => findNextUniqueIndex(uniqueIndices, currentIndex);
  const goToUniqueBefore = (currentIndex) => findPrevUniqueIndex(uniqueIndices, currentIndex);

  // Partitioned results
  const partyResultsAll = state.comparisonResults?.party_results || [];
  const presidentialResultsAll = state.comparisonResults?.presidential_results || [];
  const { complete: partyComplete, incomplete: partyIncomplete } = partitionByCompared(partyResultsAll);
  const { complete: presComplete, incomplete: presIncomplete } = partitionByCompared(presidentialResultsAll);

  // Handlers
  const handleSkip = () => {
    const next = goToUniqueAfter(state.currentQuestionIndex);
    if (next !== undefined) dispatch({ type: "SET_CURRENT_QUESTION_INDEX", payload: next });
  };

  const handleGoBack = () => {
    const prev = goToUniqueBefore(state.currentQuestionIndex);
    if (prev !== undefined) dispatch({ type: "SET_CURRENT_QUESTION_INDEX", payload: prev });
  };

  const clearMnemonicFromUrl = () => {
    const currentHash = window.location.hash;
    if (currentHash.includes("?r=")) {
      const basePath = currentHash.split("?")[0] || "#/";
      window.history.replaceState(null, "", `${window.location.pathname}${basePath}`);
    }
  };

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
      const next = goToUniqueAfter(state.currentQuestionIndex);
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

  const submitAnswersToAPI = async (demographicsData = null, turnstileToken = null, captchaType = 'turnstile', isResubmission = false, quizVersion = null) => {
    // Honeypot check
    const website_url = document.getElementById('website-url')?.value;
    if (website_url) return;

    try {
      let submissionFingerprint = fingerprint;
      try {
        submissionFingerprint = await collectFingerprintPayload();
        if (typeof window !== "undefined" && submissionFingerprint) {
          window.sessionStorage.setItem("fingerprint", submissionFingerprint);
        }
      } catch (fpError) {
        console.error("Error generating fingerprint for submission:", fpError);
      }

      const payload = buildSubmissionPayload(
        state.questions,
        state.answers,
        state.weights,
        demographicsData,
        submissionFingerprint,
        turnstileToken,
        captchaType,
        isResubmission,
        quizVersion || quizDataVersion
      );
      const data = await submitQuizAnswers(payload);
      console.log("Form submitted successfully:", data);
    } catch (error) {
      console.error("Error submitting form:", error);
    }
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

    // Show Topic Importance view instead of demographics
    setShowTopicImportance(true);
    dispatch({ type: "SET_SELECTED_ENTITY", payload: null });
    dispatch({ type: "SET_CURRENT_QUESTION_INDEX", payload: state.questions.length });

    // Scroll to top when switching views
    window.scrollTo(0, 0);
  };

  // Track if the user has reached the last question at least once in this run.
  useEffect(() => {
    const lastIndex = (state.questions?.length || 0) - 1;
    if (lastIndex >= 0 && state.currentQuestionIndex >= lastIndex) {
      setHasReachedLastQuestion(true);
    }
  }, [state.currentQuestionIndex, state.questions]);

  const closeMinAnswersGate = () => {
    setMinAnswersGate(prev => ({ ...prev, open: false }));
  };

  const goToNextUnanswered = () => {
    const nextUnanswered = uniqueIndices.find(index => state.answers?.[index] == null);
    if (nextUnanswered !== undefined) {
      dispatch({ type: "SET_CURRENT_QUESTION_INDEX", payload: nextUnanswered });
      closeMinAnswersGate();
      window.scrollTo(0, 0);
    }
  };

  // Apply topic importance: boost weights for questions with "very important" topics
  const applyTopicImportanceToWeights = () => {
    state.questions.forEach((q, i) => {
      if (state.topicImportance[q.topic_key]) {
        // Boost weight: 1 -> 2 for "very important" topics (doubles influence)
        dispatch({ type: "SET_WEIGHTS", index: i, weight: 2 });
      }
    });
  };

  // Handle continuing from Topic Importance view to Demographics
  const handleTopicImportanceContinue = () => {
    // Compute boosted weights synchronously (dispatch is async, so we compute inline)
    const boostedWeights = state.weights.map((w, i) => {
      const q = state.questions[i];
      return (q && state.topicImportance[q.topic_key]) ? 2 : w;
    });

    // Apply topic importance to state (for UI consistency)
    applyTopicImportanceToWeights();
    setShowTopicImportance(false);
    setShowDemographics(true);

    // Scroll to top when switching views
    window.scrollTo(0, 0);

    // Compute results with the boosted weights (using synchronously computed values)
    const userAnswers = buildUserAnswers(state.questions, state.answers, boostedWeights);

    const partyPromise = config.partyVotesUrl ? fetchJsonSafe(config.partyVotesUrl) : Promise.resolve(null);
    const presPromise = (config.questionTypes?.includes("presidential") && config.presVotesUrl)
      ? fetchJsonSafe(config.presVotesUrl)
      : Promise.resolve(null);

    Promise.all([partyPromise, presPromise])
      .then(([partyData, presData]) => {
        const partyResults = partyData ? computeResultsFrom(partyData, "parties", userAnswers, { isImputedNeutral }) : [];
        const presidentialResults = presData ? computeResultsFrom(presData, "candidates", userAnswers, { isImputedNeutral }) : [];
        dispatch({
          type: "SET_COMPARISON_RESULTS",
          payload: {
            party_results: partyResults,
            presidential_results: presidentialResults
          }
        });
      })
      .catch(err => console.error("Error fetching votes:", err));
  };

  // Handle toggling topic importance
  const handleToggleTopicImportance = (topicKey) => {
    // Clear mnemonic from URL when user changes topic importance
    clearMnemonicFromUrl();
    dispatch({ type: "TOGGLE_TOPIC_IMPORTANCE", topicKey });
  };

  const submitDemographicsAndComputeResults = (demo) => {
    setDemographics(demo || null);

    if (demo?.analyticsConsent !== undefined) {
      setAnalyticsConsent(demo.analyticsConsent);
    }

    setShowTurnstileOverlay(true);
  };

  const getVotesData = async (url) => {
    if (!url) return null;
    if (votesDataCacheRef.current[url]) return votesDataCacheRef.current[url];
    const data = await fetchJsonSafe(url);
    votesDataCacheRef.current[url] = data;

    // Capture version from fetched votes data
    if (data?.version && !quizDataVersion) {
      setQuizDataVersion(data.version);
    }

    return data;
  };

  const handleEntityClick = (entity, type) => {
    dispatch({ type: "SET_SELECTED_ENTITY", payload: entity });

    const fetchAndDispatchDetails = (url, lookupFn) => {
      getVotesData(url)
        .then(data => {
          const obj = lookupFn(data);
          if (!obj) {
            console.error("No data for", entity);
            return;
          }

          const userAnswersMap = buildUserAnswersWithRaw(state.questions, state.answers, state.weights);
          // Pass full data for quizData context (compact format needs quiz object for question text)
          const entityDetailsPayload = buildEntityDetails(obj, userAnswersMap, type, data);
          dispatch({ type: "SET_ENTITY_DETAILS", payload: entityDetailsPayload });
        })
        .catch(err => console.error("Error fetching votes:", err));
    };

    if (type === "presidential") {
      // Compact format: entity.id is "c1"; Legacy: entity.name is "Full Name (Party)"
      fetchAndDispatchDetails(config.presVotesUrl, data =>
        entity.id ? data.candidates?.[entity.id] : data.candidates?.[entity.name]
      );
      return;
    }

    if (type === "party") {
      // Compact format: entity.id is "p1"; Legacy: entity.party is the party name
      fetchAndDispatchDetails(config.partyVotesUrl, data =>
        entity.id ? data.parties?.[entity.id] : data.parties?.[entity.party]
      );
    }
  };

  // Sort results deterministically (same logic as ResultsView)
  const sortByScoreDesc = (a, b) => {
    const scoreA = Number(a.similarity_score) || 0;
    const scoreB = Number(b.similarity_score) || 0;
    if (scoreB !== scoreA) return scoreB - scoreA;
    const comparedA = Number(a.compared_questions || 0);
    const comparedB = Number(b.compared_questions || 0);
    if (comparedB !== comparedA) return comparedB - comparedA;
    const nameA = a.displayName || a.name || "";
    const nameB = b.displayName || b.name || "";
    return nameA.localeCompare(nameB);
  };

  // Auto-open first entity when results change
  useEffect(() => {
    if (!state.comparisonResults || !selectedResultType) return;

    if (selectedResultType === "party") {
      const sorted = [...partyComplete, ...partyIncomplete].sort(sortByScoreDesc);
      const firstTop = sorted[0];
      if (firstTop) handleEntityClick(firstTop, "party");
      return;
    }

    if (selectedResultType === "presidentialCandidates") {
      const sorted = [...presComplete, ...presIncomplete].sort(sortByScoreDesc);
      const firstTop = sorted[0];
      if (firstTop) handleEntityClick(firstTop, "presidential");
    }
  }, [state.comparisonResults, selectedResultType]);

  const handleBackToSurvey = () => {
    setTurnstileVerified(false);
    setShowTurnstileOverlay(false);
    setShowDemographics(false);
    setShowTopicImportance(false);
    setHasReachedLastQuestion(false);
    setMinAnswersGate({ open: false, answered: 0, required: 0 });
    dispatch({ type: "SET_CURRENT_QUESTION_INDEX", payload: state.questions.length - 1 });
    window.scrollTo(0, 0);
  };

  const handleReset = () => {
    // Clear mnemonic from URL
    clearMnemonicFromUrl();

    // If pre-selected election, go back to election intro (not election selector)
    if (preSelectedElectionId) {
      setShowElectionIntro(shouldShowElectionIntro(config));
    } else {
      setElection(null);
      setShowGenericIntro(showGenericIntroConfig);
      setShowElectionIntro(false);
      setElectionIntroInitialized(false);
    }
    setShowTopicImportance(false);
    setHasReachedLastQuestion(false);
    setMinAnswersGate({ open: false, answered: 0, required: 0 });
    setShowDemographics(false);
    setTurnstileVerified(false);
    setShowTurnstileOverlay(false);
    setRestoredFromMnemonic(false);
    setRestoredVersion(null);
    setVersionMismatchType(null);
    dispatch({ type: "RESET" });
    window.scrollTo(0, 0);
  };

  // Handle continuing past generic intro to election selector
  const handleGenericIntroContinue = () => {
    setShowGenericIntro(false);
    window.scrollTo(0, 0);
  };

  // Handle selecting an election (from selector)
  const handleSelectElection = (electionId) => {
    setElection(electionId);
    // Check if we should show the election intro for this election
    const electionConfig = electionConfigs[electionId];
    if (shouldShowElectionIntro(electionConfig)) {
      setShowElectionIntro(true);
    }
    window.scrollTo(0, 0);
  };

  // Handle starting the quiz (from election intro)
  const handleStartQuiz = () => {
    setShowElectionIntro(false);
    window.scrollTo(0, 0);
  };

  // Restore quiz state from mnemonic phrase (e.g., from URL hash)
  const restoreFromMnemonic = async (phrase) => {
    const wordList = config?.mnemonicWordList;
    if (!phrase || !isValidMnemonic(phrase, wordList)) {
      console.warn("Invalid mnemonic phrase:", phrase);
      return false;
    }

    const decoded = decodeFromMnemonic(phrase, wordList);
    if (!decoded) {
      console.warn("Failed to decode mnemonic:", phrase);
      return false;
    }

    // Wait for questions to be loaded if not yet available
    if (state.questions.length === 0) {
      console.warn("Questions not loaded yet, cannot restore");
      return false;
    }

    // Restore state
    dispatch({ type: "RESTORE_STATE", payload: decoded });

    // Build user answers for results computation
    const userAnswers = buildUserAnswers(state.questions, decoded.answers, decoded.weights);

    // Fetch votes data and compute results
    const partyPromise = config.partyVotesUrl ? fetchJsonSafe(config.partyVotesUrl) : Promise.resolve(null);
    const presPromise = (config.questionTypes?.includes("presidential") && config.presVotesUrl)
      ? fetchJsonSafe(config.presVotesUrl)
      : Promise.resolve(null);

    try {
      const [partyData, presData] = await Promise.all([partyPromise, presPromise]);

      // Capture version from fetched votes data
      const fetchedVersion = partyData?.version || presData?.version || null;
      if (fetchedVersion) {
        setQuizDataVersion(fetchedVersion);
      }

      // Set restored version and compare
      const mnemonicVersion = decoded.version || null;
      setRestoredVersion(mnemonicVersion);

      // TODO: Re-enable after modal adjustments
      // Reject mnemonics from future versions (version higher than current)
      if (isVersionGreaterThan(mnemonicVersion, fetchedVersion)) {
        console.warn("Mnemonic version is newer than current quiz version:", mnemonicVersion, ">", fetchedVersion);
        return false;
      }

      // Determine version mismatch type
      const mismatchType = compareVersions(mnemonicVersion, fetchedVersion);
      setVersionMismatchType(mismatchType);

      const partyResults = partyData ? computeResultsFrom(partyData, "parties", userAnswers, { isImputedNeutral }) : [];
      const presidentialResults = presData ? computeResultsFrom(presData, "candidates", userAnswers, { isImputedNeutral }) : [];
      dispatch({
        type: "SET_COMPARISON_RESULTS",
        payload: {
          party_results: partyResults,
          presidential_results: presidentialResults
        }
      });
    } catch (err) {
      console.error("Error computing results from restored state:", err);
      return false;
    }

    // Update URL with mnemonic
    const currentHash = window.location.hash;
    const basePath = currentHash.split("?")[0] || "#/";
    const newUrl = `${window.location.origin}${window.location.pathname}${basePath}?r=${phrase}`;
    window.history.replaceState(null, "", newUrl);

    // Set UI state to show results
    setShowTopicImportance(false);
    setShowDemographics(false);
    setShowTurnstileOverlay(false);
    setTurnstileVerified(true);
    setShowGenericIntro(false);
    setShowElectionIntro(false);
    setRestoredFromMnemonic(true);

    // Scroll to top
    window.scrollTo(0, 0);

    return true;
  };

  const handleTurnstileSuccess = async (token, captchaType = 'turnstile') => {
    console.log(`${captchaType} verified, submitting form with token`);
    try {
      if (typeof window !== "undefined" && token) {
        window.sessionStorage.setItem("captcha_token", token);
        window.sessionStorage.setItem("turnstile_verified_at", String(Date.now()));
        window.sessionStorage.setItem("captcha_type", captchaType);
      }
    } catch (_) {}

    try {
      await submitAnswersToAPI(demographics, token, captchaType, restoredFromMnemonic, quizDataVersion);
    } catch (error) {
      console.error('Failed to submit form:', error);
    }

    setTurnstileVerified(true);
    setShowTurnstileOverlay(false);
    setShowDemographics(false);

    // Scroll to top when showing results
    window.scrollTo(0, 0);
  };

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

    // Branding (election-specific or defaults)
    // When useElectionBranding is false, always use neutral branding
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

    // Constants
    USER_TO_NUM,
    MIN_COMPARED,
  };

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
}

export { QuizContext };

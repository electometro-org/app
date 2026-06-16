import { useState } from "react";
import { decodeFromMnemonic, isValidMnemonic } from "../utils/mnemonicCodec";
import { buildUserAnswers } from "../services/resultsService";
import { compareVersions, isVersionGreaterThan } from "../utils/versionUtils";

/**
 * useMnemonicRestore
 * Manages: mnemonic decode/restore + version mismatch tracking
 *
 * Args:
 * - state: quiz state from useQuiz (for questions)
 * - dispatch: quiz dispatch from useQuiz
 * - config: election config (for mnemonicWordList)
 * - computeAndDispatchResults: callback from useResultsComputation
 * - setShowTopicImportance, setShowDemographics, setShowTurnstileOverlay: setters from related hooks
 * - setTurnstileVerified, submitAnswersToAPI: from useDemographicsAndSubmission
 * - setQuizDataVersion: from useResultsComputation
 *
 * Returns:
 * - restoredFromMnemonic
 * - setRestoredFromMnemonic
 * - restoredVersion
 * - versionMismatchType
 * - setVersionMismatchType
 * - restoreFromMnemonic(phrase)
 * - clearMnemonicFromUrl()
 * - reset()
 */
export function useMnemonicRestore({
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
}) {
  const [restoredFromMnemonic, setRestoredFromMnemonic] = useState(false);
  const [restoredVersion, setRestoredVersion] = useState(null);
  const [versionMismatchType, setVersionMismatchType] = useState(null);

  const clearMnemonicFromUrl = () => {
    const currentHash = window.location.hash;
    if (currentHash.includes("?r=")) {
      const basePath = currentHash.split("?")[0] || "#/";
      window.history.replaceState(null, "", `${window.location.pathname}${basePath}`);
    }
  };

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

    try {
      // Use computeAndDispatchResults to fetch and compute results
      await computeAndDispatchResults({
        questions: state.questions,
        answers: decoded.answers,
        weights: decoded.weights,
      });

      // Capture version info
      const mnemonicVersion = decoded.version || null;
      setRestoredVersion(mnemonicVersion);

      // TODO: Re-enable after modal adjustments
      // Reject mnemonics from future versions (version higher than current)
      // if (isVersionGreaterThan(mnemonicVersion, currentQuizDataVersion)) {
      //   console.warn("Mnemonic version is newer than current quiz version:", mnemonicVersion, ">", currentQuizDataVersion);
      //   return false;
      // }

      // Determine version mismatch type
      // const mismatchType = compareVersions(mnemonicVersion, currentQuizDataVersion);
      // setVersionMismatchType(mismatchType);
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
    setRestoredFromMnemonic(true);

    // Scroll to top
    window.scrollTo(0, 0);

    return true;
  };

  const reset = () => {
    setRestoredFromMnemonic(false);
    setRestoredVersion(null);
    setVersionMismatchType(null);
  };

  return {
    restoredFromMnemonic,
    setRestoredFromMnemonic,
    restoredVersion,
    versionMismatchType,
    setVersionMismatchType,
    restoreFromMnemonic,
    clearMnemonicFromUrl,
    reset,
  };
}

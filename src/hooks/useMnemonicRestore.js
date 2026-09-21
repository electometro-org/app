import { useState } from "react";
import { decodeFromMnemonic, isValidMnemonic } from "../utils/mnemonicCodec";
import { loadRegionalData, getRegion, buildRegionalQuestions } from "../services/regionalService";
import { isVersionGreaterThan, compareVersions } from "../utils/versionUtils";
import { trackEvent } from "../utils/analytics";

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
  setShowElectionIntro,
  setRegionId,
  quizDataVersion,
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

    const isRegional = !!config?.regional;
    const decoded = decodeFromMnemonic(phrase, wordList, { withRegion: isRegional });
    if (!decoded) {
      console.warn("Failed to decode mnemonic:", phrase);
      return false;
    }

    // Regional: the phrase carries the region, so load that region's questions first
    let questions = state.questions;
    if (isRegional) {
      try {
        const region = getRegion(await loadRegionalData(config.regionalVotesUrl), decoded.regionId);
        if (!region) {
          console.warn("Unknown region in mnemonic:", decoded.regionId);
          return false;
        }
        questions = buildRegionalQuestions(region);
      } catch (err) {
        console.error("Error loading region for mnemonic:", err);
        return false;
      }
      // regionId in the action lets useQuiz skip its own (state-resetting) load
      dispatch({ type: "SET_QUESTIONS", payload: questions, regionId: decoded.regionId });
      setRegionId?.(decoded.regionId);
    } else if (state.questions.length === 0) {
      // Wait for questions to be loaded if not yet available
      console.warn("Questions not loaded yet, cannot restore");
      return false;
    }

    // Restore state
    dispatch({ type: "RESTORE_STATE", payload: decoded });

    try {
      // Use computeAndDispatchResults to fetch and compute results
      const computeResult = await computeAndDispatchResults({
        questions,
        answers: decoded.answers,
        weights: decoded.weights,
        regionId: decoded.regionId,
      });

      // Use the version returned directly from the fetch — quizDataVersion prop
      // is stale at this point because setQuizDataVersion is async
      const currentVersion = computeResult?.version || quizDataVersion;

      // Capture version info
      const mnemonicVersion = decoded.version || null;
      setRestoredVersion(mnemonicVersion);

      // Reject mnemonics from future versions (version higher than current)
      if (isVersionGreaterThan(mnemonicVersion, currentVersion)) {
        console.warn("Mnemonic version is newer than current quiz version:", mnemonicVersion, ">", currentVersion);
        return false;
      }

      // Determine version mismatch type
      const mismatchType = compareVersions(mnemonicVersion, currentVersion);
      setVersionMismatchType(mismatchType);
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
    setShowElectionIntro?.(false);
    setShowTopicImportance(false);
    setShowDemographics(false);
    setShowTurnstileOverlay(false);
    setTurnstileVerified(true);
    setRestoredFromMnemonic(true);
    trackEvent("mnemonic_restored");
    trackEvent("results_viewed", { source: "mnemonic" });

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

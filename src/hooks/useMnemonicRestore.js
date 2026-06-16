import { useState } from "react";
import { decodeFromMnemonic, isValidMnemonic } from "../utils/mnemonicCodec";
import { compareVersions, isVersionGreaterThan } from "../utils/versionUtils";

/**
 * useMnemonicRestore - Mnemonic decode/restore + version mismatch
 * Takes state/dispatch, config, selectedRound, computeAndDispatchResults callback
 * Returns: { restoredFromMnemonic, restoredVersion, versionMismatchType, restoreFromMnemonic, clearMnemonicFromUrl }
 */
export function useMnemonicRestore(state, dispatch, config, selectedRound, computeAndDispatchResults, onUISetup) {
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

  const restoreFromMnemonic = async (phrase, quizDataVersion) => {
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

    // Wait for questions to be loaded
    if (state.questions.length === 0) {
      console.warn("Questions not loaded yet, cannot restore");
      return false;
    }

    // Restore state
    dispatch({ type: "RESTORE_STATE", payload: decoded });

    try {
      // Compute results with restored answers
      await computeAndDispatchResults(state.questions, decoded.answers, decoded.weights, selectedRound);

      // Capture version from fetched votes data (handled in computeAndDispatchResults)
      const mnemonicVersion = decoded.version || null;
      setRestoredVersion(mnemonicVersion);

      // Check version compatibility
      if (isVersionGreaterThan(mnemonicVersion, quizDataVersion)) {
        console.warn("Mnemonic version is newer than current quiz version:", mnemonicVersion, ">", quizDataVersion);
        return false;
      }

      // Determine version mismatch type
      const mismatchType = compareVersions(mnemonicVersion, quizDataVersion);
      setVersionMismatchType(mismatchType);

      // Update URL with mnemonic
      const currentHash = window.location.hash;
      const basePath = currentHash.split("?")[0] || "#/";
      const newUrl = `${window.location.origin}${window.location.pathname}${basePath}?r=${phrase}`;
      window.history.replaceState(null, "", newUrl);

      // Set UI state to show results
      setRestoredFromMnemonic(true);
      onUISetup?.({
        showGenericIntro: false,
        showElectionIntro: false,
        showTopicImportance: false,
        showDemographics: false,
        showTurnstileOverlay: false,
        turnstileVerified: true,
      });

      window.scrollTo(0, 0);
      return true;
    } catch (err) {
      console.error("Error computing results from restored state:", err);
      return false;
    }
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
    setRestoredVersion,
    versionMismatchType,
    setVersionMismatchType,
    restoreFromMnemonic,
    clearMnemonicFromUrl,
    reset,
  };
}

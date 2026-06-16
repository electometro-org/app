import { useState, useEffect, useCallback } from "react";
import {
  preSelectedElectionId,
  showGenericIntro as showGenericIntroConfig,
  shouldShowElectionIntro
} from "../config/appConfig";

/**
 * useElectionFlow
 * Manages: election selection + intro flow
 *
 * Returns:
 * - election, setElection
 * - showGenericIntro, setShowGenericIntro
 * - showElectionIntro, setShowElectionIntro
 * - electionIntroInitialized
 * - handleGenericIntroContinue, handleSelectElection, handleStartQuiz
 * - reset()
 */
export function useElectionFlow() {
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

  // Initialize election intro for pre-selected election (if config is available)
  useEffect(() => {
    if (preSelectedElectionId && !electionIntroInitialized) {
      // shouldShowElectionIntro expects a config object; for pre-selected, we check the flag
      setShowElectionIntro(shouldShowElectionIntro({}));
      setElectionIntroInitialized(true);
    }
  }, [election, electionIntroInitialized]);

  const handleGenericIntroContinue = useCallback(() => {
    setShowGenericIntro(false);
    window.scrollTo(0, 0);
  }, []);

  const handleSelectElection = useCallback((electionId) => {
    setElection(electionId);
    window.scrollTo(0, 0);
  }, []);

  const handleStartQuiz = useCallback(() => {
    setShowElectionIntro(false);
    window.scrollTo(0, 0);
  }, []);

  const reset = useCallback(() => {
    if (preSelectedElectionId) {
      setShowElectionIntro(shouldShowElectionIntro({}));
    } else {
      setElection(null);
      setShowGenericIntro(showGenericIntroConfig);
      setShowElectionIntro(false);
      setElectionIntroInitialized(false);
    }
  }, []);

  return {
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
    reset,
  };
}

import { useState, useEffect } from "react";
import {
  preSelectedElectionId,
  showGenericIntro as showGenericIntroConfig,
  shouldShowElectionIntro,
} from "../config/appConfig";

/**
 * useElectionFlow - Election selection + intro flow
 * Returns: { election, setElection, showGenericIntro, showElectionIntro, electionIntroInitialized, handleGenericIntroContinue, handleSelectElection, handleStartQuiz }
 */
export function useElectionFlow(config, electionConfigs) {
  const [election, setElection] = useState(preSelectedElectionId);
  const [showGenericIntro, setShowGenericIntro] = useState(
    showGenericIntroConfig && !preSelectedElectionId
  );
  const [showElectionIntro, setShowElectionIntro] = useState(false);
  const [electionIntroInitialized, setElectionIntroInitialized] = useState(false);

  // Initialize election intro for pre-selected election once config is loaded
  useEffect(() => {
    if (preSelectedElectionId && config && !electionIntroInitialized) {
      setShowElectionIntro(shouldShowElectionIntro(config));
      setElectionIntroInitialized(true);
    }
  }, [config, electionIntroInitialized]);

  const handleGenericIntroContinue = () => {
    setShowGenericIntro(false);
    window.scrollTo(0, 0);
  };

  const handleSelectElection = (electionId) => {
    setElection(electionId);
    const electionConfig = electionConfigs[electionId];
    if (shouldShowElectionIntro(electionConfig)) {
      setShowElectionIntro(true);
    }
    window.scrollTo(0, 0);
  };

  const handleStartQuiz = () => {
    setShowElectionIntro(false);
    window.scrollTo(0, 0);
  };

  const reset = () => {
    if (preSelectedElectionId) {
      setShowElectionIntro(shouldShowElectionIntro(config));
    } else {
      setElection(null);
      setShowGenericIntro(showGenericIntroConfig);
      setShowElectionIntro(false);
      setElectionIntroInitialized(false);
    }
  };

  return {
    election,
    setElection,
    showGenericIntro,
    showElectionIntro,
    electionIntroInitialized,
    handleGenericIntroContinue,
    handleSelectElection,
    handleStartQuiz,
    reset,
  };
}

import { useRef, useState, useEffect } from "react";
import {
  isImputedNeutral as _isImputedNeutral,
  computeResultsFrom as _computeResultsFrom,
  buildUserAnswers as _buildUserAnswers,
  buildUserAnswersWithRaw as _buildUserAnswersWithRaw,
  partitionByCompared as _partitionByCompared,
  buildEntityDetails as _buildEntityDetails,
  filterCandidatesByRound as _filterCandidatesByRound,
  filterPartiesByRound as _filterPartiesByRound,
} from "../services/resultsService";
import { fetchJsonSafe as _fetchJsonSafe } from "../services/quizService";

const defaultServices = {
  fetchJsonSafe: _fetchJsonSafe,
  isImputedNeutral: _isImputedNeutral,
  computeResultsFrom: _computeResultsFrom,
  buildUserAnswers: _buildUserAnswers,
  buildUserAnswersWithRaw: _buildUserAnswersWithRaw,
  partitionByCompared: _partitionByCompared,
  buildEntityDetails: _buildEntityDetails,
  filterCandidatesByRound: _filterCandidatesByRound,
  filterPartiesByRound: _filterPartiesByRound,
};

export function useResultsComputation({ state, dispatch, config, selectedRound, services = defaultServices }) {
  const {
    fetchJsonSafe,
    isImputedNeutral,
    computeResultsFrom,
    buildUserAnswers,
    buildUserAnswersWithRaw,
    partitionByCompared,
    buildEntityDetails,
    filterCandidatesByRound,
    filterPartiesByRound,
  } = services;
  const votesDataCacheRef = useRef({});
  const [quizDataVersion, setQuizDataVersion] = useState(null);

  // Partitioned results
  const partyResultsAll = state.comparisonResults?.party_results || [];
  const presidentialResultsAll = state.comparisonResults?.presidential_results || [];
  const { complete: partyComplete, incomplete: partyIncomplete } = partitionByCompared(partyResultsAll);
  const { complete: presComplete, incomplete: presIncomplete } = partitionByCompared(presidentialResultsAll);

  // Clear cache when election/config changes
  useEffect(() => {
    votesDataCacheRef.current = {};
  }, [config?.partyVotesUrl, config?.presVotesUrl]);

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

  // Auto-open first entity when results change
  useEffect(() => {
    if (!state.comparisonResults || !config.resultTypes) return;

    const resultTypes = config.resultTypes || [];
    const defaultResultType = selectedRound?.defaultResultType ?? resultTypes[0];

    if (defaultResultType === "party") {
      const sorted = [...partyComplete, ...partyIncomplete].sort(sortByScoreDesc);
      const firstTop = sorted[0];
      if (firstTop) handleEntityClick(firstTop, "party");
      return;
    }

    if (defaultResultType === "presidentialCandidates") {
      const sorted = [...presComplete, ...presIncomplete].sort(sortByScoreDesc);
      const firstTop = sorted[0];
      if (firstTop) handleEntityClick(firstTop, "presidential");
    }
  }, [state.comparisonResults]);

  /**
   * Extract shared logic: build user answers, fetch votes, compute and dispatch results
   * Used by: topic-importance continue, mnemonic restore, and other entry points
   */
  const computeAndDispatchResults = async ({ questions, answers, weights }) => {
    const userAnswers = buildUserAnswers(questions, answers, weights);

    const partyPromise = config.partyVotesUrl ? fetchJsonSafe(config.partyVotesUrl) : Promise.resolve(null);
    const presPromise = (config.questionTypes?.includes("presidential") && config.presVotesUrl)
      ? fetchJsonSafe(config.presVotesUrl)
      : Promise.resolve(null);

    try {
      const [partyData, presData] = await Promise.all([partyPromise, presPromise]);

      // Capture version from fetched votes data
      if ((partyData?.version || presData?.version) && !quizDataVersion) {
        setQuizDataVersion(partyData?.version || presData?.version);
      }

      const partyResults = filterPartiesByRound(
        partyData ? computeResultsFrom(partyData, "parties", userAnswers, { isImputedNeutral }) : [],
        selectedRound
      );
      const presidentialResults = filterCandidatesByRound(
        presData ? computeResultsFrom(presData, "candidates", userAnswers, { isImputedNeutral }) : [],
        selectedRound
      );
      dispatch({
        type: "SET_COMPARISON_RESULTS",
        payload: {
          party_results: partyResults,
          presidential_results: presidentialResults
        }
      });
    } catch (err) {
      console.error("Error computing results:", err);
    }
  };

  const reset = () => {
    votesDataCacheRef.current = {};
    setQuizDataVersion(null);
  };

  return {
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
    reset,
  };
}

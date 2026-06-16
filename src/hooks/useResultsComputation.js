import { useRef, useState } from "react";
import {
  isImputedNeutral,
  computeResultsFrom,
  buildUserAnswers,
  buildUserAnswersWithRaw,
  partitionByCompared,
  buildEntityDetails,
  filterCandidatesByRound,
  filterPartiesByRound,
} from "../services/resultsService";
import { fetchJsonSafe } from "../services/quizService";

/**
 * useResultsComputation - Fetching votes data + computing comparison results
 * Takes state/dispatch, config, selectedRound
 * Returns: { 
 *   votesDataCacheRef, getVotesData, quizDataVersion, setQuizDataVersion,
 *   partyComplete, partyIncomplete, presComplete, presIncomplete,
 *   sortByScoreDesc, handleEntityClick, computeAndDispatchResults, reset
 * }
 */
export function useResultsComputation(state, dispatch, config, selectedRound) {
  const votesDataCacheRef = useRef({});
  const [quizDataVersion, setQuizDataVersion] = useState(null);

  // Partitioned results
  const partyResultsAll = state.comparisonResults?.party_results || [];
  const presidentialResultsAll = state.comparisonResults?.presidential_results || [];
  const { complete: partyComplete, incomplete: partyIncomplete } = partitionByCompared(partyResultsAll);
  const { complete: presComplete, incomplete: presIncomplete } = partitionByCompared(presidentialResultsAll);

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
          const entityDetailsPayload = buildEntityDetails(obj, userAnswersMap, type, data);
          dispatch({ type: "SET_ENTITY_DETAILS", payload: entityDetailsPayload });
        })
        .catch(err => console.error("Error fetching votes:", err));
    };

    if (type === "presidential") {
      fetchAndDispatchDetails(config.presVotesUrl, data =>
        entity.id ? data.candidates?.[entity.id] : data.candidates?.[entity.name]
      );
      return;
    }

    if (type === "party") {
      fetchAndDispatchDetails(config.partyVotesUrl, data =>
        entity.id ? data.parties?.[entity.id] : data.parties?.[entity.party]
      );
    }
  };

  /**
   * Compute results from user answers/weights and dispatch them
   * Used by both handleTopicImportanceContinue and restoreFromMnemonic
   */
  const computeAndDispatchResults = async (questions, answers, weights, round) => {
    const userAnswers = buildUserAnswers(questions, answers, weights);

    const partyPromise = config.partyVotesUrl ? fetchJsonSafe(config.partyVotesUrl) : Promise.resolve(null);
    const presPromise = (config.questionTypes?.includes("presidential") && config.presVotesUrl)
      ? fetchJsonSafe(config.presVotesUrl)
      : Promise.resolve(null);

    try {
      const [partyData, presData] = await Promise.all([partyPromise, presPromise]);

      // Capture version from fetched votes data
      const fetchedVersion = partyData?.version || presData?.version || null;
      if (fetchedVersion && !quizDataVersion) {
        setQuizDataVersion(fetchedVersion);
      }

      const partyResults = filterPartiesByRound(
        partyData ? computeResultsFrom(partyData, "parties", userAnswers, { isImputedNeutral }) : [],
        round
      );
      const presidentialResults = filterCandidatesByRound(
        presData ? computeResultsFrom(presData, "candidates", userAnswers, { isImputedNeutral }) : [],
        round
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
      throw err;
    }
  };

  const reset = () => {
    votesDataCacheRef.current = {};
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

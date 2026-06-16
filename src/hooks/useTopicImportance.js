import { useState, useMemo } from "react";

/**
 * useTopicImportance - Topic weighting
 * Takes state/dispatch, config, selectedRound, and a computeAndDispatchResults callback
 * Returns: { uniqueTopics, showTopicImportance, handleToggleTopicImportance, applyTopicImportanceToWeights, handleTopicImportanceContinue }
 */
export function useTopicImportance(state, dispatch, config, selectedRound, computeAndDispatchResults, onClearMnemonic) {
  const [showTopicImportance, setShowTopicImportance] = useState(false);

  // Compute unique topics from questions
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

  const handleToggleTopicImportance = (topicKey) => {
    onClearMnemonic?.();
    dispatch({ type: "TOGGLE_TOPIC_IMPORTANCE", topicKey });
  };

  const applyTopicImportanceToWeights = () => {
    state.questions.forEach((q, i) => {
      if (state.topicImportance[q.topic_key]) {
        dispatch({ type: "SET_WEIGHTS", index: i, weight: 2 });
      }
    });
  };

  const handleTopicImportanceContinue = () => {
    // Compute boosted weights synchronously
    const boostedWeights = state.weights.map((w, i) => {
      const q = state.questions[i];
      return (q && state.topicImportance[q.topic_key]) ? 2 : w;
    });

    // Apply topic importance to state (for UI consistency)
    applyTopicImportanceToWeights();
    setShowTopicImportance(false);

    // Use the callback to compute and dispatch results with boosted weights
    computeAndDispatchResults(state.questions, state.answers, boostedWeights, selectedRound);

    window.scrollTo(0, 0);
  };

  const reset = () => {
    setShowTopicImportance(false);
  };

  return {
    uniqueTopics,
    showTopicImportance,
    setShowTopicImportance,
    handleToggleTopicImportance,
    applyTopicImportanceToWeights,
    handleTopicImportanceContinue,
    reset,
  };
}

import { useState, useMemo } from "react";

/**
 * useTopicImportance
 * Manages: topic weighting UI + logic
 *
 * Args:
 * - state: quiz state from useQuiz (for questions, topicImportance, weights, answers)
 * - dispatch: quiz dispatch from useQuiz
 * - computeAndDispatchResults: callback that applies weights and fetches results
 *   - called by handleTopicImportanceContinue
 *
 * Returns:
 * - uniqueTopics
 * - showTopicImportance, setShowTopicImportance
 * - handleToggleTopicImportance
 * - applyTopicImportanceToWeights
 * - handleTopicImportanceContinue
 * - reset()
 */
export function useTopicImportance({ state, dispatch, computeAndDispatchResults }) {
  const [showTopicImportance, setShowTopicImportance] = useState(false);

  const clearMnemonicFromUrl = () => {
    const currentHash = window.location.hash;
    if (currentHash.includes("?r=")) {
      const basePath = currentHash.split("?")[0] || "#/";
      window.history.replaceState(null, "", `${window.location.pathname}${basePath}`);
    }
  };

  // Compute unique topics from questions for Topic Importance view
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

  // Apply topic importance: boost weights for questions with "very important" topics
  const applyTopicImportanceToWeights = () => {
    state.questions.forEach((q, i) => {
      if (state.topicImportance[q.topic_key]) {
        // Boost weight: 1 -> 2 for "very important" topics (doubles influence)
        dispatch({ type: "SET_WEIGHTS", index: i, weight: 2 });
      }
    });
  };

  // Handle toggling topic importance
  const handleToggleTopicImportance = (topicKey) => {
    clearMnemonicFromUrl();
    dispatch({ type: "TOGGLE_TOPIC_IMPORTANCE", topicKey });
  };

  // Handle continuing from Topic Importance view to Demographics
  // Applies boosted weights and fetches results
  const handleTopicImportanceContinue = () => {
    applyTopicImportanceToWeights();
    setShowTopicImportance(false);

    // Call the callback to compute results with boosted weights
    computeAndDispatchResults({
      questions: state.questions,
      answers: state.answers,
      weights: state.weights.map((w, i) => {
        const q = state.questions[i];
        return (q && state.topicImportance[q.topic_key]) ? 2 : w;
      }),
    });

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

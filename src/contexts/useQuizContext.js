import { useElectionContext } from "./ElectionContext";
import { useQuizFlowContext } from "./QuizFlowContext";
import { useResultsContext } from "./ResultsContext";
import { useUIContext } from "./UIContext";

// Composite hook for components that need values from multiple contexts.
// For new components, prefer the focused hooks (useElectionContext,
// useQuizFlowContext, useResultsContext, useUIContext).
export function useQuizContext() {
  return {
    ...useElectionContext(),
    ...useQuizFlowContext(),
    ...useResultsContext(),
    ...useUIContext(),
  };
}
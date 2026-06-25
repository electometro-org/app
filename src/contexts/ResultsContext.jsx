import { createContext, useContext } from "react";

export const ResultsContext = createContext(null);

export function useResultsContext() {
  const ctx = useContext(ResultsContext);
  if (!ctx) throw new Error("useResultsContext must be used within a QuizProvider");
  return ctx;
}

import { createContext, useContext } from "react";

export const ElectionContext = createContext(null);

export function useElectionContext() {
  const ctx = useContext(ElectionContext);
  if (!ctx) throw new Error("useElectionContext must be used within a QuizProvider");
  return ctx;
}

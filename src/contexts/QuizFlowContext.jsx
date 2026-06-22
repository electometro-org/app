import { createContext, useContext } from "react";

export const QuizFlowContext = createContext(null);

export function useQuizFlowContext() {
  const ctx = useContext(QuizFlowContext);
  if (!ctx) throw new Error("useQuizFlowContext must be used within a QuizProvider");
  return ctx;
}

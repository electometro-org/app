import { useContext } from "react";
import { QuizContext } from "./QuizContext";

export function useQuizContext() {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error("useQuizContext must be used within a QuizProvider");
  }
  return context;
}
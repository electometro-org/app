import { createContext, useContext } from "react";

export const UIContext = createContext(null);

export function useUIContext() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUIContext must be used within a QuizProvider");
  return ctx;
}

// src/components/BackToQuizButton.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useTranslate } from "@tolgee/react";
import { useQuizContext } from "../contexts/useQuizContext";

/**
 * Maps quiz phases to translation key suffixes
 */
const PHASE_KEYS = {
  intro: "intro",
  "election-intro": "intro",
  quiz: "quiz",
  "topic-importance": "quiz",
  demographics: "quiz",
  results: "results",
  loading: "quiz",
};

export default function BackToQuizButton({ inline = false }) {
  const { t } = useTranslate();
  const { state, showGenericIntro, showElectionIntro, showTopicImportance, showDemographics, turnstileVerified } = useQuizContext();

  // Determine current phase (simplified version of getQuizPhase from WidgetContext)
  let phase = "quiz";
  if (showGenericIntro) phase = "intro";
  else if (showElectionIntro) phase = "election-intro";
  else if (state.comparisonResults) phase = "results";
  else if (showTopicImportance || showDemographics) phase = "quiz";

  const phaseKey = PHASE_KEYS[phase] || "quiz";
  const label = t(`nav.backTo.${phaseKey}`);

  const button = (
    <Link
      to="/"
      className="back-to-survey-button"
      style={{ textDecoration: "none" }}
    >
      {label}
    </Link>
  );

  if (inline) {
    return button;
  }

  return (
    <div style={{ marginTop: "40px", textAlign: "center" }}>
      {button}
    </div>
  );
}
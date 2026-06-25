// src/components/BackToQuizButton.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useTranslate } from "@tolgee/react";
import { useQuizFlowContext } from "../contexts/QuizFlowContext";
import { useUIContext } from "../contexts/UIContext";

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
  const { state } = useQuizFlowContext();
  const { showGenericIntro, showElectionIntro, showTopicImportance, showDemographics } = useUIContext();

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
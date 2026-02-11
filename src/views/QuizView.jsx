import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslate } from "@tolgee/react";
import { BrandLogo } from "../components/BrandImage";
import { DockingZone } from "../widgets";

export default function QuizView({
  question,
  displayIndex,
  totalQuestions,
  selectedAnswer,
  hoveredOption,
  isFirstQuestion,
  isLastQuestion,
  hasSeenQuestion,
  branding,
  onAnswer,
  onSkip,
  onGoBack,
  onHover,
  onEndQuiz,
  canFinishQuizNow,
  minAnswersGate,
  onCloseMinAnswersGate,
  onGoToNextUnanswered,
}) {
  const { t } = useTranslate();
  const [buttonsBlocked, setButtonsBlocked] = useState(!hasSeenQuestion);
  const [clickedOption, setClickedOption] = useState(null);
  const minAnswersTitle = t("quiz.minAnswersRequiredTitle");
  const minAnswersActionClose = t("quiz.minAnswersRequiredClose");
  const minAnswersActionNextUnanswered = t("quiz.minAnswersRequiredNextUnanswered");
  const minAnswersBodyLine1Template = t("quiz.minAnswersRequiredBody1");
  const minAnswersBodyLine2Template = t("quiz.minAnswersRequiredBody2");
  const requiredText = String(minAnswersGate?.required ?? 0);
  const answeredText = String(minAnswersGate?.answered ?? 0);
  const renderBodyLine = (template, answeredClassName = "quiz-min-answers-answered") => {
    const withRequired = template.replace("[required]", requiredText);
    const parts = withRequired.split("[answered]");

    if (parts.length > 1) {
      return (
        <>
          {parts[0]}
          <span className={answeredClassName}>{answeredText}</span>
          {parts.slice(1).join("[answered]")}
        </>
      );
    }

    return withRequired;
  };

  // Block buttons briefly when question changes, but only for unseen questions
  useEffect(() => {
    setClickedOption(null); // Reset clicked state on question change
    if (hasSeenQuestion) {
      setButtonsBlocked(false);
      return;
    }
    setButtonsBlocked(true);
    const timer = setTimeout(() => {
      setButtonsBlocked(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [question.id, displayIndex, hasSeenQuestion]);

  const handleSkipOrFinish = () => {
    if (isLastQuestion) {
      onEndQuiz();
    } else {
      onSkip();
    }
  };

  return (
    <>
      <div className="quiz-header">
        <h3 id={"questions-progress-counter"}>{displayIndex} / {totalQuestions}</h3>
        <BrandLogo branding={branding} />
      </div>

      <DockingZone id="above-question" />

      <div className="question-content" key={question.id || displayIndex}>
        <div className="question-text-container">
          <h2>
            {question.question_key
              ? t(question.question_key)
              : question.question}
          </h2>
        </div>
      </div>

      <DockingZone id="below-question" />

      <div className="question-options" key={`options-${question.id || displayIndex}`}>
        {question.options.map((option, index) => (
          <button
            className={`option-button ${selectedAnswer === option && !clickedOption ? 'selected-answer' : ''} ${clickedOption === option ? 'just-clicked' : ''}`}
            key={index}
            onClick={() => {
              if (buttonsBlocked || clickedOption) return;
              setClickedOption(option);
              setTimeout(() => {
                onAnswer(option);
                // On last question, reset clickedOption so user can change their answer
                if (isLastQuestion) {
                  setClickedOption(null);
                }
              }, 150);
            }}
            onMouseEnter={() => onHover(option)}
            onMouseLeave={() => onHover(null)}
            disabled={buttonsBlocked}
            style={{
              opacity: buttonsBlocked ? 0.6 : 1,
              cursor: buttonsBlocked ? "wait" : "pointer"
            }}
          >
            {t(option)}
          </button>
        ))}
      </div>

      <DockingZone id="above-buttons" />

      <div>
        {!isFirstQuestion && (
          <button
            className="back-and-skip-buttons"
            onClick={onGoBack}
          >
            {t('common.back')}
          </button>
        )}
        <button
          className={`back-and-skip-buttons ${isLastQuestion && selectedAnswer ? 'end-survey-ready' : ''}`}
          onClick={handleSkipOrFinish}
          disabled={buttonsBlocked}
          style={{
            opacity: buttonsBlocked ? 0.6 : 1,
            cursor: buttonsBlocked ? "wait" : "pointer"
          }}
        >
          {isLastQuestion
            ? (selectedAnswer ? t('quiz.finishSurvey') : t('quiz.skipAndFinish'))
            : (selectedAnswer ? t('common.next') : t('common.skip'))}
        </button>
        {!isLastQuestion && canFinishQuizNow && (
          <button
            className="back-and-skip-buttons end-survey-ready"
            onClick={onEndQuiz}
            disabled={buttonsBlocked}
            style={{
              opacity: buttonsBlocked ? 0.6 : 1,
              cursor: buttonsBlocked ? "wait" : "pointer"
            }}
          >
            {t('quiz.finishSurvey')}
          </button>
        )}
      </div>

      <DockingZone id="below-buttons" />

      {minAnswersGate?.open && createPortal(
        <div className="quiz-min-answers-overlay" onClick={onCloseMinAnswersGate}>
          <div className="quiz-min-answers-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>
              {minAnswersTitle}
            </h3>
            <p>
              <span className="quiz-min-answers-line">
                {renderBodyLine(minAnswersBodyLine1Template)}
              </span>
              <span className="quiz-min-answers-line">
                {renderBodyLine(minAnswersBodyLine2Template, "quiz-min-answers-answered--bold")}
              </span>
            </p>
            <div className="quiz-min-answers-actions">
              <button
                className="back-and-skip-buttons end-survey-ready"
                onClick={onGoToNextUnanswered}
              >
                {minAnswersActionNextUnanswered}
              </button>
              <button
                className="quiz-min-answers-btn quiz-min-answers-btn--secondary"
                onClick={onCloseMinAnswersGate}
              >
                {minAnswersActionClose}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

import { useState, useEffect } from "react";
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
}) {
  const { t } = useTranslate();
  const [buttonsBlocked, setButtonsBlocked] = useState(!hasSeenQuestion);

  // Block buttons briefly when question changes, but only for unseen questions
  useEffect(() => {
    if (hasSeenQuestion) {
      setButtonsBlocked(false);
      return;
    }
    setButtonsBlocked(true);
    const timer = setTimeout(() => {
      setButtonsBlocked(false);
    }, 350);
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
            className="option-button"
            key={index}
            onClick={() => !buttonsBlocked && onAnswer(option)}
            onMouseEnter={() => onHover(option)}
            onMouseLeave={() => onHover(null)}
            disabled={buttonsBlocked}
            style={{
              backgroundColor:
                selectedAnswer === option || hoveredOption === option
                  ? "var(--buttonHover)"
                  : "var(--buttonColor)",
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
        <button
          className="back-and-skip-buttons"
          onClick={onGoBack}
          disabled={isFirstQuestion}
        >
          {t('common.back')}
        </button>
        <button
          className={`back-and-skip-buttons ${isLastQuestion && selectedAnswer ? 'end-survey-ready' : ''}`}
          onClick={handleSkipOrFinish}
          disabled={buttonsBlocked}
          style={{
            opacity: buttonsBlocked ? 0.6 : 1,
            cursor: buttonsBlocked ? "wait" : "pointer"
          }}
        >
          {isLastQuestion ? t('quiz.finishSurvey') : t('common.skip')}
        </button>
      </div>

      <DockingZone id="below-buttons" />
    </>
  );
}
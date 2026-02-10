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
  const [clickedOption, setClickedOption] = useState(null);

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
            className={`option-button ${selectedAnswer === option ? 'selected-answer' : ''} ${clickedOption === option ? 'just-clicked' : ''}`}
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
      </div>

      <DockingZone id="below-buttons" />
    </>
  );
}
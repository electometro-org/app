import { useTranslate } from "@tolgee/react";
import { BrandLogo } from "../components/BrandImage";
import { DockingZone } from "../widgets";

export default function QuizView({
  question,
  displayIndex,
  totalQuestions,
  selectedAnswer,
  weight,
  hoveredOption,
  isFirstQuestion,
  isLastQuestion,
  branding,
  onAnswer,
  onSkip,
  onGoBack,
  onWeightChange,
  onHover,
  onEndQuiz,
}) {
  const { t } = useTranslate();

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

      <div className="question-text-container">
        <h2>
          {question.question_key
            ? t(question.question_key)
            : question.question}
        </h2>
      </div>

      <DockingZone id="below-question" />

      <div>
        {question.options.map((option, index) => (
          <button
            className="option-button"
            key={index}
            onClick={() => onAnswer(option)}
            onMouseEnter={() => onHover(option)}
            onMouseLeave={() => onHover(null)}
            style={{
              backgroundColor:
                selectedAnswer === option || hoveredOption === option
                  ? "var(--buttonHover)"
                  : "var(--buttonColor)"
            }}
          >
            {t(option)}
          </button>
        ))}
      </div>

      <DockingZone id="above-buttons" />

      <div>
        <div className="importance-slider-container">
          <label>{t('quiz.importanceQuestion')}</label>
          <br />
            <span>{t('quiz.lowImportance')}</span>
            <input
              type="range"
              min="1"
              max="3"
              value={weight}
              onChange={(e) => onWeightChange(Number(e.target.value))}
            />
            <span>{t('quiz.highImportance')}</span>
        </div>
      </div>

      <div>
        <button
          className="back-and-skip-buttons"
          onClick={onGoBack}
          disabled={isFirstQuestion}
        >
          {t('common.back')}
        </button>
        <button
          className="back-and-skip-buttons"
          onClick={handleSkipOrFinish}
        >
          {isLastQuestion ? t('quiz.finishSurvey') : t('common.skip')}
        </button>
      </div>

      <DockingZone id="below-buttons" />
    </>
  );
}
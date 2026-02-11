import { useState, useEffect, useRef } from "react";
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
  hasReachedLastQuestion,
  minAnswersGate,
  onCloseMinAnswersGate,
  onGoToNextUnanswered,
}) {
  const { t } = useTranslate();
  const [buttonsBlocked, setButtonsBlocked] = useState(!hasSeenQuestion);
  const [clickedOption, setClickedOption] = useState(null);
  const [showChangeAnswerModal, setShowChangeAnswerModal] = useState(false);
  const [pendingChangedOption, setPendingChangedOption] = useState(null);
  const [navPulseAfterChange, setNavPulseAfterChange] = useState(false);
  const questionTitleRef = useRef(null);
  const minAnswersTitle = t("quiz.minAnswersRequiredTitle");
  const minAnswersActionClose = t("quiz.minAnswersRequiredClose");
  const minAnswersActionNextUnanswered = t("quiz.minAnswersRequiredNextUnanswered");
  const changeAnswerBodyTemplate = t("quiz.changeAnswerConfirmBody");
  const changeAnswerCancelText = t("quiz.changeAnswerConfirmCancel");
  const changeAnswerConfirmText = t("quiz.changeAnswerConfirmConfirm");
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
    setShowChangeAnswerModal(false);
    setPendingChangedOption(null);
    setNavPulseAfterChange(false);
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

  useEffect(() => {
    const fitQuestionIntoMobileBox = () => {
      const el = questionTitleRef.current;
      const container = el?.parentElement;
      if (!el || !container) return;

      // Keep desktop typography unchanged.
      if (window.innerWidth >= 768) {
        el.style.fontSize = "";
        el.style.lineHeight = "";
        return;
      }

      const START_FONT_REM = 1.28;
      const MIN_FONT_REM = 0.78;
      const STEP_REM = 0.02;
      const LINE_HEIGHT = 1.26;

      el.style.fontSize = `${START_FONT_REM}rem`;
      el.style.lineHeight = String(LINE_HEIGHT);

      let fontSize = START_FONT_REM;
      while (fontSize > MIN_FONT_REM && el.scrollHeight > container.clientHeight) {
        fontSize -= STEP_REM;
        el.style.fontSize = `${fontSize}rem`;
      }
    };

    const rafId = requestAnimationFrame(fitQuestionIntoMobileBox);
    window.addEventListener("resize", fitQuestionIntoMobileBox);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", fitQuestionIntoMobileBox);
    };
  }, [question.id, displayIndex, question.question, question.question_key, t]);

  const handleSkipOrFinish = () => {
    if (isLastQuestion) {
      onEndQuiz();
    } else {
      onSkip();
    }
  };

  const openChangeAnswerModal = (newOption) => {
    setPendingChangedOption(newOption);
    setShowChangeAnswerModal(true);
  };

  const closeChangeAnswerModal = () => {
    setShowChangeAnswerModal(false);
    setPendingChangedOption(null);
  };

  const confirmChangeAnswer = () => {
    if (!pendingChangedOption) return;
    const shouldAutoAdvance = !hasReachedLastQuestion;
    onAnswer(pendingChangedOption, { advance: shouldAutoAdvance });
    if (!shouldAutoAdvance) {
      setNavPulseAfterChange(true);
    }
    closeChangeAnswerModal();
  };

  const changeAnswerBody = changeAnswerBodyTemplate
    .replace("[previous]", selectedAnswer ? t(selectedAnswer) : "")
    .replace("[new]", pendingChangedOption ? t(pendingChangedOption) : "");
  const questionText = question.question_key ? t(question.question_key) : question.question;

  return (
    <>
      <div className="quiz-header">
        <h3 id={"questions-progress-counter"}>{displayIndex} / {totalQuestions}</h3>
        <BrandLogo branding={branding} />
      </div>

      <DockingZone id="above-question" />

      <div className="question-content" key={question.id || displayIndex}>
        <div className="question-text-container">
          <h2 ref={questionTitleRef}>{questionText}</h2>
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
              if (hasSeenQuestion && selectedAnswer && option !== selectedAnswer) {
                openChangeAnswerModal(option);
                return;
              }
              if (hasSeenQuestion && selectedAnswer && option === selectedAnswer) {
                return;
              }
              setClickedOption(option);
              setTimeout(() => {
                onAnswer(option, { advance: true });
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
            className={`back-and-skip-buttons ${navPulseAfterChange ? 'nav-attention-pulse' : ''}`}
            onClick={onGoBack}
          >
            {t('common.back')}
          </button>
        )}
        <button
          className={`back-and-skip-buttons ${isLastQuestion && selectedAnswer ? 'end-survey-ready' : ''} ${navPulseAfterChange ? 'nav-attention-pulse' : ''}`}
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

      {showChangeAnswerModal && createPortal(
        <div className="quiz-min-answers-overlay" onClick={closeChangeAnswerModal}>
          <div className="quiz-min-answers-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>{t("quiz.changeAnswerConfirmTitle")}</h3>
            <p>
              <span className="quiz-min-answers-line">{changeAnswerBody}</span>
            </p>
            <div className="quiz-min-answers-actions">
              <button
                className="quiz-min-answers-btn quiz-min-answers-btn--primary"
                onClick={confirmChangeAnswer}
              >
                {changeAnswerConfirmText}
              </button>
              <button
                className="quiz-min-answers-btn quiz-min-answers-btn--secondary"
                onClick={closeChangeAnswerModal}
              >
                {changeAnswerCancelText}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

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

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslate } from "@tolgee/react";
import { BrandLogo } from "../components/BrandImage";
import { DockingZone } from "../widgets";
import ProgressSegments from "../components/ProgressSegments";

export default function QuizView({
  question,
  displayIndex,
  totalQuestions,
  selectedAnswer,
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
  inlineProgress = false,
  topics = [],
  showTopicHeader = false,
}) {
  const { t } = useTranslate();
  const [buttonsBlocked, setButtonsBlocked] = useState(!hasSeenQuestion);
  const [clickedOption, setClickedOption] = useState(null);
  const [showChangeAnswerModal, setShowChangeAnswerModal] = useState(false);
  const [pendingChangedOption, setPendingChangedOption] = useState(null);
  const [navPulseAfterChange, setNavPulseAfterChange] = useState(false);
  const questionTitleRef = useRef(null);
  const justClearedRef = useRef(false);
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
    // Clearing an answer makes the question look unseen again; don't re-block the buttons for that
    if (hasSeenQuestion || justClearedRef.current) {
      justClearedRef.current = false;
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

      const START_FONT_REM = 1.05;
      const MIN_FONT_REM = 0.78;
      const STEP_REM = 0.02;
      const LINE_HEIGHT = 1.26;

      el.style.fontSize = `${START_FONT_REM}rem`;
      el.style.lineHeight = String(LINE_HEIGHT);

      let fontSize = START_FONT_REM;
      // Compare against the content box: the container can have padding (question box)
      const cs = window.getComputedStyle(container);
      const headerEl = container.querySelector(".question-topic-header");
      const availableHeight = container.clientHeight - parseFloat(cs.paddingTop || 0) - parseFloat(cs.paddingBottom || 0)
        - (headerEl ? headerEl.offsetHeight : 0);
      while (fontSize > MIN_FONT_REM && el.scrollHeight > availableHeight) {
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

  // "[k/n] Topic": position of this question's topic among all topics
  const topicIndex = topics.findIndex(topic => topic.topic_key === question.topic_key);
  const topicLabel = question.inlineText ? question.tema : t(question.topic_key, question.tema);
  const topicHeader = showTopicHeader && topicIndex >= 0 && topicLabel
    ? `[${topicIndex + 1}/${topics.length}] ${topicLabel}`
    : null;

  return (
    <>
      {!showTopicHeader && (
        <div className={`quiz-header ${branding?.title ? 'quiz-header--branded' : ''}`}>
          {branding?.title && <span className="quiz-header__title">{branding.title}</span>}
          <h3 id={"questions-progress-counter"}>{displayIndex} / {totalQuestions}</h3>
          <BrandLogo
            branding={branding}
            {...(branding?.title ? { width: 44, height: 44, className: "quiz-header__logo" } : {})}
          />
        </div>
      )}

      <DockingZone id="above-question" />

      <div className="question-content" key={question.id || displayIndex}>
        <div className="question-text-container">
          {showTopicHeader && (
            <div className="question-topic-header">
              <span className="question-topic-header__topic">{topicHeader}</span>
              <span className="question-topic-header__brand">
                {branding?.title && <span className="question-topic-header__title">{branding.title}</span>}
                <BrandLogo branding={branding} width={26} height={26} className="question-topic-header__logo" />
              </span>
            </div>
          )}
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
                // Clicking the selected answer again deselects it (no auto-advance)
                justClearedRef.current = true;
                onAnswer(null, { advance: false });
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

      {inlineProgress && (
        <ProgressSegments className="quiz-progress" current={displayIndex - 1} total={totalQuestions} />
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

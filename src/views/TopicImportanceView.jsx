import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslate } from "@tolgee/react";
import { BrandLogo } from "../components/BrandImage";

const MOBILE_CONTINUE_RESERVED_PX = 140;

function getScrollParent(element) {
  if (!element) return null;

  let parent = element.parentElement;
  while (parent && parent !== document.body) {
    const styles = window.getComputedStyle(parent);
    const overflowY = styles.overflowY;
    if (overflowY === "auto" || overflowY === "scroll") {
      return parent;
    }
    parent = parent.parentElement;
  }

  return document.scrollingElement || document.documentElement;
}

export default function TopicImportanceView({
  topics,           // [{ label, topic_key, questions: [{ id, question, question_key }] }]
  topicImportance,  // { [topic_key]: boolean }
  questions,        // Full questions array from state
  answers,          // User's answers array
  branding,
  onToggle,         // (topic_key) => void
  onContinue,
}) {
  const { t } = useTranslate();
  const [infoDialog, setInfoDialog] = useState(null);
  const [isClosing, setIsClosing] = useState(false);
  const [showContinue, setShowContinue] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const lastTopicRef = useRef(null);
  const showContinueRef = useRef(showContinue);

  useEffect(() => {
    showContinueRef.current = showContinue;
  }, [showContinue]);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // On mobile, show continue when the user reaches the end. We combine:
  // IntersectionObserver + scroll listeners on the actual scroll parent + polling
  // while hidden, because momentum scrolling on real devices can skip callbacks.
  useEffect(() => {
    // Desktop: always show continue button
    if (!isMobile) {
      setShowContinue(true);
      return;
    }

    // Mobile: hide until last topic is visible
    setShowContinue(false);

    const lastTopic = lastTopicRef.current;
    if (!lastTopic) return;

    let rafId = null;
    let pollId = null;
    let delayedCheckTimeoutId = null;
    const scrollParent = getScrollParent(lastTopic);
    const observerRoot = scrollParent === document.documentElement || scrollParent === document.body
      ? null
      : scrollParent;

    const checkShouldShow = () => {
      if (showContinueRef.current) return;

      const el = lastTopicRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
      const triggerLine = viewportHeight - MOBILE_CONTINUE_RESERVED_PX;

      // Show when the last item fully reaches the visible zone above the fixed continue bar.
      if (rect.bottom <= triggerLine) {
        setShowContinue(true);
        return;
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          // Guard against premature IO triggers in desktop responsive emulation.
          const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
          const triggerLine = viewportHeight - MOBILE_CONTINUE_RESERVED_PX;
          if (entry.boundingClientRect.bottom <= triggerLine) {
            setShowContinue(true);
          }
        });
      },
      {
        root: observerRoot,
        threshold: 0.01, // Trigger when any sliver of the last topic is visible
        rootMargin: '0px',
      }
    );

    observer.observe(lastTopic);

    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        checkShouldShow();
      });
    };

    const eventTarget = (scrollParent === document.documentElement || scrollParent === document.body)
      ? window
      : scrollParent;
    eventTarget.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    // Run once after mount and once after layout settles (RGL can settle asynchronously).
    onScroll();
    delayedCheckTimeoutId = setTimeout(onScroll, 180);

    // Poll while hidden as a final fallback for momentum scrolling on mobile browsers.
    pollId = setInterval(checkShouldShow, 250);

    return () => {
      observer.disconnect();
      eventTarget.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafId) cancelAnimationFrame(rafId);
      if (pollId) clearInterval(pollId);
      if (delayedCheckTimeoutId) clearTimeout(delayedCheckTimeoutId);
    };
  }, [isMobile, topics]);

  const openInfoDialog = (topic, e) => {
    e.stopPropagation();
    setInfoDialog(topic);
  };

  const closeInfoDialog = () => {
    setIsClosing(true);
    // Wait for animation to complete before removing
    setTimeout(() => {
      setInfoDialog(null);
      setIsClosing(false);
    }, 200); // Match animation duration
  };

  // Get user's answer for a question by its id
  const getUserAnswer = (questionId) => {
    const questionIndex = questions?.findIndex(q => q.id === questionId);
    if (questionIndex === -1 || questionIndex === undefined) return null;
    return answers?.[questionIndex] || null;
  };

  return (
    <div className="topic-importance-container">
      <div className="topic-importance-header">
        <BrandLogo branding={branding} />
        <h2>{t('topicImportance.title')}</h2>
        {/*<p>{t('topicImportance.instructions1')}</p>*/}
        <p>
          {t('topicImportance.instructions2a')}
          <span className="topic-info-btn inline-example" aria-hidden="true">
            <span className="info-icon">i</span>
          </span>
          {t('topicImportance.instructions2b')}
        </p>
      </div>

      <div className="topic-buttons-grid">
        {topics.map((topic, index) => (
          <div
            key={topic.topic_key}
            ref={index === topics.length - 1 ? lastTopicRef : null}
            className={`topic-button ${topicImportance[topic.topic_key] ? 'very-important' : ''}`}
            onClick={() => onToggle(topic.topic_key)}
          >
            <button
              className="topic-info-btn"
              onClick={(e) => openInfoDialog(topic, e)}
              aria-label={t('topicImportance.showQuestions')}
            >
              <span className="info-icon">i</span>
            </button>

            <span className="topic-label">
              {t(topic.topic_key) || topic.label}
            </span>

            <span className="topic-checkbox">
              <svg viewBox="0 0 24 24" className="checkbox-icon">
                {topicImportance[topic.topic_key] ? (
                  <>
                    <rect x="3" y="3" width="18" height="18" rx="3" className="checkbox-bg checked" />
                    <path d="M9 12l2 2 4-4" className="checkmark" />
                  </>
                ) : (
                  <rect x="3" y="3" width="18" height="18" rx="3" className="checkbox-bg" />
                )}
              </svg>
            </span>
          </div>
        ))}
      </div>

      {/* Continue button - use Portal on mobile for reliable fixed positioning */}
      {isMobile ? (
        createPortal(
          <div className={`topic-continue-wrapper ${showContinue ? 'visible' : 'hidden'}`}>
            <button className="continue-button" onClick={onContinue}>
              {t('common.continue')}
            </button>
          </div>,
          document.body
        )
      ) : (
        <div className={`topic-continue-wrapper ${showContinue ? 'visible' : 'hidden'}`}>
          <button className="continue-button" onClick={onContinue}>
            {t('common.continue')}
          </button>
        </div>
      )}

      {/* Info Dialog Overlay - Portal to body for full screen coverage */}
      {infoDialog && createPortal(
        <div className={`topic-info-overlay ${isClosing ? 'closing' : ''}`} onClick={closeInfoDialog}>
          <div className={`topic-info-dialog ${isClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
            <h3>{t(infoDialog.topic_key) || infoDialog.label}</h3>
            <div className="topic-questions-list">
              {infoDialog.questions.map((q, idx) => {
                const userAnswer = getUserAnswer(q.id);
                return (
                  <div key={q.id || idx} className="topic-question-item">
                    <span className="question-text">
                      {q.question_key ? t(q.question_key) : q.question}
                    </span>
                    {userAnswer && (
                      <div className="user-answer-container">
                        <span className="user-answer-label">{t('topicImportance.yourOpinion')}:</span>
                        <span className="user-answer">{t(userAnswer)}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <button className="dialog-close-btn" onClick={closeInfoDialog}>
              {t('common.close') || 'Cerrar'}
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

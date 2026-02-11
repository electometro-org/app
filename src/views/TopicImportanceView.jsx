import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslate } from "@tolgee/react";
import { BrandLogo } from "../components/BrandImage";

const MOBILE_CONTINUE_RESERVED_PX = 112;
const SCROLL_FAB_HIDE_OFFSET_PX = 88;

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
  const [showScrollDownFab, setShowScrollDownFab] = useState(false);
  const topicGridRef = useRef(null);
  const lastTopicRef = useRef(null);
  const showContinueRef = useRef(showContinue);
  const scrollParentRef = useRef(null);

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

      // Show when the last item reaches the visible zone above the fixed continue bar.
      if (rect.top <= triggerLine) {
        setShowContinue(true);
        return;
      }

      // Fallback: if user is near the bottom of the active scroll container.
      const scrollingElement =
        scrollParent === document.documentElement || scrollParent === document.body
          ? (document.scrollingElement || document.documentElement)
          : scrollParent;
      const remaining = scrollingElement.scrollHeight - (scrollingElement.scrollTop + scrollingElement.clientHeight);
      if (remaining <= 40) {
        setShowContinue(true);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShowContinue(true);
          }
        });
      },
      {
        root: observerRoot,
        threshold: 0.01, // Trigger when any sliver of the last topic is visible
        rootMargin: `0px 0px ${MOBILE_CONTINUE_RESERVED_PX}px 0px`,
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

  // Floating "scroll down" helper for topic grid.
  // Independent from continue logic so it cannot break continue visibility.
  useEffect(() => {
    if (!isMobile) {
      setShowScrollDownFab(false);
      return;
    }

    const lastTopic = lastTopicRef.current;
    if (!lastTopic) {
      setShowScrollDownFab(false);
      return;
    }

    const scrollParent = getScrollParent(lastTopic);
    scrollParentRef.current = scrollParent;
    const eventTarget = (scrollParent === document.documentElement || scrollParent === document.body)
      ? window
      : scrollParent;

    let rafId = null;
    let intervalId = null;

    const updateFabVisibility = () => {
      const el = lastTopicRef.current;
      if (!el) {
        setShowScrollDownFab(false);
        return;
      }

      const lastRect = el.getBoundingClientRect();
      let viewportBottom = window.innerHeight || document.documentElement.clientHeight || 0;

      if (scrollParent && scrollParent !== document.documentElement && scrollParent !== document.body) {
        const containerRect = scrollParent.getBoundingClientRect();
        viewportBottom = containerRect.bottom;
      }

      const reachedLastTopic = lastRect.bottom <= (viewportBottom - SCROLL_FAB_HIDE_OFFSET_PX);
      setShowScrollDownFab(!reachedLastTopic && !showContinueRef.current);
    };

    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        updateFabVisibility();
      });
    };

    eventTarget.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();
    intervalId = setInterval(updateFabVisibility, 250);

    return () => {
      eventTarget.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafId) cancelAnimationFrame(rafId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [isMobile, topics, showContinue]);

  const handleScrollDownFabClick = () => {
    const grid = topicGridRef.current;
    if (!grid) return;

    const scrollParent = scrollParentRef.current || getScrollParent(lastTopicRef.current);
    const topicButtons = Array.from(grid.querySelectorAll('.topic-button'));
    if (topicButtons.length === 0) return;

    let viewportTop = 0;
    let viewportBottom = window.innerHeight || document.documentElement.clientHeight || 0;
    if (scrollParent && scrollParent !== document.documentElement && scrollParent !== document.body) {
      const containerRect = scrollParent.getBoundingClientRect();
      viewportTop = containerRect.top;
      viewportBottom = containerRect.bottom;
    }
    const viewportHeight = Math.max(1, viewportBottom - viewportTop);
    const preferredStartLine = viewportTop + (viewportHeight * 0.62);

    // Prefer a deeper next target so each tap advances meaningfully.
    const nextTopic = topicButtons.find((button) => {
      const rect = button.getBoundingClientRect();
      return rect.top >= preferredStartLine;
    });

    if (nextTopic) {
      nextTopic.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    // Fallback to the first topic just below viewport top.
    const fallbackTopic = topicButtons.find((button) => {
      const rect = button.getBoundingClientRect();
      return rect.top > viewportTop + 8;
    });
    if (fallbackTopic) {
      fallbackTopic.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    if (lastTopicRef.current) {
      lastTopicRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  };

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
  const scrollDownTopicsLabel = t('topicImportance.seeMoreTopics');

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

      <div className="topic-buttons-grid" ref={topicGridRef}>
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

      {isMobile && showScrollDownFab && createPortal(
        <button
          className="topic-scroll-down-fab"
          type="button"
          onClick={handleScrollDownFabClick}
          aria-label={scrollDownTopicsLabel}
          title={scrollDownTopicsLabel}
        >
          <span>{scrollDownTopicsLabel}</span>
          <span aria-hidden="true">▼</span>
        </button>,
        document.body
      )}

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

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslate } from '@tolgee/react';
import { registerWidget } from '../registry';
import { useWidgetContext } from '../WidgetContext';
import { useQuizContext } from '../../contexts/useQuizContext';
import './OpinionButtons.css';

/**
 * OpinionButtons Widget
 *
 * Combined opinion + importance selection in a single interaction.
 * Each button is divided into 3 sections (left/center/right) that determine importance.
 * Clicking anywhere on a button records both the opinion AND the importance level.
 *
 * Config options:
 * - showEmojis: boolean (default: true) - Show emoji indicators on hover
 * - emojiNotImportant: string (default: '🤷')
 * - emojiNeutral: string (default: '🤔')
 * - emojiVeryImportant: string (default: '🚨')
 * - agreeColor: string (default: '#4a9c6d')
 * - neutralColor: string (default: '#6b7280')
 * - disagreeColor: string (default: '#c32e2e')
 * - blockDuration: number (default: 1000) - ms to block buttons on new question
 * - hoverReactivateDistance: number (default: 10) - pixels to move before hover reactivates after click
 */

// Map importance section (1, 2, 3) to weight value
const SECTION_TO_WEIGHT = {
  1: 0.5,  // Not Important
  2: 1,    // Normal
  3: 2,    // Very Important
};

// Map importance section to gauge value (for preview)
const SECTION_TO_GAUGE_VALUE = {
  1: 17,
  2: 50,
  3: 83,
};

function OpinionButtons({ config, quizState }) {
  const { t } = useTranslate();
  const quizContext = useQuizContext();
  const widgetContext = useWidgetContext();

  const {
    showEmojis = true,
    enableColorCycling = false,
    emojiNotImportant = '🤷',
    emojiNeutral = '🤔',
    emojiVeryImportant = '🚨',
    agreeColor = '#4a9c6d',
    neutralColor = '#6b7280',
    disagreeColor = '#c32e2e',
    blockDuration = 1000,
    hoverReactivateDistance = 10,
    touchConfirmDuration = 1000, // ms to hold before touch is confirmed
  } = config;

  const { currentQuestionIndex, questions, answers, weights, seenQuestions = [] } = quizState;
  const currentQuestion = questions?.[currentQuestionIndex];
  const currentAnswer = answers?.[currentQuestionIndex];
  const currentWeight = weights?.[currentQuestionIndex];
  const hasSeenQuestion = seenQuestions.includes(currentQuestionIndex);

  // Local hover state
  const [hoveredButton, setHoveredButton] = useState(null);
  const [hoveredSection, setHoveredSection] = useState(null);

  // Refs to track current hover during block (so timeout can read latest values)
  const hoveredButtonRef = useRef(null);
  const hoveredSectionRef = useRef(null);

  // Touch state for mobile
  const [touchedButton, setTouchedButton] = useState(null);
  const [touchedSection, setTouchedSection] = useState(null);
  const [isTouchConfirmed, setIsTouchConfirmed] = useState(false);
  const touchConfirmTimerRef = useRef(null);
  const touchStartSectionRef = useRef(null); // Track section when timer started

  // Block buttons briefly after question changes (gives user time to read)
  const [isBlocked, setIsBlocked] = useState(true); // Start blocked
  const prevQuestionIndexRef = useRef(null); // null to detect first mount

  // Track mouse position to require movement before re-enabling hover
  const lastClickPosRef = useRef(null);
  const [hasMovedEnough, setHasMovedEnough] = useState(false);

  // Track recent touch activity to ignore simulated mouse events
  const lastTouchTimeRef = useRef(0);
  const TOUCH_MOUSE_DELAY = 500; // ms to ignore mouse events after touch

  // Ref for the container to detect touch outside
  const containerRef = useRef(null);

  // Helper to get opinion type (needed in timeout callback)
  const getOpinionType = (option) => {
    const optionLower = typeof option === 'string' ? option.toLowerCase() : '';
    if (optionLower.includes('agree') && !optionLower.includes('disagree')) return 'agree';
    if (optionLower.includes('disagree')) return 'disagree';
    return 'neutral';
  };

  // Detect question changes and trigger block (only for unseen questions)
  useEffect(() => {
    if (currentQuestionIndex !== prevQuestionIndexRef.current) {
      prevQuestionIndexRef.current = currentQuestionIndex;

      // Only block if question hasn't been seen yet
      if (!hasSeenQuestion) {
        setIsBlocked(true);
        widgetContext.setGaugePreview?.(null);
      }

      // Reset movement requirement for new question
      setHasMovedEnough(true);
      lastClickPosRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionIndex, hasSeenQuestion]);

  // Handle the block timeout separately (survives StrictMode double-run)
  useEffect(() => {
    if (!isBlocked) return;

    const timeout = setTimeout(() => {
      setIsBlocked(false);

      // Mark question as seen after block ends (use ref for current value)
      quizContext.dispatch({ type: 'MARK_QUESTION_SEEN', payload: prevQuestionIndexRef.current });

      // Apply gauge preview based on current hover (read from refs for latest values)
      const button = hoveredButtonRef.current;
      const section = hoveredSectionRef.current;
      if (button && section) {
        const opinion = getOpinionType(button);
        const gaugeValue = SECTION_TO_GAUGE_VALUE[section];
        const color = opinion === 'agree' ? agreeColor : opinion === 'disagree' ? disagreeColor : neutralColor;

        widgetContext.setGaugePreview?.({
          value: gaugeValue,
          color,
          opinion,
          isPointerTingling: true,
          isColorCycling: false,
        });
      }
    }, blockDuration);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBlocked, blockDuration]);

  // Get the option buttons from the question
  const options = currentQuestion?.options || [];

  // Get color for opinion
  const getOpinionColor = (opinion) => {
    if (opinion === 'agree') return agreeColor;
    if (opinion === 'disagree') return disagreeColor;
    return neutralColor;
  };

  // Get selected section from current weight
  const getSelectedSection = () => {
    if (currentWeight === undefined || currentWeight === null) return null;
    if (currentWeight <= 0.5) return 1;
    if (currentWeight >= 2) return 3;
    return 2;
  };

  // Calculate section from mouse X position
  const getSectionFromEvent = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const width = rect.width;
    const xPercentage = (x / width) * 100;

    if (xPercentage < 33.3) return 1;
    if (xPercentage < 66.6) return 2;
    return 3;
  };

  // Handle button click - records both opinion AND importance
  const handleClick = useCallback((option, event) => {
    // Prevent clicks during block
    if (isBlocked) return;

    const section = getSectionFromEvent(event);
    const weight = SECTION_TO_WEIGHT[section];

    // Store click position and require mouse movement before hover reactivates
    lastClickPosRef.current = { x: event.clientX, y: event.clientY };
    setHasMovedEnough(false);

    // Update weight first, then answer (answer triggers navigation)
    quizContext.dispatch({ type: 'SET_WEIGHTS', index: currentQuestionIndex, weight });

    // Clear gauge preview (animations stop on click)
    widgetContext.setGaugePreview?.(null);

    // Call the answer handler (this may trigger navigation to next question)
    quizContext.handleAnswerClick(option);
  }, [quizContext, currentQuestionIndex, widgetContext, isBlocked]);

  // Handle mouse move on button
  const handleButtonMouseMove = useCallback((option, event) => {
    // Ignore simulated mouse events after touch
    if (Date.now() - lastTouchTimeRef.current < TOUCH_MOUSE_DELAY) return;

    const section = getSectionFromEvent(event);

    // Always update refs for timeout to read
    hoveredButtonRef.current = option;
    hoveredSectionRef.current = section;

    // During block, track hover state but don't show gauge effects
    if (isBlocked) {
      setHoveredSection(section);
      setHoveredButton(option);
      return;
    }

    // Check if mouse has moved enough from reference position
    if (!hasMovedEnough) {
      if (!lastClickPosRef.current) {
        // Set initial reference position on first mouse move
        lastClickPosRef.current = { x: event.clientX, y: event.clientY };
        return;
      }
      const dx = event.clientX - lastClickPosRef.current.x;
      const dy = event.clientY - lastClickPosRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance >= hoverReactivateDistance) {
        setHasMovedEnough(true);
        setHoveredButton(option); // Trigger hover now that we've moved enough
      } else {
        return; // Not moved enough yet, skip hover effects
      }
    }

    setHoveredSection(section);
    setHoveredButton(option);

    const opinion = getOpinionType(option);
    const gaugeValue = SECTION_TO_GAUGE_VALUE[section];
    const color = getOpinionColor(opinion);

    // Determine if hovering over a different button than selected
    const selectedOpinion = currentAnswer ? getOpinionType(currentAnswer) : null;
    const isDifferentButton = selectedOpinion && opinion !== selectedOpinion;

    // Always trigger pointer tingling on hover, color cycling only if enabled and different button
    const shouldTingle = true;
    const shouldCycleColors = enableColorCycling && isDifferentButton;

    // Update gauge preview with animations
    widgetContext.setGaugePreview?.({
      value: gaugeValue,
      color,
      opinion,
      isPointerTingling: shouldTingle,
      isColorCycleColors: shouldCycleColors,
    });
  }, [currentAnswer, enableColorCycling, widgetContext, isBlocked, hasMovedEnough]);

  // Handle mouse enter on button
  const handleButtonMouseEnter = useCallback((option, event) => {
    // Ignore simulated mouse events after touch
    if (Date.now() - lastTouchTimeRef.current < TOUCH_MOUSE_DELAY) return;

    // Calculate section from mouse position
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const xPercentage = (x / rect.width) * 100;
    const section = xPercentage < 33.3 ? 1 : xPercentage < 66.6 ? 2 : 3;

    // Always update refs for timeout to read
    hoveredButtonRef.current = option;
    hoveredSectionRef.current = section;

    // During block, track hover state
    if (isBlocked) {
      setHoveredButton(option);
      setHoveredSection(section);
      return;
    }
    if (!hasMovedEnough) return;
    setHoveredButton(option);
    setHoveredSection(section);
  }, [isBlocked, hasMovedEnough]);

  // Handle mouse leave from container
  const handleContainerMouseLeave = useCallback(() => {
    setHoveredButton(null);
    setHoveredSection(null);
    hoveredButtonRef.current = null;
    hoveredSectionRef.current = null;

    // Clear gauge preview (stops animations)
    widgetContext.setGaugePreview?.(null);
  }, [widgetContext]);

  // Calculate section from touch position on a button
  const getSectionFromTouch = useCallback((touch, buttonElement) => {
    const rect = buttonElement.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const xPercentage = (x / rect.width) * 100;

    // Check if touch is within button bounds
    if (touch.clientX < rect.left || touch.clientX > rect.right ||
        touch.clientY < rect.top || touch.clientY > rect.bottom) {
      return null; // Touch is outside button
    }

    if (xPercentage < 33.3) return 1;
    if (xPercentage < 66.6) return 2;
    return 3;
  }, []);

  // Clear touch confirmation timer
  const clearTouchConfirmTimer = useCallback(() => {
    if (touchConfirmTimerRef.current) {
      clearTimeout(touchConfirmTimerRef.current);
      touchConfirmTimerRef.current = null;
    }
  }, []);

  // Start touch confirmation timer
  const startTouchConfirmTimer = useCallback((section) => {
    clearTouchConfirmTimer();
    touchStartSectionRef.current = section;

    touchConfirmTimerRef.current = setTimeout(() => {
      // Only confirm if still on the same section
      if (touchStartSectionRef.current === section) {
        setIsTouchConfirmed(true);
      }
    }, touchConfirmDuration);
  }, [touchConfirmDuration, clearTouchConfirmTimer]);

  // Handle touch start on button
  const handleTouchStart = useCallback((option, event) => {
    if (isBlocked) return;

    event.preventDefault(); // Prevent mouse events from firing
    lastTouchTimeRef.current = Date.now(); // Track touch time to ignore simulated mouse events

    // Clear any hover state when touch starts
    setHoveredButton(null);
    setHoveredSection(null);
    hoveredButtonRef.current = null;
    hoveredSectionRef.current = null;

    const touch = event.touches[0];
    const buttonElement = event.currentTarget;
    const section = getSectionFromTouch(touch, buttonElement);

    if (section) {
      setTouchedButton(option);
      setTouchedSection(section);
      setIsTouchConfirmed(false);
      startTouchConfirmTimer(section);

      // Update gauge preview
      const opinion = getOpinionType(option);
      const gaugeValue = SECTION_TO_GAUGE_VALUE[section];
      const color = opinion === 'agree' ? agreeColor : opinion === 'disagree' ? disagreeColor : neutralColor;

      widgetContext.setGaugePreview?.({
        value: gaugeValue,
        color,
        opinion,
        isPointerTingling: true,
        isColorCycling: false,
      });
    }
  }, [isBlocked, getSectionFromTouch, startTouchConfirmTimer, getOpinionType, agreeColor, disagreeColor, neutralColor, widgetContext]);

  // Handle touch move on button
  const handleTouchMove = useCallback((option, event) => {
    if (!touchedButton) return;

    const touch = event.touches[0];
    const buttonElement = event.currentTarget;
    const section = getSectionFromTouch(touch, buttonElement);

    if (section === null) {
      // Touch moved outside button - cancel interaction
      clearTouchConfirmTimer();
      setTouchedButton(null);
      setTouchedSection(null);
      setIsTouchConfirmed(false);
      widgetContext.setGaugePreview?.(null);
      return;
    }

    // If section changed, restart the confirmation timer
    if (section !== touchedSection) {
      setTouchedSection(section);
      setIsTouchConfirmed(false);
      startTouchConfirmTimer(section);

      // Update gauge preview for new section
      const opinion = getOpinionType(option);
      const gaugeValue = SECTION_TO_GAUGE_VALUE[section];
      const color = opinion === 'agree' ? agreeColor : opinion === 'disagree' ? disagreeColor : neutralColor;

      widgetContext.setGaugePreview?.({
        value: gaugeValue,
        color,
        opinion,
        isPointerTingling: true,
        isColorCycling: false,
      });
    }
  }, [touchedButton, touchedSection, getSectionFromTouch, clearTouchConfirmTimer, startTouchConfirmTimer, getOpinionType, agreeColor, disagreeColor, neutralColor, widgetContext]);

  // Handle touch end
  const handleTouchEnd = useCallback((option, event) => {
    event.preventDefault();
    lastTouchTimeRef.current = Date.now(); // Track touch time to ignore simulated mouse events
    clearTouchConfirmTimer();

    if (isTouchConfirmed && touchedButton && touchedSection) {
      // Record the answer
      const weight = SECTION_TO_WEIGHT[touchedSection];
      quizContext.dispatch({ type: 'SET_WEIGHTS', index: currentQuestionIndex, weight });
      widgetContext.setGaugePreview?.(null);
      quizContext.handleAnswerClick(option);
    }

    // Reset touch state
    setTouchedButton(null);
    setTouchedSection(null);
    setIsTouchConfirmed(false);
    widgetContext.setGaugePreview?.(null);
  }, [isTouchConfirmed, touchedButton, touchedSection, clearTouchConfirmTimer, quizContext, currentQuestionIndex, widgetContext]);

  // Handle touch cancel (e.g., phone call interrupts)
  const handleTouchCancel = useCallback(() => {
    lastTouchTimeRef.current = Date.now();
    clearTouchConfirmTimer();
    setTouchedButton(null);
    setTouchedSection(null);
    setIsTouchConfirmed(false);
    widgetContext.setGaugePreview?.(null);
  }, [clearTouchConfirmTimer, widgetContext]);

  // Cleanup touch timer on unmount
  useEffect(() => {
    return () => clearTouchConfirmTimer();
  }, [clearTouchConfirmTimer]);

  // Document-level touchend to catch touch ending outside buttons
  useEffect(() => {
    const handleDocumentTouchEnd = (event) => {
      // Only clean up if touch ended outside our container
      if (touchedButton && containerRef.current && !containerRef.current.contains(event.target)) {
        lastTouchTimeRef.current = Date.now();
        clearTouchConfirmTimer();
        setTouchedButton(null);
        setTouchedSection(null);
        setIsTouchConfirmed(false);
        widgetContext.setGaugePreview?.(null);
      }
    };

    document.addEventListener('touchend', handleDocumentTouchEnd);
    document.addEventListener('touchcancel', handleDocumentTouchEnd);

    return () => {
      document.removeEventListener('touchend', handleDocumentTouchEnd);
      document.removeEventListener('touchcancel', handleDocumentTouchEnd);
    };
  }, [touchedButton, clearTouchConfirmTimer, widgetContext]);

  if (!currentQuestion || options.length === 0) {
    return null;
  }

  const selectedSection = getSelectedSection();

  return (
    <div
      ref={containerRef}
      className="opinion-buttons"
      onMouseLeave={handleContainerMouseLeave}
    >
      {options.map((option, index) => {
        const opinion = getOpinionType(option);
        const isSelected = currentAnswer === option;
        const isHovered = hoveredButton === option && !isBlocked;
        const isTouched = touchedButton === option;
        const isActive = isHovered || isTouched; // Either hover or touch activates the button

        return (
          <button
            key={index}
            data-opinion={opinion}
            className={`opinion-button ${isSelected ? 'opinion-button--selected' : ''} ${isHovered ? 'opinion-button--hovered' : ''} ${isTouched ? 'opinion-button--touched' : ''} ${isTouchConfirmed && isTouched ? 'opinion-button--touch-confirmed' : ''} ${isBlocked ? 'opinion-button--blocked' : ''}`}
            onClick={(e) => handleClick(option, e)}
            onMouseMove={(e) => handleButtonMouseMove(option, e)}
            onMouseEnter={(e) => handleButtonMouseEnter(option, e)}
            onTouchStart={(e) => handleTouchStart(option, e)}
            onTouchMove={(e) => handleTouchMove(option, e)}
            onTouchEnd={(e) => handleTouchEnd(option, e)}
            onTouchCancel={handleTouchCancel}
            onContextMenu={(e) => e.preventDefault()}
          >
            {/* Selected state background (when not hovered/touched) */}
            {isSelected && !isActive && (
              <div
                className="opinion-button__highlight opinion-button__highlight--base"
                data-opinion={opinion}
              />
            )}

            {/* Hovered state (desktop) */}
            {isHovered && (
              <>
                {/* Moving highlight following cursor */}
                {hoveredSection && (
                  <div
                    className="opinion-button__highlight opinion-button__highlight--section"
                    data-opinion={opinion}
                    style={{ left: `${(hoveredSection - 1) * 33.33}%` }}
                  />
                )}

                {/* Intense highlight for selected section */}
                {isSelected && selectedSection && (
                  <div
                    className="opinion-button__highlight opinion-button__highlight--selected-section"
                    data-opinion={opinion}
                    style={{ left: `${(selectedSection - 1) * 33.33}%` }}
                  />
                )}
              </>
            )}

            {/* Touched state (mobile) */}
            {isTouched && (
              <>
                {/* Highlight for touched section - pulsates until confirmed */}
                {touchedSection && (
                  <div
                    className={`opinion-button__highlight opinion-button__highlight--section ${!isTouchConfirmed ? 'opinion-button__highlight--pulsating' : 'opinion-button__highlight--confirmed'}`}
                    data-opinion={opinion}
                    style={{ left: `${(touchedSection - 1) * 33.33}%` }}
                  />
                )}

                {/* Intense highlight for selected section (if already answered this question) */}
                {isSelected && selectedSection && (
                  <div
                    className="opinion-button__highlight opinion-button__highlight--selected-section"
                    data-opinion={opinion}
                    style={{ left: `${(selectedSection - 1) * 33.33}%` }}
                  />
                )}
              </>
            )}

            {/* Emoji indicators on hover or touch */}
            {showEmojis && isActive && (
              <>
                <div className="opinion-button__divider opinion-button__divider--left" />
                <div className="opinion-button__divider opinion-button__divider--right" />
                <span className="opinion-button__emoji opinion-button__emoji--left">{emojiNotImportant}</span>
                <span className="opinion-button__emoji opinion-button__emoji--center">{emojiNeutral}</span>
                <span className="opinion-button__emoji opinion-button__emoji--right">{emojiVeryImportant}</span>
              </>
            )}

            {/* Button text */}
            <span className={`opinion-button__text ${isActive ? 'opinion-button__text--hidden' : ''}`}>
              {t(option)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

registerWidget({
  id: 'opinion-buttons',
  component: OpinionButtons,
  defaults: {
    draggable: false,
    showOnPhase: ['quiz'],
    showEmojis: true,
  },
});

export default OpinionButtons;
import React, { useState, useCallback } from 'react';
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
  } = config;

  const { currentQuestionIndex, questions, answers, weights } = quizState;
  const currentQuestion = questions?.[currentQuestionIndex];
  const currentAnswer = answers?.[currentQuestionIndex];
  const currentWeight = weights?.[currentQuestionIndex];

  // Local hover state
  const [hoveredButton, setHoveredButton] = useState(null);
  const [hoveredSection, setHoveredSection] = useState(null);

  // Get the option buttons from the question
  const options = currentQuestion?.options || [];

  // Map option to opinion type
  const getOpinionType = (option) => {
    const optionLower = typeof option === 'string' ? option.toLowerCase() : '';
    if (optionLower.includes('agree') && !optionLower.includes('disagree')) return 'agree';
    if (optionLower.includes('disagree')) return 'disagree';
    if (optionLower.includes('neutral')) return 'neutral';
    return 'neutral'; // fallback
  };

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
    const section = getSectionFromEvent(event);
    const weight = SECTION_TO_WEIGHT[section];

    // Update weight first, then answer (answer triggers navigation)
    quizContext.dispatch({ type: 'SET_WEIGHTS', index: currentQuestionIndex, weight });

    // Clear gauge preview (animations stop on click)
    widgetContext.setGaugePreview?.(null);

    // Call the answer handler (this may trigger navigation to next question)
    quizContext.handleAnswerClick(option);
  }, [quizContext, currentQuestionIndex, widgetContext]);

  // Handle mouse move on button
  const handleButtonMouseMove = useCallback((option, event) => {
    const section = getSectionFromEvent(event);
    setHoveredSection(section);

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
      isColorCycling: shouldCycleColors,
    });
  }, [currentAnswer, enableColorCycling, widgetContext]);

  // Handle mouse enter on button
  const handleButtonMouseEnter = useCallback((option) => {
    setHoveredButton(option);
  }, []);

  // Handle mouse leave from container
  const handleContainerMouseLeave = useCallback(() => {
    setHoveredButton(null);
    setHoveredSection(null);

    // Clear gauge preview (stops animations)
    widgetContext.setGaugePreview?.(null);
  }, [widgetContext]);

  if (!currentQuestion || options.length === 0) {
    return null;
  }

  const selectedSection = getSelectedSection();

  return (
    <div
      className="opinion-buttons"
      onMouseLeave={handleContainerMouseLeave}
    >
      {options.map((option, index) => {
        const opinion = getOpinionType(option);
        const isSelected = currentAnswer === option;
        const isHovered = hoveredButton === option;

        return (
          <button
            key={index}
            data-opinion={opinion}
            className={`opinion-button ${isSelected ? 'opinion-button--selected' : ''} ${isHovered ? 'opinion-button--hovered' : ''}`}
            onClick={(e) => handleClick(option, e)}
            onMouseMove={(e) => handleButtonMouseMove(option, e)}
            onMouseEnter={() => handleButtonMouseEnter(option)}
          >
            {/* Selected state background (when not hovered) */}
            {isSelected && !isHovered && (
              <div
                className="opinion-button__highlight opinion-button__highlight--base"
                data-opinion={opinion}
              />
            )}

            {/* Hovered state */}
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

            {/* Emoji indicators on hover */}
            {showEmojis && isHovered && (
              <>
                <div className="opinion-button__divider opinion-button__divider--left" />
                <div className="opinion-button__divider opinion-button__divider--right" />
                <span className="opinion-button__emoji opinion-button__emoji--left">{emojiNotImportant}</span>
                <span className="opinion-button__emoji opinion-button__emoji--center">{emojiNeutral}</span>
                <span className="opinion-button__emoji opinion-button__emoji--right">{emojiVeryImportant}</span>
              </>
            )}

            {/* Button text */}
            <span className={`opinion-button__text ${isHovered ? 'opinion-button__text--hidden' : ''}`}>
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
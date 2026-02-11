import React from 'react';
import { registerWidget } from '../registry';
import './ProgressIndicator.css';

/**
 * ProgressIndicator Widget
 *
 * Shows quiz progress in various styles.
 *
 * Config options:
 * - style: 'bar' | 'dots' | 'percentage' | 'fraction' (default: 'bar')
 */
function ProgressIndicator({ config, quizState }) {
  const { style = 'bar' } = config;
  const { currentQuestionIndex, totalQuestions } = quizState;

  if (totalQuestions <= 0) {
    return null;
  }

  const progressPercentage = (currentQuestionIndex / totalQuestions) * 100;
  const displayIndex = currentQuestionIndex + 1;

  const renderContent = () => {
    switch (style) {
      case 'dots': {
        const dotsPerRow = Math.ceil(totalQuestions / 2);
        return (
          <div className="progress-dots-strip">
            <div
              className="progress-dots"
              style={{ '--dots-per-row': dotsPerRow }}
              aria-label={`Progress: ${currentQuestionIndex} of ${totalQuestions} steps completed.`}
            >
              {Array.from({ length: totalQuestions }, (_, i) => {
                const isCompleted = i < currentQuestionIndex;
                const isCurrent = i === currentQuestionIndex;
                return (
                  <div
                    key={i}
                    role="img"
                    aria-label={
                      isCompleted
                        ? `Step ${i + 1} completed`
                        : isCurrent
                          ? `Current step ${i + 1}`
                          : `Step ${i + 1}`
                    }
                    className={`progress-dot ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                  />
                );
              })}
            </div>
          </div>
        );
      }

      case 'percentage':
        return (
          <div className="progress-percentage">
            {Math.round(progressPercentage)}%
          </div>
        );

      case 'fraction':
        return (
          <div className="progress-fraction">
            <span className="progress-fraction-current">{currentQuestionIndex}</span>
            <span className="progress-fraction-separator"> / </span>
            <span className="progress-fraction-total">{totalQuestions}</span>
          </div>
        );

      case 'bar':
      default:
        return (
          <div className="progress-bar-container">
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="progress-bar-labels">
              <span className="progress-bar-label">
                Question {displayIndex} of {totalQuestions}
              </span>
              <span className="progress-bar-percent">
                {Math.round(progressPercentage)}%
              </span>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`progress-indicator progress-indicator--${style}`}>
      {renderContent()}
    </div>
  );
}

// Register with defaults
registerWidget({
  id: 'progress-indicator',
  component: ProgressIndicator,
  defaults: {
    draggable: true,
    defaultSlot: 'top',
    style: 'bar',
  },
});

export default ProgressIndicator;

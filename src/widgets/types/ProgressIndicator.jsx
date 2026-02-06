import React, { useMemo } from 'react';
import { registerWidget } from '../registry';
import './ProgressIndicator.css';

/**
 * ProgressIndicator Widget
 *
 * Shows quiz progress as bar, dots, percentage, or fraction.
 * Configurable via config.style: 'bar' | 'dots' | 'percentage' | 'fraction'
 */
function ProgressIndicator({ config, quizState }) {
  const { currentQuestionIndex, totalQuestions, phase } = quizState;
  const style = config.style || 'bar';

  // Only show during quiz phase
  if (phase !== 'quiz' || totalQuestions === 0) {
    return null;
  }

  const progress = (currentQuestionIndex / totalQuestions) * 100;
  const displayIndex = currentQuestionIndex + 1;

  const renderContent = () => {
    switch (style) {
      case 'dots':
        return (
          <div className="progress-dots">
            {Array.from({ length: totalQuestions }, (_, i) => (
              <span
                key={i}
                className={`progress-dot ${i < currentQuestionIndex ? 'completed' : ''} ${i === currentQuestionIndex ? 'current' : ''}`}
              />
            ))}
          </div>
        );

      case 'percentage':
        return (
          <div className="progress-percentage">
            {Math.round(progress)}%
          </div>
        );

      case 'fraction':
        return (
          <div className="progress-fraction">
            {displayIndex} / {totalQuestions}
          </div>
        );

      case 'bar':
      default:
        return (
          <div className="progress-bar-container">
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="progress-bar-label">
              {displayIndex} / {totalQuestions}
            </span>
          </div>
        );
    }
  };

  return (
    <div className={`progress-indicator progress-indicator-${style}`}>
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

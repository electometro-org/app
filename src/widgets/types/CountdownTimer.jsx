import React, { useState, useEffect, useRef } from 'react';
import { registerWidget } from '../registry';
import './CountdownTimer.css';

/**
 * CountdownTimer Widget
 *
 * Per-question countdown timer with warning state.
 * Configurable via config.duration (seconds), config.warningAt (seconds remaining)
 */
function CountdownTimer({ config, quizState }) {
  const { currentQuestionIndex, phase } = quizState;
  const duration = config.duration || 30;
  const warningAt = config.warningAt || 10;
  const onTimeUp = config.onTimeUp; // Optional callback

  const [timeLeft, setTimeLeft] = useState(duration);
  const [isWarning, setIsWarning] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const intervalRef = useRef(null);
  const lastQuestionRef = useRef(currentQuestionIndex);

  // Reset timer when question changes
  useEffect(() => {
    if (currentQuestionIndex !== lastQuestionRef.current) {
      lastQuestionRef.current = currentQuestionIndex;
      setTimeLeft(duration);
      setIsWarning(false);
      setIsExpired(false);
    }
  }, [currentQuestionIndex, duration]);

  // Timer countdown logic
  useEffect(() => {
    if (phase !== 'quiz') {
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setIsExpired(true);
          if (onTimeUp) {
            onTimeUp();
          }
          return 0;
        }

        const newTime = prev - 1;
        if (newTime <= warningAt && !isWarning) {
          setIsWarning(true);
        }
        return newTime;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [phase, currentQuestionIndex, warningAt, onTimeUp, isWarning]);

  // Only show during quiz phase
  if (phase !== 'quiz') {
    return null;
  }

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`countdown-timer ${isWarning ? 'warning' : ''} ${isExpired ? 'expired' : ''}`}>
      <div className="countdown-display">
        {formatTime(timeLeft)}
      </div>
      {isExpired && config.showExpiredMessage !== false && (
        <div className="countdown-expired-message">
          Time's up!
        </div>
      )}
    </div>
  );
}

// Register with defaults
registerWidget({
  id: 'countdown-timer',
  component: CountdownTimer,
  defaults: {
    draggable: true,
    defaultSlot: 'right',
    duration: 30,
    warningAt: 10,
    showExpiredMessage: true,
  },
});

export default CountdownTimer;

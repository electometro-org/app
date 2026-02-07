import React from 'react';
import { registerWidget } from '../registry';
import './QuizWidget.css';

/**
 * QuizWidget
 *
 * Special container widget that renders quiz content (children from App.jsx).
 * This is a thin wrapper - all quiz logic stays in App.jsx and QuizContext.
 */
function QuizWidget({ config, quizState, children }) {
  return (
    <div className="quiz-widget">
      {children}
    </div>
  );
}

// Register with defaults
registerWidget({
  id: 'quiz',
  component: QuizWidget,
  defaults: {
    draggable: false,
    defaultSlot: 'center',
  },
});

export default QuizWidget;

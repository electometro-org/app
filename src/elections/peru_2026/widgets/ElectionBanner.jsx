import React from 'react';
import './ElectionBanner.css';

/**
 * ElectionBanner
 *
 * Custom widget for Peru 2026 election.
 * Displays election branding/information.
 *
 * Config options:
 * - title: Banner title text
 * - subtitle: Optional subtitle
 * - logo: Optional logo image path
 */
function ElectionBanner({ config, quizState }) {
  const { title, subtitle, logo } = config;

  return (
    <div className="election-banner">
      {logo && <img src={logo} alt="" className="election-banner-logo" />}
      <div className="election-banner-text">
        {title && <h2 className="election-banner-title">{title}</h2>}
        {subtitle && <p className="election-banner-subtitle">{subtitle}</p>}
      </div>
      {quizState.phase === 'quiz' && (
        <span className="election-banner-progress">
          Pregunta {quizState.displayIndex} de {quizState.totalQuestions}
        </span>
      )}
    </div>
  );
}

export default ElectionBanner;
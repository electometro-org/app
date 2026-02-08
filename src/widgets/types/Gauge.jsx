import React from 'react';
import { registerWidget } from '../registry';
import { useWidgetContext } from '../WidgetContext';
import './Gauge.css';

/**
 * Gauge Widget
 *
 * Displays a semicircular gauge reflecting the user's answer for the current question.
 * The arc fill represents importance level, and the color represents opinion.
 *
 * Config options:
 * - size: 'small' | 'medium' | 'large' (default: 'medium')
 * - showPointer: boolean (default: true)
 * - showLabels: boolean (default: true) - Show opinion/importance labels
 * - showEmojis: boolean (default: true) - Show emojis on arc
 * - trackColor: string (default: 'rgba(255, 255, 255, 0.3)')
 * - agreeColor: string (default: '#4a9c6d')
 * - neutralColor: string (default: '#6b7280')
 * - disagreeColor: string (default: '#c32e2e')
 * - emojiLow: string (default: '🤷')
 * - emojiMid: string (default: '🤔')
 * - emojiHigh: string (default: '🚨')
 */

// SVG helper functions
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 180) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(x, y, radius, startAngle, endAngle) {
  const start = polarToCartesian(x, y, radius, startAngle);
  const end = polarToCartesian(x, y, radius, endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  const sweepFlag = 1;

  return [
    'M', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, sweepFlag, end.x, end.y
  ].join(' ');
}

// Map answer keys to opinion type
function getOpinionFromAnswer(answer) {
  if (!answer) return null;

  const answerLower = typeof answer === 'string' ? answer.toLowerCase() : '';

  if (answerLower.includes('agree') && !answerLower.includes('disagree')) {
    return 'agree';
  }
  if (answerLower.includes('disagree')) {
    return 'disagree';
  }
  if (answerLower.includes('neutral')) {
    return 'neutral';
  }

  return null;
}

// Importance labels (Spanish)
function getImportanceLabel(value) {
  if (value === null) return null;
  if (value < 33) return 'poca';
  if (value < 66) return 'normal';
  return 'mucha';
}

// Size presets (height includes space for emojis above arc)
const SIZE_PRESETS = {
  small: { width: 120, height: 85, radius: 48, strokeWidth: 12, emojiSize: 16, emojiOffset: 15 },
  medium: { width: 200, height: 140, radius: 80, strokeWidth: 20, emojiSize: 22, emojiOffset: 18 },
  large: { width: 280, height: 190, radius: 112, strokeWidth: 28, emojiSize: 28, emojiOffset: 22 },
};

function Gauge({ config, quizState }) {
  const {
    size = 'medium',
    showPointer = true,
    showLabels = true,
    showEmojis = true,
    trackColor = 'rgba(255, 255, 255, 0.3)',
    agreeColor = '#4a9c6d',
    neutralColor = '#6b7280',
    disagreeColor = '#c32e2e',
    emojiLow = '🤷',
    emojiMid = '🤔',
    emojiHigh = '🚨',
  } = config;

  // Get preview state from widget context (set by OpinionButtons on hover)
  const { gaugePreview } = useWidgetContext();

  const { currentQuestionIndex, answers, weights } = quizState;

  // Get current answer and weight
  const currentAnswer = answers?.[currentQuestionIndex];
  const currentWeight = weights?.[currentQuestionIndex];

  // Determine base opinion and color from saved answer
  const baseOpinion = getOpinionFromAnswer(currentAnswer);

  let baseColor = null;
  if (baseOpinion === 'agree') {
    baseColor = agreeColor;
  } else if (baseOpinion === 'neutral') {
    baseColor = neutralColor;
  } else if (baseOpinion === 'disagree') {
    baseColor = disagreeColor;
  }

  // Determine base value (importance) from saved weight
  let baseValue = null;
  if (currentAnswer) {
    if (currentWeight !== undefined && currentWeight !== null) {
      // Map weight: 0.5 -> 17, 1 -> 50, 2 -> 83
      if (currentWeight <= 0.5) {
        baseValue = 17;
      } else if (currentWeight >= 2) {
        baseValue = 83;
      } else {
        baseValue = 50;
      }
    } else {
      // Default to middle importance if no weight specified
      baseValue = 50;
    }
  }

  // Use preview values if available (from OpinionButtons hover), otherwise use saved values
  const value = gaugePreview?.value ?? baseValue;
  const color = gaugePreview?.color ?? baseColor;
  const isPointerTingling = gaugePreview?.isPointerTingling ?? false;
  const isColorCycling = gaugePreview?.isColorCycling ?? false;

  // Get size dimensions
  const dimensions = SIZE_PRESETS[size] || SIZE_PRESETS.medium;
  const { width, height, radius, strokeWidth, emojiSize, emojiOffset } = dimensions;
  const centerX = width / 2;
  const centerY = height - strokeWidth / 2 - 5; // Position center near bottom to leave room for emojis

  // Calculate arc path
  const arcLength = Math.PI * radius;
  const clampedValue = value !== null ? Math.min(100, Math.max(0, value)) : 0;

  // Arc is always fully filled when there's a value
  const strokeDashoffset = value !== null ? 0 : arcLength;

  // Pointer rotation
  const angle = (clampedValue / 100) * 180;
  const rotation = angle - 90;

  // Full arc path
  const fullArcPath = describeArc(centerX, centerY, radius, 0, 180);

  // Dynamic color when not set (hue based on value)
  const displayColor = color || `hsl(0, ${clampedValue}%, 50%)`;

  // Calculate emoji positions on the arc (at 17%, 50%, 83% of the arc)
  const emojiRadius = radius + strokeWidth / 2 + emojiOffset;
  const emojiPositions = [
    polarToCartesian(centerX, centerY, emojiRadius, 30),   // 17% position (left third)
    polarToCartesian(centerX, centerY, emojiRadius, 90),   // 50% position (center)
    polarToCartesian(centerX, centerY, emojiRadius, 150),  // 83% position (right third)
  ];

  // Get importance label
  const importanceLabel = getImportanceLabel(value);

  return (
    <div className="gauge-widget">
      {/* Left label - Static "Importancia:" */}
      {showLabels && (
        <div className="gauge-label gauge-label--left">
          <span className="gauge-label__text">Importancia:</span>
        </div>
      )}

      {/* Gauge SVG */}
      <div className="gauge-svg-container">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="gauge-svg"
        >
          {/* Gradient definition - from grayish to full color (left to right) */}
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={displayColor} stopOpacity="0.15" />
              <stop offset="55%" stopColor={displayColor} stopOpacity="0.75" />
              <stop offset="100%" stopColor={displayColor} />
            </linearGradient>
          </defs>

          {/* Background track */}
          <path
            d={fullArcPath}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="gauge-track"
          />

          {/* Pivot circle */}
          <circle
            cx={centerX}
            cy={centerY}
            r={strokeWidth / 4}
            className="gauge-pivot"
          />

          {/* Active parts - only render when there's a value */}
          {value !== null && (
            <>
              {/* Main arc with gradient (weak to strong = low to high importance) */}
              <path
                d={fullArcPath}
                fill="none"
                stroke="url(#gaugeGradient)"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={arcLength}
                strokeDashoffset={strokeDashoffset}
                className={`gauge-arc ${isColorCycling ? 'gauge-arc--hidden' : ''}`}
              />

              {/* Color cycling arc (animation overlay) */}
              {isColorCycling && (
                <path
                  d={fullArcPath}
                  fill="none"
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={arcLength}
                  strokeDashoffset={strokeDashoffset}
                  className="gauge-arc--cycling"
                  style={{
                    '--gauge-agree': agreeColor,
                    '--gauge-neutral': neutralColor,
                    '--gauge-disagree': disagreeColor,
                  }}
                />
              )}

              {/* Pointer */}
              {showPointer && (
                <g
                  transform={`rotate(${rotation} ${centerX} ${centerY})`}
                  className="gauge-pointer-group"
                >
                  <g
                    className={isPointerTingling ? 'gauge-pointer--tingling' : ''}
                    style={{ '--gauge-center-x': `${centerX}px`, '--gauge-center-y': `${centerY}px` }}
                  >
                    <polygon
                      points={`${centerX},${centerY - radius + strokeWidth / 2} ${centerX + strokeWidth / 4},${centerY} ${centerX - strokeWidth / 4},${centerY}`}
                      className="gauge-pointer"
                    />
                  </g>
                </g>
              )}
            </>
          )}

          {/* Emojis on the arc */}
          {showEmojis && (
            <>
              <text
                x={emojiPositions[0].x}
                y={emojiPositions[0].y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={emojiSize}
                className="gauge-emoji"
              >
                {emojiLow}
              </text>
              <text
                x={emojiPositions[1].x}
                y={emojiPositions[1].y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={emojiSize}
                className="gauge-emoji"
              >
                {emojiMid}
              </text>
              <text
                x={emojiPositions[2].x}
                y={emojiPositions[2].y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={emojiSize}
                className="gauge-emoji"
              >
                {emojiHigh}
              </text>
            </>
          )}
        </svg>
      </div>

      {/* Right label - Importance value */}
      {showLabels && (
        <div className="gauge-label gauge-label--right">
          {importanceLabel && (
            <span className="gauge-label__text gauge-label__value">
              {importanceLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

registerWidget({
  id: 'gauge',
  component: Gauge,
  defaults: {
    draggable: true,
    size: 'medium',
    showPointer: true,
    showOnPhase: ['quiz'],
  },
});

export default Gauge;
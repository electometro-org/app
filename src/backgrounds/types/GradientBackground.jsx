import React, { useMemo } from 'react';
import './GradientBackground.css';

/**
 * GradientBackground
 *
 * Animated gradient background with optional quiz progress reactivity.
 *
 * Config options:
 *   - colors: string[] - Array of colors for the gradient (minimum 2)
 *   - speed: number - Animation speed in seconds (default: 10)
 *   - direction: 'horizontal' | 'vertical' | 'diagonal' - Gradient direction (default: 'diagonal')
 *   - reactive: boolean - If true, animation speed changes with quiz progress (default: false)
 */
export function GradientBackground({ config, quizState }) {
  const {
    colors = ['#c32e2e', '#A12727', '#8B0000'],
    speed = 10,
    direction = 'diagonal',
    reactive = false,
  } = config || {};

  // Compute reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Calculate animation duration based on reactivity
  const animationDuration = useMemo(() => {
    if (prefersReducedMotion) return 0;

    if (reactive && quizState) {
      const { currentQuestionIndex, totalQuestions } = quizState;
      const progress = totalQuestions > 0 ? currentQuestionIndex / totalQuestions : 0;
      // Speed up as quiz progresses (from speed to speed/2)
      return speed * (1 - progress * 0.5);
    }
    return speed;
  }, [speed, reactive, quizState, prefersReducedMotion]);

  // Build gradient string
  const gradient = useMemo(() => {
    if (colors.length < 2) {
      return colors[0] || '#000000';
    }

    const angle = direction === 'horizontal' ? '90deg'
      : direction === 'vertical' ? '180deg'
      : '135deg';

    // Double the colors for seamless looping animation
    const doubledColors = [...colors, ...colors];
    const colorStops = doubledColors.map((color, i) => {
      const percent = (i / (doubledColors.length - 1)) * 200;
      return `${color} ${percent}%`;
    }).join(', ');

    return `linear-gradient(${angle}, ${colorStops})`;
  }, [colors, direction]);

  const style = {
    background: gradient,
    backgroundSize: '200% 200%',
    animationDuration: animationDuration > 0 ? `${animationDuration}s` : undefined,
    animationPlayState: prefersReducedMotion ? 'paused' : 'running',
  };

  return (
    <div
      className="gradient-background"
      style={style}
    />
  );
}

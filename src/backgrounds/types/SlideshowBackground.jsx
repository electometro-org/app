import React, { useState, useEffect, useRef, useMemo } from 'react';
import './SlideshowBackground.css';

/**
 * SlideshowBackground
 *
 * Image slideshow with per-question or timed modes and crossfade transitions.
 *
 * Config options:
 *   - images: string[] - Array of image URLs/paths
 *   - mode: 'per-question' | 'timed' - When to change images (default: 'per-question')
 *   - interval: number - Interval in ms for timed mode (default: 5000)
 *   - transitionDuration: number - Transition duration in ms (default: 600)
 *   - size: 'cover' | 'contain' | 'auto' - CSS background-size (default: 'cover')
 *   - position: string - CSS background-position (default: 'center')
 *   - overlay: { color: string } - Optional overlay for text readability
 */
export function SlideshowBackground({ config, quizState }) {
  const {
    images = [],
    mode = 'per-question',
    interval = 5000,
    transitionDuration = 600,
    size = 'cover',
    position = 'center',
    overlay,
  } = config || {};

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef(null);
  const prevQuestionIndex = useRef(quizState?.currentQuestionIndex ?? 0);

  // Compute reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Handle per-question mode
  useEffect(() => {
    if (mode !== 'per-question' || images.length === 0) return;

    const questionIndex = quizState?.currentQuestionIndex ?? 0;

    // Only change when question index changes
    if (questionIndex !== prevQuestionIndex.current) {
      prevQuestionIndex.current = questionIndex;
      const newIndex = questionIndex % images.length;
      if (newIndex !== currentIndex) {
        setIsTransitioning(true);
        setCurrentIndex(newIndex);
      }
    }
  }, [quizState?.currentQuestionIndex, mode, images.length, currentIndex]);

  // Handle timed mode
  useEffect(() => {
    if (mode !== 'timed' || images.length <= 1) return;

    timerRef.current = setInterval(() => {
      setIsTransitioning(true);
      setCurrentIndex(prev => (prev + 1) % images.length);
    }, interval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [mode, interval, images.length]);

  // Clear transitioning state after transition completes
  useEffect(() => {
    if (!isTransitioning) return;

    const timeout = setTimeout(() => {
      setIsTransitioning(false);
    }, transitionDuration);

    return () => clearTimeout(timeout);
  }, [isTransitioning, transitionDuration]);

  if (images.length === 0) {
    return null;
  }

  const actualDuration = prefersReducedMotion ? 0 : transitionDuration;
  const nextIndex = (currentIndex + 1) % images.length;

  return (
    <div className="slideshow-background">
      {/* Previous/next image (for crossfade) */}
      <div
        className="slideshow-background__image slideshow-background__image--back"
        style={{
          backgroundImage: `url(${images[nextIndex]})`,
          backgroundSize: size,
          backgroundPosition: position,
        }}
      />
      {/* Current image */}
      <div
        className="slideshow-background__image slideshow-background__image--front"
        style={{
          backgroundImage: `url(${images[currentIndex]})`,
          backgroundSize: size,
          backgroundPosition: position,
          opacity: isTransitioning ? 0 : 1,
          transition: `opacity ${actualDuration}ms ease-in-out`,
        }}
      />
      {overlay?.color && (
        <div
          className="slideshow-background__overlay"
          style={{ backgroundColor: overlay.color }}
        />
      )}
    </div>
  );
}

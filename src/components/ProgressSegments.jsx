import './ProgressSegments.css';

/**
 * Single-row progress bar made of one segment per question.
 * Segments shrink to fit any width, so it never wraps or overflows.
 *
 * @param {number} current - Zero-based index of the current question
 * @param {number} total - Total number of questions
 */
export default function ProgressSegments({ current, total, className = '' }) {
  if (!total || total <= 0) return null;

  return (
    <div
      className={`progress-segments ${className}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={current}
      aria-valuetext={`${current + 1} / ${total}`}
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`progress-segment ${i < current ? 'completed' : ''} ${i === current ? 'current' : ''}`}
        />
      ))}
    </div>
  );
}

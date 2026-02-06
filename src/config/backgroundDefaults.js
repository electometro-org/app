/**
 * Default Background Configuration
 *
 * These defaults are used when no background config is provided in election config.
 */

export const defaultBackgroundConfig = {
  type: 'solid',
};

/**
 * Background configuration documentation
 *
 * Solid Background:
 *   { type: 'solid', color?: string }
 *   - color: Override color (default: uses --background CSS variable)
 *
 * Image Background:
 *   { type: 'image', src: string, size?: string, position?: string, overlay?: { color: string } }
 *   - src: Image URL/path (required)
 *   - size: 'cover' | 'contain' | 'auto' (default: 'cover')
 *   - position: CSS background-position (default: 'center')
 *   - overlay: Optional dark overlay { color: 'rgba(0,0,0,0.3)' }
 *
 * Slideshow Background:
 *   { type: 'slideshow', images: string[], mode?: string, interval?: number, transitionDuration?: number, overlay?: object }
 *   - images: Array of image URLs/paths (required)
 *   - mode: 'per-question' | 'timed' (default: 'per-question')
 *   - interval: Milliseconds for timed mode (default: 5000)
 *   - transitionDuration: Transition duration in ms (default: 600)
 *   - size/position/overlay: Same as ImageBackground
 *
 * Gradient Background:
 *   { type: 'gradient', colors: string[], speed?: number, direction?: string, reactive?: boolean }
 *   - colors: Array of gradient colors (minimum 2)
 *   - speed: Animation duration in seconds (default: 10)
 *   - direction: 'horizontal' | 'vertical' | 'diagonal' (default: 'diagonal')
 *   - reactive: Speed up animation as quiz progresses (default: false)
 */

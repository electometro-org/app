/**
 * Background System
 *
 * Provides a registry pattern for background types, allowing anyone to add
 * custom implementations without modifying core files.
 *
 * Usage:
 *   import { registerBackground, getBackground } from './backgrounds';
 *
 *   // Register a custom background
 *   registerBackground({ id: 'my-bg', component: MyBackgroundComponent });
 *
 *   // Get a registered background
 *   const Background = getBackground('my-bg');
 */

// Re-export registry functions
export {
  registerBackground,
  getBackground,
  getBackgroundTypes,
  hasBackground,
} from './registry';

// Re-export components
export { BackgroundProvider } from './BackgroundContext';
export { BackgroundLayer } from './BackgroundLayer';

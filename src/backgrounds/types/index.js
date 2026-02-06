/**
 * Built-in Background Types
 *
 * This file registers all built-in background types.
 * Custom backgrounds can be registered elsewhere using registerBackground().
 */

import { registerBackground } from '../registry';
import { SolidBackground } from './SolidBackground';
import { ImageBackground } from './ImageBackground';
import { SlideshowBackground } from './SlideshowBackground';
import { GradientBackground } from './GradientBackground';

// Register built-in types
registerBackground({ id: 'solid', component: SolidBackground });
registerBackground({ id: 'image', component: ImageBackground });
registerBackground({ id: 'slideshow', component: SlideshowBackground });
registerBackground({ id: 'gradient', component: GradientBackground });

// Export components for direct use if needed
export { SolidBackground } from './SolidBackground';
export { ImageBackground } from './ImageBackground';
export { SlideshowBackground } from './SlideshowBackground';
export { GradientBackground } from './GradientBackground';

/**
 * Peru 2026 Election - Custom Widgets
 *
 * This file registers all custom widgets for the Peru 2026 election.
 * Import this file in the election config to register the widgets.
 *
 * Usage in election config:
 *   import './peru_2026/widgets';
 *
 *   export default {
 *     widgets: [
 *       { type: 'peru-banner', title: 'Elecciones 2026', ... },
 *     ]
 *   }
 */

import { registerWidget } from '../../../widgets/registry';

// Import widget components
import ElectionBanner from './ElectionBanner';

// Register widgets with unique IDs prefixed by election name
registerWidget({
  id: 'peru-banner',
  component: ElectionBanner,
  defaults: {
    draggable: true,
  },
});

// Export components for direct use if needed
export { ElectionBanner };
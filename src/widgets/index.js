/**
 * Widget System
 *
 * Provides a draggable widget layout system where all UI elements participate
 * in a unified layout. Widgets have default positions but users can drag-and-drop
 * to rearrange. Layout persists per-election in localStorage.
 *
 * Usage:
 *   import { WidgetProvider, WidgetLayout, registerWidget } from './widgets';
 *
 *   // In main.jsx: wrap app with WidgetProvider
 *   <WidgetProvider>
 *     <App />
 *   </WidgetProvider>
 *
 *   // In App.jsx: use WidgetLayout and pass quiz content
 *   <WidgetLayout>
 *     {renderMainContent()}
 *   </WidgetLayout>
 *
 *   // Register a custom widget
 *   registerWidget({ id: 'my-widget', component: MyWidget });
 */

// Re-export registry functions
export {
  registerWidget,
  getWidget,
  getWidgetTypes,
  hasWidget,
} from './registry';

// Re-export context and hooks
export { WidgetProvider, useWidgetContext } from './WidgetContext';

// Re-export layout component
export { WidgetLayout } from './WidgetLayout';

// Re-export persistence hook
export { useLayoutPersistence } from './useLayoutPersistence';

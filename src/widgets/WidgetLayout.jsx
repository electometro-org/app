import React, { useCallback, useState, useRef, useEffect } from 'react';
import { useWidgetContext } from './WidgetContext';
import { getWidget } from './registry';
import './WidgetLayout.css';

// Import built-in types (registers them)
import './types';

// Valid slots around the quiz
const SLOTS = ['top', 'left', 'right', 'bottom'];

/**
 * WidgetLayout
 *
 * CSS Grid layout with quiz at center and draggable widgets in slots around it.
 * Supports proximity-based drag and drop.
 */
export function WidgetLayout({ children }) {
  const {
    widgets,
    layout,
    quizState,
    onLayoutChange,
  } = useWidgetContext();

  const [draggingWidget, setDraggingWidget] = useState(null);
  const [nearestSlot, setNearestSlot] = useState(null);
  const slotRefs = useRef({});

  // Check if widget should be visible based on phase
  const isWidgetVisible = useCallback((widget) => {
    if (widget.showOnPhase) {
      const phases = Array.isArray(widget.showOnPhase) ? widget.showOnPhase : [widget.showOnPhase];
      if (!phases.includes(quizState.phase)) return false;
    }
    if (widget.hideOnPhase) {
      const phases = Array.isArray(widget.hideOnPhase) ? widget.hideOnPhase : [widget.hideOnPhase];
      if (phases.includes(quizState.phase)) return false;
    }
    return true;
  }, [quizState.phase]);

  // Get slot for a widget
  const getWidgetSlot = useCallback((widget) => {
    if (widget.type === 'quiz') return 'center';
    const savedSlot = layout[widget.type]?.slot;
    return savedSlot || widget.defaultSlot || 'top';
  }, [layout]);

  // Group widgets by slot
  const widgetsBySlot = {};
  SLOTS.forEach(slot => { widgetsBySlot[slot] = []; });
  widgetsBySlot.center = [];

  widgets.forEach(widget => {
    if (!isWidgetVisible(widget)) return;
    const slot = getWidgetSlot(widget);
    if (widgetsBySlot[slot]) {
      widgetsBySlot[slot].push(widget);
    }
  });

  // Find nearest slot based on mouse position
  const findNearestSlot = useCallback((mouseX, mouseY) => {
    let nearest = null;
    let minDistance = Infinity;

    SLOTS.forEach(slot => {
      const el = slotRefs.current[slot];
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distance = Math.sqrt((mouseX - centerX) ** 2 + (mouseY - centerY) ** 2);

      if (distance < minDistance) {
        minDistance = distance;
        nearest = slot;
      }
    });

    return nearest;
  }, []);

  // Handle drag start
  const handleDragStart = (e, widgetType) => {
    setDraggingWidget(widgetType);
    e.dataTransfer.setData('widgetType', widgetType);
    e.dataTransfer.effectAllowed = 'move';

    // Set drag image
    const dragImage = e.target.cloneNode(true);
    dragImage.style.opacity = '0.7';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  // Handle drag over document - find nearest slot
  useEffect(() => {
    if (!draggingWidget) return;

    const handleDragOver = (e) => {
      e.preventDefault();
      const nearest = findNearestSlot(e.clientX, e.clientY);
      setNearestSlot(nearest);
    };

    document.addEventListener('dragover', handleDragOver);
    return () => document.removeEventListener('dragover', handleDragOver);
  }, [draggingWidget, findNearestSlot]);

  // Handle drag end - snap to nearest slot
  const handleDragEnd = (e) => {
    if (draggingWidget && nearestSlot) {
      onLayoutChange(draggingWidget, { slot: nearestSlot });
    }
    setDraggingWidget(null);
    setNearestSlot(null);
  };

  // Render a widget
  const renderWidget = (widget) => {
    const registered = getWidget(widget.type);
    if (!registered) return null;

    const { component: Component } = registered;
    const isQuiz = widget.type === 'quiz';
    const isDraggable = !isQuiz && widget.draggable !== false;
    const isBeingDragged = draggingWidget === widget.type;

    const widgetProps = {
      config: widget,
      quizState,
      ...(isQuiz && { children }),
    };

    return (
      <div
        key={widget.type}
        className={`widget-item ${isQuiz ? 'quiz-widget' : 'floating-widget'} ${isDraggable ? 'draggable' : ''} ${isBeingDragged ? 'dragging' : ''}`}
        draggable={isDraggable}
        onDragStart={isDraggable ? (e) => handleDragStart(e, widget.type) : undefined}
        onDragEnd={isDraggable ? handleDragEnd : undefined}
      >
        {isDraggable && (
          <div className="widget-drag-handle">
            <span className="drag-handle-icon" />
          </div>
        )}
        <Component {...widgetProps} />
      </div>
    );
  };

  // Render a slot (drop zone)
  const renderSlot = (slot) => {
    const slotWidgets = widgetsBySlot[slot] || [];
    const isEmpty = slotWidgets.length === 0;
    const isNearest = nearestSlot === slot && draggingWidget;

    return (
      <div
        key={slot}
        ref={el => slotRefs.current[slot] = el}
        className={`widget-slot widget-slot-${slot} ${isEmpty ? 'empty' : ''} ${isNearest ? 'nearest' : ''} ${draggingWidget ? 'drop-active' : ''}`}
      >
        {slotWidgets.map(widget => renderWidget(widget))}
        {isEmpty && isNearest && (
          <div className="drop-indicator">Drop here</div>
        )}
      </div>
    );
  };

  return (
    <div className={`widget-layout ${draggingWidget ? 'is-dragging' : ''}`}>
      {renderSlot('top')}
      <div className="widget-layout-middle">
        {renderSlot('left')}
        <div className="widget-slot widget-slot-center">
          {widgetsBySlot.center.map(widget => renderWidget(widget))}
        </div>
        {renderSlot('right')}
      </div>
      {renderSlot('bottom')}
    </div>
  );
}
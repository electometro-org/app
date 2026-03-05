const isDev = import.meta.env.DEV;
const isDebug = import.meta.env.VITE_WIDGET_DEBUG === 'true';

export const debug = {
  log: (...args) => {
    if (isDev || isDebug) console.log(...args);
  },
  warn: (...args) => {
    if (isDev || isDebug) console.warn(...args);
  },
  error: (...args) => {
    // Always show errors
    console.error(...args);
  },
  info: (...args) => {
    if (isDev || isDebug) console.info(...args);
  },
};

export default debug;
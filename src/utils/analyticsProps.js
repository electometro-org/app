// Rybbit event properties: only strings and numbers are supported (and the payload is size-limited).
// Booleans are sent as strings; null/undefined, objects and arrays are dropped.
const MAX_STRING_LENGTH = 200;

export function sanitizeEventProps(props) {
  const out = {};
  if (!props || typeof props !== "object") return out;

  for (const [key, value] of Object.entries(props)) {
    if (typeof value === "number") {
      if (Number.isFinite(value)) out[key] = value;
    } else if (typeof value === "boolean") {
      out[key] = String(value);
    } else if (typeof value === "string") {
      out[key] = value.slice(0, MAX_STRING_LENGTH);
    }
  }
  return out;
}

const CIRCULAR_REFERENCE_PLACEHOLDER = '[Circular]';

const isPlainObject = (value) => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const isCloneError = (error) =>
  error?.name === 'DataCloneError'
  || /could not be cloned/i.test(String(error?.message || ''));

const sanitizeObjectEntries = (value, seen) => {
  const next = {};

  Object.entries(value).forEach(([key, entryValue]) => {
    const sanitized = sanitizeHistoryValue(entryValue, seen);
    if (sanitized !== undefined) {
      next[key] = sanitized;
    }
  });

  return next;
};

function sanitizeHistoryValue(value, seen = new WeakMap()) {
  if (value == null) {
    return value;
  }

  const valueType = typeof value;

  if (valueType === 'string' || valueType === 'number' || valueType === 'boolean') {
    return value;
  }

  if (valueType === 'undefined' || valueType === 'function' || valueType === 'symbol') {
    return undefined;
  }

  if (valueType === 'bigint') {
    return String(value);
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }

  if (value instanceof RegExp) {
    return {
      source: value.source,
      flags: value.flags,
    };
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: typeof value.stack === 'string' ? value.stack : '',
      cause: sanitizeHistoryValue(value.cause, seen),
    };
  }

  if (seen.has(value)) {
    return CIRCULAR_REFERENCE_PLACEHOLDER;
  }

  if (Array.isArray(value)) {
    seen.set(value, true);
    const next = value.map((item) => {
      const sanitized = sanitizeHistoryValue(item, seen);
      return sanitized === undefined ? null : sanitized;
    });
    seen.delete(value);
    return next;
  }

  if (value instanceof Map) {
    seen.set(value, true);
    const next = Array.from(value.entries())
      .map(([entryKey, entryValue]) => {
        const sanitizedKey = sanitizeHistoryValue(entryKey, seen);
        const sanitizedValue = sanitizeHistoryValue(entryValue, seen);

        if (sanitizedKey === undefined || sanitizedValue === undefined) {
          return null;
        }

        return [sanitizedKey, sanitizedValue];
      })
      .filter(Boolean);
    seen.delete(value);
    return next;
  }

  if (value instanceof Set) {
    seen.set(value, true);
    const next = Array.from(value.values())
      .map((entryValue) => sanitizeHistoryValue(entryValue, seen))
      .filter((entryValue) => entryValue !== undefined);
    seen.delete(value);
    return next;
  }

  if (valueType === 'object') {
    seen.set(value, true);

    const next = isPlainObject(value)
      ? sanitizeObjectEntries(value, seen)
      : {
          ...sanitizeObjectEntries(value, seen),
        };

    seen.delete(value);
    return next;
  }

  return undefined;
}

export const toHistorySafeState = (state) => sanitizeHistoryValue(state);

export const withHistorySafeStateOptions = (options = {}) => {
  if (!options || typeof options !== 'object' || !Object.prototype.hasOwnProperty.call(options, 'state')) {
    return options;
  }

  return {
    ...options,
    state: toHistorySafeState(options.state),
  };
};

export const installSafeHistoryState = () => {
  if (typeof window === 'undefined' || window.__taxi09HistoryStateGuardInstalled) {
    return;
  }

  const wrapHistoryMethod = (methodName) => {
    const original = window.history?.[methodName];

    if (typeof original !== 'function') {
      return;
    }

    window.history[methodName] = function patchedHistoryState(state, unused, url) {
      try {
        return original.call(this, state, unused, url);
      } catch (error) {
        if (!isCloneError(error)) {
          throw error;
        }

        return original.call(this, toHistorySafeState(state), unused, url);
      }
    };
  };

  wrapHistoryMethod('pushState');
  wrapHistoryMethod('replaceState');
  window.__taxi09HistoryStateGuardInstalled = true;
};

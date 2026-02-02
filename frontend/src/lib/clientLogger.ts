type ClientLogLevel = 'error' | 'warn' | 'info' | 'debug';

type ClientLogEntry = {
  at: string;
  level: ClientLogLevel;
  kind?: string;
  message?: string;
  stack?: string;
  url?: string;
  userAgent?: string;
  payload?: unknown;
  user?: { uid?: string; email?: string | null };
};

const baseURL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '/api';

const logUrl = `${baseURL.replace(/\/$/, '')}/logs/client`;

let initialized = false;
let currentUser: { uid?: string; email?: string | null } | undefined;

function safeToString(value: unknown) {
  if (typeof value === 'string') return value;
  if (value instanceof Error) return value.message;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function extractStack(value: unknown) {
  if (value instanceof Error && value.stack) return value.stack;
  return undefined;
}

function shouldIgnore(message?: string) {
  if (!message) return false;
  return message.includes('/logs/client');
}

function sendLog(entry: ClientLogEntry, writeToken?: string) {
  if (shouldIgnore(entry.message)) return;

  const body = JSON.stringify(entry);

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: 'application/json' });
    const url = writeToken ? `${logUrl}?token=${encodeURIComponent(writeToken)}` : logUrl;
    navigator.sendBeacon(url, blob);
    return;
  }

  fetch(logUrl + (writeToken ? `?token=${encodeURIComponent(writeToken)}` : ''), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
    credentials: 'include',
  }).catch(() => {
    // ignora falhas de log
  });
}

export function initClientLogger(opts?: { writeToken?: string; user?: { uid?: string; email?: string | null } }) {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  const writeToken = opts?.writeToken;
  currentUser = opts?.user;

  window.addEventListener('error', (event) => {
    const message = safeToString(event.error || event.message || 'window.error');
    const entry: ClientLogEntry = {
      at: new Date().toISOString(),
      level: 'error',
      kind: 'window_error',
      message,
      stack: extractStack(event.error),
      url: window.location.href,
      userAgent: navigator.userAgent,
      payload: {
        filename: (event as ErrorEvent).filename,
        lineno: (event as ErrorEvent).lineno,
        colno: (event as ErrorEvent).colno,
      },
      user: currentUser,
    };
    sendLog(entry, writeToken);
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = (event as PromiseRejectionEvent).reason;
    const message = safeToString(reason || 'unhandledrejection');
    const entry: ClientLogEntry = {
      at: new Date().toISOString(),
      level: 'error',
      kind: 'unhandled_rejection',
      message,
      stack: extractStack(reason),
      url: window.location.href,
      userAgent: navigator.userAgent,
      payload: { reason },
      user: currentUser,
    };
    sendLog(entry, writeToken);
  });

  const originalError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    originalError(...args);
    const message = args.map(safeToString).join(' ');
    const entry: ClientLogEntry = {
      at: new Date().toISOString(),
      level: 'error',
      kind: 'console_error',
      message,
      stack: args.map(extractStack).find(Boolean),
      url: window.location.href,
      userAgent: navigator.userAgent,
      payload: args,
      user: currentUser,
    };
    sendLog(entry, writeToken);
  };

  const originalWarn = console.warn.bind(console);
  console.warn = (...args: unknown[]) => {
    originalWarn(...args);
    const message = args.map(safeToString).join(' ');
    const entry: ClientLogEntry = {
      at: new Date().toISOString(),
      level: 'warn',
      kind: 'console_warn',
      message,
      url: window.location.href,
      userAgent: navigator.userAgent,
      payload: args,
      user: currentUser,
    };
    sendLog(entry, writeToken);
  };
}

export function logReactError(
  error: Error,
  info?: { componentStack?: string },
  opts?: { writeToken?: string; user?: { uid?: string; email?: string | null } }
) {
  if (typeof window === 'undefined') return;
  const entry: ClientLogEntry = {
    at: new Date().toISOString(),
    level: 'error',
    kind: 'react_error',
    message: error?.message || 'React error',
    stack: error?.stack,
    url: window.location.href,
    userAgent: navigator.userAgent,
    payload: info,
    user: opts?.user ?? currentUser,
  };
  sendLog(entry, opts?.writeToken);
}

export function setClientLoggerUser(user?: { uid?: string; email?: string | null }) {
  currentUser = user;
}

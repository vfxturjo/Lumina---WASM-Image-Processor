import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Robust error suppression for ResizeObserver loop errors
const resizeObserverLoopErr = /ResizeObserver loop limit exceeded/;
const resizeObserverUndeliveredErr = /ResizeObserver loop completed with undelivered notifications/;

// Suppress console.error
const originalError = console.error;
console.error = (...args) => {
  if (args.some(arg => 
    typeof arg === 'string' && (resizeObserverLoopErr.test(arg) || resizeObserverUndeliveredErr.test(arg))
  )) {
    return;
  }
  originalError.call(console, ...args);
};

// Suppress window.onerror
const originalOnerror = window.onerror;
window.onerror = (msg, source, lineno, colno, error) => {
    const strMsg = String(msg);
    if (resizeObserverLoopErr.test(strMsg) || resizeObserverUndeliveredErr.test(strMsg)) {
        return true; // Suppress
    }
    if (originalOnerror) {
        return originalOnerror(msg, source, lineno, colno, error);
    }
    return false;
}

// Suppress window 'error' event
window.addEventListener('error', (e) => {
  const msg = e.message;
  if (
    resizeObserverLoopErr.test(msg) || 
    resizeObserverUndeliveredErr.test(msg) ||
    msg === 'ResizeObserver loop completed with undelivered notifications.'
  ) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Robust error suppression for ResizeObserver loop errors
const resizeObserverLoopErr = /ResizeObserver loop limit exceeded/;
const resizeObserverUndeliveredErr = /ResizeObserver loop completed with undelivered notifications/;

const originalError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string') {
    if (resizeObserverLoopErr.test(args[0]) || resizeObserverUndeliveredErr.test(args[0])) {
      return;
    }
  }
  originalError.call(console, ...args);
};

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
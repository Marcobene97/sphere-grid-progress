import { Buffer } from 'buffer';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

// Polyfill Buffer for browser environment
(window as any).Buffer = Buffer;
(window as any).global = window;
(window as any).process = {
  env: {},
  nextTick: (fn: Function, ...args: any[]) => {
    Promise.resolve().then(() => fn(...args));
  },
  version: '',
  versions: {},
};

// CRITICAL: Make React available globally for Radix UI compatibility
// This is a fallback - index.html also sets these before main bundle loads
if (typeof window !== 'undefined') {
  if (!window.React) {
    (window as any).React = React;
    console.log('[Polyfills] Setting window.React as fallback');
  }
  if (!window.ReactDOM) {
    (window as any).ReactDOM = ReactDOM;
    console.log('[Polyfills] Setting window.ReactDOM as fallback');
  }
  
  // Also set on globalThis for maximum compatibility
  if (!globalThis.React) {
    (globalThis as any).React = React;
  }
  if (!globalThis.ReactDOM) {
    (globalThis as any).ReactDOM = ReactDOM;
  }
}

// Verification check
if (typeof window !== 'undefined') {
  console.log('[Polyfills] React globals check:', {
    'window.React': !!window.React,
    'window.ReactDOM': !!window.ReactDOM,
    'globalThis.React': !!globalThis.React,
  });
}


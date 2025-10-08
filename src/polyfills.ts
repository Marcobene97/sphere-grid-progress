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

// Make React available globally for Radix UI and other dependencies
(window as any).React = React;
(window as any).ReactDOM = ReactDOM;

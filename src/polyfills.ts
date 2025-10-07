import { Buffer } from 'buffer';

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

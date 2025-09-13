/**
 * Test setup file for Vitest
 */
import { beforeAll, afterEach, afterAll } from 'vitest';

// Mock localStorage for tests
const localStorageMock: Storage = {
  getItem: (key: string) => {
    return localStorage[key] || null;
  },
  setItem: (key: string, value: string) => {
    localStorage[key] = value;
  },
  removeItem: (key: string) => {
    delete localStorage[key];
  },
  clear: () => {
    for (const key in localStorage) {
      delete localStorage[key];
    }
  },
  length: 0,
  key: (index: number) => null,
};

// Set up localStorage mock
if (typeof global !== 'undefined' && !global.localStorage) {
  (global as any).localStorage = localStorageMock;
}

// Mock window.location
if (typeof window !== 'undefined') {
  delete (window as any).location;
  (window as any).location = {
    href: '',
    origin: 'http://localhost:3000',
    pathname: '/',
  };
}

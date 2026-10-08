// src/test-setup.ts – Vitest jsdom setup
import '@testing-library/jest-dom';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

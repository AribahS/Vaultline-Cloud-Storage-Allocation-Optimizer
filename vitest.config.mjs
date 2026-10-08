export default {
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
    include: ['src/**/*.test.{ts,tsx}', '*.test.{ts,tsx}'],
    pool: 'vmThreads',
    maxWorkers: 1,
    minWorkers: 1,
  },
};

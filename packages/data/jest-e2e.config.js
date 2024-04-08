/** @type {import('@jest/types').Config.InitialOptions} */

module.exports = {
  displayName: 'data',
  testMatch: ['<rootDir>/src/**/*.test.{js,jsx,ts,tsx}'],
  preset: 'ts-jest',
  moduleNameMapper: {
    '#testing/(.*)$': '<rootDir>/testing/$1',
    '#(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/testing/setupE2ETests.ts'],
  maxWorkers: 1,
};

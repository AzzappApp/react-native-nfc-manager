/** @type {import('@jest/types').Config.InitialOptions} */

module.exports = {
  displayName: 'shared',
  preset: 'ts-jest',
  setupFilesAfterEnv: ['./scripts/jestSetup.js'],
  testMatch: ['<rootDir>/src/**/*.test.{js,jsx,ts,tsx}'],
};

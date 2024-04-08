/** @type {import('@jest/types').Config.InitialOptions} */

module.exports = {
  displayName: 'schema',
  testMatch: ['<rootDir>/src/**/*.test.{js,jsx,ts,tsx}'],
  preset: 'ts-jest',
  moduleNameMapper: {
    '@azzapp/shared/(.*)$': '<rootDir>/../shared/src/$1',
    '@azzapp/data/(.*)$': '<rootDir>/../data/lib/$1',
    '#testing/(.*)$': '<rootDir>/testing/$1',
    '#(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/testing/setupTests.ts'],
  transform: {
    '\\.[j]sx?$': 'babel-jest',
  },
};

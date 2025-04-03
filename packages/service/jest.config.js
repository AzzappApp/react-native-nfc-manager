/** @type {import('@jest/types').Config.InitialOptions} */

module.exports = {
  displayName: 'service',
  preset: 'ts-jest',
  testMatch: ['<rootDir>/src/**/*.test.{js,jsx,ts,tsx}'],
  moduleNameMapper: {
    '#(.*)': '<rootDir>/src/$1',
    '@azzapp/shared/(.*)': '<rootDir>/../shared/src/$1',
    '@azzapp/data/(.*)': '<rootDir>/../data/src/$1',
  },
};

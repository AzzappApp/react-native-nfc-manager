/** @type {import('@jest/types').Config.InitialOptions} */

module.exports = {
  displayName: 'schema',
  preset: 'ts-jest',
  testMatch: ['<rootDir>/src/**/*.test.{js,jsx,ts,tsx}'],
  moduleNameMapper: {
    '#(.*)': '<rootDir>/src/$1',
    '@azzapp/shared/(.*)': '<rootDir>/../shared/src/$1',
    '@azzapp/service/(.*)': '<rootDir>/../service/src/$1',
  },
};

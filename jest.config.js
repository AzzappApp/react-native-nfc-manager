/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  clearMocks: true,
  reporters: ['default', 'github-actions'],
  projects: [
    {
      displayName: 'app',
      preset: 'react-native',
      transform: {
        '^.+\\.(j|t)sx?$': './scripts/reactNativeJestTransformer.js',
      },
      testMatch: ['<rootDir>/packages/app/**/*.test.{js,jsx,ts,tsx}'],
    },
  ],
};

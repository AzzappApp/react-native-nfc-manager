/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  clearMocks: true,
  projects: [
    {
      displayName: 'app',
      preset: 'react-native',
      transform: {
        '^.+\\.(j|t)sx?$': './scripts/reactNativeJestTransformer.js',
      },
      testMatch: ['<rootDir>/packages/app/**/*.test.{js,jsx,ts,tsx}'],
      transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?|react-native-qrcode-svg|react-native-video)/)',
      ],
    },
  ],
};

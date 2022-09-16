const esModules = [
  'react-native',
  '@react-native(-community)?',
  'react-native-qrcode-svg',
  'react-native-reanimated',
];

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
      setupFilesAfterEnv: ['./scripts/jestSetup.js'],
      testMatch: ['<rootDir>/packages/**/*.test.{js,jsx,ts,tsx}'],
      transformIgnorePatterns: [`/node_modules/(?!${esModules.join('|')})`],
    },
  ],
};

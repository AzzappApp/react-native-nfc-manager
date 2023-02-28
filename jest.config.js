const esModules = [
  'react-native',
  '@react-native(-community)?',
  'react-native-qrcode-svg',
  'react-native-reanimated',
  'validator',
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
      testMatch: ['<rootDir>/packages/app/src/**/*.test.{js,jsx,ts,tsx}'],
      transformIgnorePatterns: [`/node_modules/(?!${esModules.join('|')})`],
      moduleNameMapper: {
        '#(.*)': '<rootDir>/packages/app/src/$1',
        '@azzapp/shared/(.*)': '<rootDir>/packages/shared/src/$1',
      },
    },
    {
      displayName: 'shared',
      // TODO use a more appropriate preset
      preset: 'react-native',
      transform: {
        // TODO use a more appropriate transformer
        '^.+\\.(j|t)sx?$': './scripts/reactNativeJestTransformer.js',
      },
      setupFilesAfterEnv: ['./scripts/jestSetup.js'],
      testMatch: ['<rootDir>/packages/shared/src/**/*.test.{js,jsx,ts,tsx}'],
      transformIgnorePatterns: [`/node_modules/(?!${esModules.join('|')})`],
    },
  ],
};

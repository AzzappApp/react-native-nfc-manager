const esModules = [
  'react-native',
  '@react-native(-community)?',
  'react-native-reanimated',
  'validator',
  'use-debounce',
  'expo(nent)?',
  '@expo(nent)?/.*',
  '@expo-.*',
  '@shopify/react-native-skia',
];

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  clearMocks: true,
  displayName: 'app',
  preset: 'jest-expo',
  transform: {
    '^.+\\.(j|t)sx?$': './scripts/reactNativeJestTransformer.js',
  },
  setupFilesAfterEnv: [
    './scripts/jestSetup.js',
    '@shopify/react-native-skia/jestSetup',
  ],
  testMatch: ['<rootDir>/src/**/*.test.{js,jsx,ts,tsx}'],
  transformIgnorePatterns: [`/node_modules/(?!${esModules.join('|')})`],
  moduleNameMapper: {
    '#(.*)': '<rootDir>/../packages/app/src/$1',
    '@azzapp/shared/(.*)': '<rootDir>/../packages/shared/src/$1',
  },
  prettierPath: require.resolve('prettier-2'),
};

process.env = Object.assign(process.env, {
  TERMS_OF_SERVICE: 'TERMS_OF_SERVICE',
  PRIVACY_POLICY: 'PRIVACY_POLICY',
});

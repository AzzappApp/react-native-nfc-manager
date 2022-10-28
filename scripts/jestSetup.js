import { jest } from '@jest/globals';
require('react-native-reanimated/lib/reanimated2/jestUtils').setUpTests();
global.ReanimatedDataMock = {
  //fix a bug since 2.5.0
  now: () => 0,
};

require('react-native-gesture-handler/jestSetup');

import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

import mockSafeAreaContext from 'react-native-safe-area-context/jest/mock';

jest.mock('react-native-localize', () => {
  const RNLocalize = require('react-native-localize/mock');
  return RNLocalize;
});
jest.mock('react-native-safe-area-context', () => mockSafeAreaContext);
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

process.env.NEXT_PUBLIC_URL = 'https://fake-azzapp.com';
process.env.NEXT_PUBLIC_API_ENDPOINT = 'https://api.fake-azzapp.com';

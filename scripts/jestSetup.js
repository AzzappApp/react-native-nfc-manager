import { jest } from '@jest/globals';
require('react-native-reanimated/lib/reanimated2/jestUtils').setUpTests();
global.ReanimatedDataMock = {
  //fix a bug since 2.5.0
  now: () => 0,
};

require('react-native-gesture-handler/jestSetup');

import mockSafeAreaContext from 'react-native-safe-area-context/jest/mock';
jest.mock('react-native-safe-area-context', () => mockSafeAreaContext);

process.env.NEXT_PUBLIC_URL = 'https://fake-azzapp.com';
process.env.NEXT_PUBLIC_API_ENDPOINT = 'https://api.fake-azzapp.com';

/* eslint-disable import/order */
const { jest } = require('@jest/globals');

//#region Expect Extensions
require('@testing-library/jest-native/extend-expect');
//#endregion

//#endregion

//#region Native Dependencies mock
// Reanimated Mock
require('react-native-reanimated/lib/reanimated2/jestUtils').setUpTests();
global.ReanimatedDataMock = {
  now: () => Date.now(),
};

// RNGestureHandler Mock
require('react-native-gesture-handler/jestSetup');

// React Native Localize Mock
jest.mock('react-native-localize', () => require('react-native-localize/mock'));

// React Native Safe Area Context Mock
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

// React Native Async Storage Mock
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// React Encrypted Storage Mock
jest.mock('react-native-encrypted-storage');

// React Encrypted Storage Mock
jest.mock('react-native-vision-camera');

//#region AZP Modules Mock
jest.mock('#helpers/mediaHelpers/NativeMediaHelpers');

jest.mock('#components/medias/NativeMediaImageRenderer');
jest.mock('#components/medias/NativeMediaVideoRenderer');
// we completely mock the medias module for problems related to querying the wrapper around the native module
jest.mock('#components/medias');

jest.mock('#components/gpu/GPUNativeMethods');
//#endregion

//#region flashlist
require('@shopify/flash-list/jestSetup');
//#endregion

/* eslint-disable import/order */
const { jest } = require('@jest/globals');

//#region Expect Extensions
require('@testing-library/jest-native/extend-expect');
//#endregion

//#endregion

//#region Native Dependencies mock
// Reanimated Mock
require('react-native-reanimated').setUpTests();
global.ReanimatedDataMock = {
  now: () => Date.now(),
};

// RNGestureHandler Mock
require('react-native-gesture-handler/jestSetup');

// React Native Localize Mock
jest.mock('react-native-localize', () => require('react-native-localize/mock'));

// React-native-permission
jest.mock('react-native-permissions', () =>
  require('react-native-permissions/mock'),
);

// React Native Safe Area Context Mock
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

// React Encrypted Storage Mock
jest.mock('react-native-encrypted-storage');

// React Encrypted Storage Mock
jest.mock('react-native-vision-camera');

// react-native-keyboard-controller
jest.mock('react-native-keyboard-controller', () =>
  require('react-native-keyboard-controller/jest'),
);

//#region AZP Modules Mock
jest.mock('#helpers/mediaHelpers/NativeMediaHelpers');

// we completely mock the medias module for problems related to querying the wrapper around the native module
jest.mock('#components/medias');
//#endregion

//#region flashlist
require('@shopify/flash-list/jestSetup');
//#endregion

//#region ReactNativeBlobUtil
jest.mock('react-native-blob-util', () => {});
//#endregion

//#region ReactNativeSkia video
jest.mock('@azzapp/react-native-skia-video', () => {});
//#endregion

//#region Sentry
jest.mock('@sentry/react-native', () => ({
  init: () => jest.fn(),
  captureEvent: () => jest.fn(),
  captureMessage: () => jest.fn(),
}));
//#endRegion

//#region react-native-purchase
jest.mock('react-native-purchases', () => ({
  Purchases: {
    setup: jest.fn(),
    addPurchaserInfoUpdateListener: jest.fn(),
    removePurchaserInfoUpdateListener: jest.fn(),
    getOfferings: jest.fn(),
    purchasePackage: jest.fn(),
    restoreTransactions: jest.fn(),
  },
}));

jest.mock('#hooks/useApplicationFonts', () => ({}));

jest.mock('@react-native-firebase/analytics', () => {
  return () => ({
    logEvent: jest.fn(),
    logSignUp: jest.fn(),
  });
});

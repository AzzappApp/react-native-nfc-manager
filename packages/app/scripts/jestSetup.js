const { jest } = require('@jest/globals');
const { Platform } = require('react-native');

process.env.EXPO_OS = Platform.OS;

//#region Expect Extensions
require('@testing-library/jest-native/extend-expect');
//#endregion

//#endregion

//#region Native Dependencies mock
// Reanimated Mock
require('react-native-reanimated').setUpTests();

// This code is here it fix issue with mocked createAnimatedComponent
// workaround from: https://github.com/software-mansion/react-native-reanimated/issues/3982
jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock'),
);

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

/** jest.mock('@react-native-firebase/analytics', () => {
  return {
    getAnalytics: () => jest.fn(),
    logEvent: jest.fn(),
    logSignUp: jest.fn(),
    setUserId: jest.fn(),
    logScreenView: jest.fn(),
    firebase: {
      analytics: jest.fn(),
    },
  };
});*/

jest.mock('@gorhom/bottom-sheet', () => {
  const { ScrollView, TextInput } = jest.requireActual('react-native');

  return {
    ...require('@gorhom/bottom-sheet/mock'),
    __esModule: true,
    BottomSheetScrollView: ScrollView,
    BottomSheetTextInput: TextInput,
  };
});

jest.mock('@azzapp/react-native-skia-video', () => ({}));
jest.mock('@azzapp/react-native-buffer-loader', () => ({}));

// Configuration for react-hook-form (from documentation)
global.window = {};
global.window = global;

// Mock expo-file-system
jest.mock('expo-file-system/next', () => {
  return {
    documentDirectory: '/mock/document/directory/',
    cacheDirectory: '/mock/cache/directory/',
    downloadAsync: jest.fn().mockResolvedValue({
      uri: '/mock/cache/directory/mock_file',
    }),
    makeDirectoryAsync: jest.fn().mockResolvedValue(true),
    readAsStringAsync: jest.fn().mockResolvedValue('mock_file_content'),
    writeAsStringAsync: jest.fn().mockResolvedValue(true),
    deleteAsync: jest.fn().mockResolvedValue(true),
    Paths: {
      cache: {
        uri: '/mock/cache/directory/',
      },
    },
    File: jest.fn().mockImplementation(() => {
      return {
        exists: true,
        base64: () => '<BASE64DATA>',
      };
    }),
  };
});

//mock expo file image manupulator
// Mock expo-image-manipulator
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn().mockResolvedValue({ uri: 'mock_local_uri' }),
  SaveFormat: {
    JPEG: 'jpeg',
    PNG: 'png',
  },
}));

jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'mock://redirect'),
}));

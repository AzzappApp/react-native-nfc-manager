import * as RNLocalize from 'react-native-localize';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import { act, renderHook } from '#helpers/testHelpers';
import * as localHelpersModule from '../localeHelpers';
import type { AppStateStatus } from 'react-native';

let mockListener: ((status: AppStateStatus) => null) | null = null;
jest.mock('react-native/Libraries/AppState/AppState', () => ({
  default: {
    currentState: 'active',
    addEventListener(event: any, listener: any) {
      mockListener = listener;
    },
  },
}));

describe('localeHelpers', () => {
  let localHelpers: typeof localHelpersModule;
  beforeEach(() => {
    jest.isolateModules(() => {
      localHelpers = require('../localeHelpers');
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('init', () => {
    test('should set the current locale', () => {
      const { getCurrentLocale, init } = localHelpers;
      jest.spyOn(RNLocalize, 'getLocales').mockReturnValueOnce([
        {
          languageCode: 'fr',
          countryCode: 'fr',
          languageTag: 'fr',
          isRTL: false,
        },
      ]);

      init();

      expect(getCurrentLocale()).toBe('fr');
    });

    test('should set the best locale close to current locale', () => {
      const { getCurrentLocale, init } = localHelpers;
      jest.spyOn(RNLocalize, 'getLocales').mockReturnValueOnce([
        {
          languageCode: 'en',
          countryCode: 'en',
          languageTag: 'en-AU',
          isRTL: false,
        },
      ]);

      init();

      expect(getCurrentLocale()).toBe('en-US');
    });

    test('should set the first locale supported', () => {
      const { getCurrentLocale, init } = localHelpers;
      jest.spyOn(RNLocalize, 'getLocales').mockReturnValueOnce([
        {
          languageCode: 'unsupported',
          countryCode: 'unsupported',
          languageTag: 'unsupported',
          isRTL: false,
        },
        {
          languageCode: 'en',
          countryCode: 'en',
          languageTag: 'en-GB',
          isRTL: false,
        },
      ]);

      init();

      expect(getCurrentLocale()).toBe('en-US');
    });

    test('should listen to AppState and set again the current locale when app goes to foreground', () => {
      const { getCurrentLocale, init } = localHelpers;

      const spy = jest
        .spyOn(RNLocalize, 'getLocales')
        .mockReturnValueOnce([
          {
            languageCode: 'fr',
            countryCode: 'fr',
            languageTag: 'fr',
            isRTL: false,
          },
        ])
        .mockReturnValueOnce([
          {
            languageCode: 'en',
            countryCode: 'en',
            languageTag: 'en-US',
            isRTL: false,
          },
        ]);

      init();
      expect(getCurrentLocale()).toBe('fr');
      expect(spy).toHaveBeenCalledTimes(1);

      mockListener!('background');
      expect(spy).toHaveBeenCalledTimes(1);
      mockListener!('active');
      expect(getCurrentLocale()).toBe('en-US');
      expect(spy).toHaveBeenCalledTimes(2);
    });
  });

  describe('getCurrentLocale', () => {
    test('should warn if called before initialization', () => {
      const { getCurrentLocale } = localHelpers;
      const consoleWarn = jest
        .spyOn(console, 'warn')
        .mockImplementationOnce(() => void 0);
      expect(getCurrentLocale()).toBe(DEFAULT_LOCALE);
      expect(consoleWarn).toHaveBeenCalledWith(
        'trying to access `getCurrentLocale` before initialization',
      );
      consoleWarn.mockRestore();
    });
    test('should not warn if called after initialization', () => {
      const { getCurrentLocale, init } = localHelpers;
      jest.spyOn(RNLocalize, 'getLocales').mockReturnValueOnce([
        {
          languageCode: 'fr',
          countryCode: 'fr',
          languageTag: 'fr',
          isRTL: false,
        },
      ]);
      const consoleWarn = jest
        .spyOn(console, 'warn')
        .mockImplementationOnce(() => void 0);
      init();
      expect(getCurrentLocale()).toBe('fr');
      expect(consoleWarn).not.toHaveBeenCalled();
      consoleWarn.mockRestore();
    });
  });

  describe('useCurrentLocale', () => {
    beforeAll(() => {
      const mock = jest.spyOn(RNLocalize, 'getLocales').mockReturnValueOnce([
        {
          languageCode: 'fr',
          countryCode: 'fr',
          languageTag: 'fr',
          isRTL: false,
        },
      ]);
      localHelpersModule.init();
      mock.mockRestore();
    });
    test('should return the currentLocale', () => {
      const { result } = renderHook(() =>
        localHelpersModule.useCurrentLocale(),
      );
      expect(result.current).toBe('fr');
    });
    test('should change when the currentLocale change', () => {
      const { result } = renderHook(() =>
        localHelpersModule.useCurrentLocale(),
      );
      const mock = jest.spyOn(RNLocalize, 'getLocales').mockReturnValueOnce([
        {
          languageCode: 'fr',
          countryCode: 'fr',
          languageTag: 'fr',
          isRTL: false,
        },
      ]);
      act(() => {
        mockListener?.('inactive');
        mockListener?.('active');
      });
      expect(result.current).toBe('fr');
      mock.mockReturnValueOnce([
        {
          languageCode: 'ja',
          countryCode: 'ja',
          languageTag: 'ja',
          isRTL: false,
        },
      ]);
      act(() => {
        mockListener?.('inactive');
        mockListener?.('active');
      });
      expect(result.current).toBe('en-US');
    });
  });
  describe('getCurrentLocale', () => {
    test('should warn if called before initialization', () => {
      const { getCurrentLocale } = localHelpers;
      const consoleWarn = jest
        .spyOn(console, 'warn')
        .mockImplementationOnce(() => void 0);
      expect(getCurrentLocale()).toBe(DEFAULT_LOCALE);
      expect(consoleWarn).toHaveBeenCalledWith(
        'trying to access `getCurrentLocale` before initialization',
      );
      consoleWarn.mockRestore();
    });
    test('should not warn if called after initialization', () => {
      const { getCurrentLocale, init } = localHelpers;
      jest.spyOn(RNLocalize, 'getLocales').mockReturnValueOnce([
        {
          languageCode: 'fr',
          countryCode: 'fr',
          languageTag: 'fr',
          isRTL: false,
        },
      ]);
      const consoleWarn = jest
        .spyOn(console, 'warn')
        .mockImplementationOnce(() => void 0);
      init();
      expect(getCurrentLocale()).toBe('fr');
      expect(consoleWarn).not.toHaveBeenCalled();
      consoleWarn.mockRestore();
    });
  });
  describe('useCurrentLocale', () => {
    beforeAll(() => {
      const mock = jest.spyOn(RNLocalize, 'getLocales').mockReturnValueOnce([
        {
          languageCode: 'fr',
          countryCode: 'fr',
          languageTag: 'fr',
          isRTL: false,
        },
      ]);
      localHelpersModule.init();
      mock.mockRestore();
    });
    test('should return the currentLocale', () => {
      const { result } = renderHook(() =>
        localHelpersModule.useCurrentLocale(),
      );
      expect(result.current).toBe('fr');
    });
    test('should change when the currentLocale change', () => {
      const { result } = renderHook(() =>
        localHelpersModule.useCurrentLocale(),
      );
      const mock = jest.spyOn(RNLocalize, 'getLocales').mockReturnValueOnce([
        {
          languageCode: 'fr',
          countryCode: 'fr',
          languageTag: 'fr',
          isRTL: false,
        },
      ]);
      act(() => {
        mockListener?.('inactive');
        mockListener?.('active');
      });
      expect(result.current).toBe('fr');
      mock.mockReturnValueOnce([
        {
          languageCode: 'ja',
          countryCode: 'ja',
          languageTag: 'ja',
          isRTL: false,
        },
      ]);
      act(() => {
        mockListener?.('inactive');
        mockListener?.('active');
      });
      expect(result.current).toBe('en-US');
    });
  });
});

/* eslint-disable @typescript-eslint/no-var-requires */
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@azzapp/i18n';

import * as RNLocalize from 'react-native-localize';
import { act, renderHook } from '../../../utils/test-util';
import * as localHelpersModule from '../localeHelpers';
import type { AppStateStatus } from 'react-native';
let mockListener: ((status: AppStateStatus) => null) | null = null;
jest.mock('react-native/Libraries/AppState/AppState', () => ({
  currentState: 'active',
  addEventListener(event: any, listener: any) {
    mockListener = listener;
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
      const findBestAvailableLanguageSpy = jest
        .spyOn(RNLocalize, 'findBestAvailableLanguage')
        .mockReturnValueOnce({
          languageTag: 'fr',
          isRTL: false,
        });

      init();

      expect(getCurrentLocale()).toBe('fr');
      expect(findBestAvailableLanguageSpy).toHaveBeenCalledWith(
        SUPPORTED_LOCALES,
      );
    });

    test('should listen to AppState and set again the current locale when app goes to foreground', () => {
      const { getCurrentLocale, init } = localHelpers;

      const findBestAvailableLanguageSpy = jest
        .spyOn(RNLocalize, 'findBestAvailableLanguage')
        .mockReturnValueOnce({
          languageTag: 'fr',
          isRTL: false,
        })
        .mockReturnValueOnce({
          languageTag: 'en',
          isRTL: false,
        });

      init();
      expect(getCurrentLocale()).toBe('fr');
      expect(findBestAvailableLanguageSpy).toHaveBeenCalledTimes(1);

      mockListener!('background');
      expect(findBestAvailableLanguageSpy).toHaveBeenCalledTimes(1);
      mockListener!('active');
      expect(getCurrentLocale()).toBe('en');
      expect(findBestAvailableLanguageSpy).toHaveBeenCalledTimes(2);
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

      jest.spyOn(RNLocalize, 'findBestAvailableLanguage').mockReturnValueOnce({
        languageTag: 'fr',
        isRTL: false,
      });
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
      const findBestAvailableLanguageMock = jest
        .spyOn(RNLocalize, 'findBestAvailableLanguage')
        .mockReturnValueOnce({
          languageTag: 'fr',
          isRTL: false,
        });
      localHelpersModule.init();
      findBestAvailableLanguageMock.mockRestore();
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

      const findBestAvailableLanguageMock = jest
        .spyOn(RNLocalize, 'findBestAvailableLanguage')
        .mockReturnValueOnce({
          languageTag: 'fr',
          isRTL: false,
        });
      act(() => {
        mockListener?.('inactive');
        mockListener?.('active');
      });
      expect(result.current).toBe('fr');

      findBestAvailableLanguageMock.mockReturnValueOnce({
        languageTag: 'es',
        isRTL: false,
      });
      act(() => {
        mockListener?.('inactive');
        mockListener?.('active');
      });
      expect(result.current).toBe('es');
    });
  });
});

/* eslint-disable @typescript-eslint/no-var-requires */
import * as RNLocalize from 'react-native-localize';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@azzapp/i18n';
import { act, renderHook } from '#helpers/testHelpers';
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
      const findBestLanguageTagSpy = jest
        .spyOn(RNLocalize, 'findBestLanguageTag')
        .mockReturnValueOnce({
          languageTag: 'fr',
          isRTL: false,
        });

      init();

      expect(getCurrentLocale()).toBe('fr');
      expect(findBestLanguageTagSpy).toHaveBeenCalledWith(SUPPORTED_LOCALES);
    });

    test('should listen to AppState and set again the current locale when app goes to foreground', () => {
      const { getCurrentLocale, init } = localHelpers;

      const findBestLanguageTagSpy = jest
        .spyOn(RNLocalize, 'findBestLanguageTag')
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
      expect(findBestLanguageTagSpy).toHaveBeenCalledTimes(1);

      mockListener!('background');
      expect(findBestLanguageTagSpy).toHaveBeenCalledTimes(1);
      mockListener!('active');
      expect(getCurrentLocale()).toBe('en');
      expect(findBestLanguageTagSpy).toHaveBeenCalledTimes(2);
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

      jest.spyOn(RNLocalize, 'findBestLanguageTag').mockReturnValueOnce({
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
      const findBestLanguageTagMock = jest
        .spyOn(RNLocalize, 'findBestLanguageTag')
        .mockReturnValueOnce({
          languageTag: 'fr',
          isRTL: false,
        });
      localHelpersModule.init();
      findBestLanguageTagMock.mockRestore();
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

      const findBestLanguageTagMock = jest
        .spyOn(RNLocalize, 'findBestLanguageTag')
        .mockReturnValueOnce({
          languageTag: 'fr',
          isRTL: false,
        });
      act(() => {
        mockListener?.('inactive');
        mockListener?.('active');
      });
      expect(result.current).toBe('fr');

      findBestLanguageTagMock.mockReturnValueOnce({
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

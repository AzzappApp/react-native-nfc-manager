import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';
import { init as initAuthStore } from '#helpers/authStore';
import { init as initLocaleHelpers } from '#helpers/localeHelpers';
import { loadSkiaTypeFonts } from '#hooks/useApplicationFonts';

/**
 * Initialize the application
 * called at first launch before rendering the App component
 */
const appInit = async () => {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    enabled: !__DEV__,
    environment: process.env.DEPLOYMENT_ENVIRONMENT,
    // TODO better configuration based on environment
    // WARNING: This option interferes with reanimated and creates flickering in some animations
    // do not enable it unless it has been fixed
    enableStallTracking: false,
    tracesSampleRate:
      process.env.DEPLOYMENT_ENVIRONMENT === 'production' ? 0.1 : 1,
    // DO NOT REENABLE THIS UNTIL IT DOES NOT CRASH THE APP ANYMORE
    // see https://github.com/getsentry/sentry-java/issues/2604#issuecomment-1524566544
    profilesSampleRate: 0,
  });

  //initializing RC sneed to be done early
  if (Platform.OS === 'ios') {
    Purchases.configure({
      apiKey: process.env.PURCHASE_IOS_KEY!,
    });
  } else if (Platform.OS === 'android') {
    Purchases.configure({
      apiKey: process.env.PURCHASE_ANDROID_KEY!,
    });
  }

  await initAuthStore();
  initLocaleHelpers();
  loadSkiaTypeFonts();
};

export default appInit;

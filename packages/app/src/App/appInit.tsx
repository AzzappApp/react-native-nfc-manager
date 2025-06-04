import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';
import env from '#env';
import { init as initAuthStore } from '#helpers/authStore';
import { init as initLocaleHelpers } from '#helpers/localeHelpers';
import { loadSkiaTypeFonts } from '#hooks/useApplicationFonts';

/**
 * Initialize the application
 * called at first launch before rendering the App component
 */
const appInit = async () => {
  //initializing RC needs to be done early
  if (Platform.OS === 'ios') {
    Purchases.configure({
      apiKey: env.PURCHASE_IOS_KEY,
    });
  } else if (Platform.OS === 'android') {
    Purchases.configure({
      apiKey: env.PURCHASE_ANDROID_KEY,
    });
  }

  await initAuthStore();
  initLocaleHelpers();
  loadSkiaTypeFonts();
};

export default appInit;

import { getAnalytics as analytics } from '@react-native-firebase/analytics';

export function setAnalyticsUserId(profileId: string) {
  analytics().setUserId(profileId).catch();
}

/**
 * To use when user create his account the first time
 *
 * @param {string} userId
 *
 */
export function logSignUp(userId: string) {
  analytics()
    .setUserId(userId)
    .then(() => {
      analytics().logSignUp({ method: 'manual' });
    })
    .catch();
}

export function logSignIn(userId: string) {
  analytics()
    .setUserId(userId)
    .then(() => {
      logEvent('sign_in', { userId });
    })
    .catch();
}

/**
 * Generic even logging,this function is here in case we change analytics on day, or add a second one
 * to avoid change in all the code
 *
 * @export
 * @param {string} name
 * @param {{ [key: string]: any }} [params]
 */
export async function logEvent(name: string, params?: { [key: string]: any }) {
  analytics().logEvent(name, params);
}

/**
 * To call every time user change the screen.
 * Help to track on which screen users spent their time
 *
 * @param {string} screenName
 */
export async function analyticsLogScreenEvent(screenName: string) {
  await analytics().logScreenView({
    screen_name: screenName,
    screen_class: screenName,
  });
  // in order to prepare funnel
  //https://blog.theodo.com/2018/01/building-google-analytics-funnel-firebase-react-native/
  await logEvent('Page_' + screenName);
}

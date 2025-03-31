// import {firebase,
// setUserId,
// setConsent,
// logScreenView,
// logEvent as firebaseLogEvent,
// logSignUp as firebaseLogSignUp}
// from '@react-native-firebase/analytics';

export function setAnalyticsUserId(_userId: string) {
  //setUserId(firebase.analytics(), userId).catch();
}

export async function setAnalyticsConsent(_consents: {
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}) {
  /* await setConsent(firebase.analytics(), {
    ad_storage: consents.marketing,
    analytics_storage: consents.analytics,
    functional_storage: consents.functional,
    security_storage: true,
  }); */
}

/**
 * To use when user create his account the first time
 *
 * @param {string} userId
 *
 */
export async function logSignUp(_userId: string) {
  /* await setUserId(firebase.analytics(), userId)
    .then(async () => {
         await firebaseLogSignUp(firebase.analytics(), { method: 'manual' });
    })
    .catch(); */
}

export async function logSignIn(_userId: string) {
  /*  await setUserId(firebase.analytics(), userId)
    .then(async () => {
      await logEvent('sign_in', { userId });
    })
    .catch(); */
}

/**
 * Generic even logging,this function is here in case we change analytics on day, or add a second one
 * to avoid change in all the code
 *
 * @export
 * @param {string} name
 * @param {{ [key: string]: any }} [params]
 */
export async function logEvent(
  _name: string,
  _params?: { [key: string]: any },
) {
  //  await firebaseLogEvent(firebase.analytics(), name, params);
}

/**
 * To call every time user change the screen.
 * Help to track on which screen users spent their time
 *
 * @param {string} screenName
 */
export async function analyticsLogScreenEvent(screenName: string) {
  /*await logScreenView(firebase.analytics(), {
    screen_name: screenName,
    screen_class: screenName,
  });*/
  // in order to prepare funnel
  //https://blog.theodo.com/2018/01/building-google-analytics-funnel-firebase-react-native/
  await logEvent('Page_' + screenName);
}

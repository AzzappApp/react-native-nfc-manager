import {
  deleteRedirection,
  getContactCardAccessWithHasGooglePass,
  getProfilesWithHasGooglePass,
  getPushTokensFromWebCardId,
  getRedirectWebCardByUserName,
  getWebCardByUserName,
} from '@azzapp/data';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import { notifyApplePassWallet, notifyGooglePassWallet } from '#externals';

export const isUserNameAvailable = async (userName: string) => {
  const profile = await getWebCardByUserName(userName);
  const redirection = await getRedirectWebCardByUserName(userName);
  if (redirection.length === 0 && !profile) {
    return { available: true, userName };
  } else if (redirection.length > 0 && !profile) {
    //check if redirection is passed
    const currentRedirection = redirection[0];
    if (currentRedirection.expiresAt < new Date()) {
      await deleteRedirection(redirection[0].fromUserName);
      return { available: true, userName };
    }
  }
  return { available: false, userName };
};

export const notifyRelatedWalletPasses = async (
  webCardId: string,
  appleOnly?: boolean,
) => {
  const pushTokens = await getPushTokensFromWebCardId(webCardId);

  if (pushTokens.length) {
    pushTokens.map(notifyApplePassWallet);
  }

  if (!appleOnly) {
    const oldGoogleWalletPasses = await getProfilesWithHasGooglePass(webCardId); //legacy passes
    const googleWalletPasses =
      await getContactCardAccessWithHasGooglePass(webCardId);

    if (oldGoogleWalletPasses.length) {
      oldGoogleWalletPasses.map(({ profileId, userLocale }) =>
        notifyGooglePassWallet(profileId, userLocale ?? DEFAULT_LOCALE),
      );
    }
    if (googleWalletPasses.length) {
      googleWalletPasses.map(({ contactCardAccessId, userLocale }) =>
        notifyGooglePassWallet(
          contactCardAccessId,
          userLocale ?? DEFAULT_LOCALE,
        ),
      );
    }
  }
};

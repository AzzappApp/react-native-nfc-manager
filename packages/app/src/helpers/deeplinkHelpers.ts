import * as Sentry from '@sentry/react-native';
import { toGlobalId } from 'graphql-relay';
import { decompressFromEncodedURIComponent } from 'lz-string';
import { NativeModules, Platform } from 'react-native';
import * as z from 'zod';
import { buildWebUrl, deserializeGeolocation } from '@azzapp/shared/urlHelpers';
import env from '#env';
import { logEvent } from './analytics';
import { verifyQrCodeKey, verifySign } from './MobileWebAPI';
import type { Route } from '#routes';
import type { Geolocation } from '@azzapp/shared/geolocationHelpers';

const getSearchParamFromURL = (url: string, param: string) => {
  const include = url.includes(`${param}=`);

  if (!include) return null;

  const params = url.split(/([&?=])/);
  const index = params.indexOf(param);
  const value = params[index + 2];
  return value;
};

const ANDROID_CONTENT_PREFIX = 'content://';
const FILE_PREFIX = 'file://';

const profileUrl = /^^([^/?]+)(?:\/([^/?]+))?(?:\/([^/?]+))?.*$/;
const resetPasswordUrl = new RegExp('^reset-password');
const prefixes = [
  `${env.APP_SCHEME}://`,
  buildWebUrl(),
  buildWebUrl('share'),
  ANDROID_CONTENT_PREFIX,
  FILE_PREFIX,
];
//we had to many issue with end, add all url to avoid issue with env variable during build
const { AZPMediaHelpers } = NativeModules;

const geolocationSchema = z
  .tuple([
    z.number().nullable(),
    z.number().nullable(),
    z.string().nullable(),
    z.string().nullable(),
    z.string().nullable(),
    z.string().nullable(),
  ])
  .optional()
  .nullable();

export const matchUrlWithRoute = async (
  url: string,
): Promise<Route | undefined> => {
  // can be test only with the release app clip, url is fix, not based on scheme or target
  if (url.includes('com.azzapp.app.Clip')) {
    const route = await handleAppClip(url);
    return route;
  }
  //when testing the url condition did not work for nico,we can also in second layer if query param u and c are present
  //those 2 cases are working using the release appclip and the stable app id
  if (getSearchParamFromURL(url, 'u') && getSearchParamFromURL(url, 'c')) {
    //second try for the appclip
    const route = await handleAppClip(url);
    return route;
  }
  const prefix = prefixes.find(prefix => prefix && url.startsWith(prefix));
  if (!prefix) {
    return;
  }
  if (Platform.OS === 'android' && prefix === ANDROID_CONTENT_PREFIX) {
    const uri = `file://${await AZPMediaHelpers.downloadVCard(url)}`;
    return {
      route: 'CONTACT_CREATE',
      params: {
        vCardUri: uri,
      },
    };
  }
  if (prefix === FILE_PREFIX) {
    return {
      route: 'CONTACT_CREATE',
      params: {
        vCardUri: url,
      },
    };
  }
  let withoutPrefix = url.replace(prefix, '');
  if (withoutPrefix.startsWith('/')) {
    withoutPrefix = withoutPrefix.slice(1);
  }

  if (withoutPrefix === 'scan') {
    return {
      route: 'CONTACT_CREATE',
      params: {
        showCardScanner: true,
      },
    };
  }
  if (withoutPrefix === 'widget_share') {
    return {
      route: 'SHAKE_AND_SHARE',
    };
  }
  const matchResetPassword = withoutPrefix.match(resetPasswordUrl);
  if (matchResetPassword) {
    const token = decodeURIComponent(getSearchParamFromURL(url, 'token') ?? '');

    const issuer = decodeURIComponent(
      getSearchParamFromURL(url, 'issuer') ?? '',
    );

    if (token) {
      return {
        route: 'RESET_PASSWORD',
        params: {
          token,
          issuer,
        },
      };
    }
  }

  const matchProfile = withoutPrefix.match(profileUrl);
  if (matchProfile) {
    const userName = matchProfile[1];
    const route = matchProfile[2];
    const routeId = matchProfile[3];
    if (!userName) {
      return;
    }
    if (route === 'post' && routeId) {
      if (routeId) {
        logEvent('link_post', { postId: routeId });
        return {
          route: 'POST',
          params: {
            postId: toGlobalId('Post', routeId),
          },
        };
      }
    } else if (route === 'emailsignature') {
      const mode = getSearchParamFromURL(url, 'mode');
      const compressedContactCard = getSearchParamFromURL(url, 'e');
      if (!mode || !compressedContactCard) {
        return {
          route: 'HOME',
        };
      }
      logEvent('link_emailSignature');
      return {
        route: 'EMAIL_SIGNATURE',
        params: {
          userName,
          mode,
          compressedContactCard,
        },
      };
    } else if (route === 'invite') {
      return {
        route: 'HOME',
      };
    }
    //this is a webCard and maybe container a download liink
    const compressedContactCard = getSearchParamFromURL(url, 'c');

    const keyData = getSearchParamFromURL(url, 'k');

    if (keyData) {
      let contactCardAccessId: string;
      let key: string;
      let geolocation: Geolocation;
      try {
        [contactCardAccessId, key, geolocation] = JSON.parse(
          decompressFromEncodedURIComponent(keyData) ||
            atob(decodeURIComponent(keyData)),
        );

        let builtGeolocation;
        const geolocationParsed = geolocationSchema.safeParse(geolocation);
        if (geolocationParsed.success && geolocationParsed.data) {
          builtGeolocation = deserializeGeolocation(geolocationParsed.data);
        }

        const res = await verifyQrCodeKey({
          contactCardAccessId,
          key,
          userName,
        });

        logEvent('link_contactCard');
        return {
          route: 'WEBCARD',
          params: {
            userName,
            contactCard: res.contactCard,
            avatarUrl: res.avatarUrl,
            contactProfileId: res.profileId,
            geolocation: builtGeolocation,
          },
        };
      } catch (error) {
        Sentry.captureException(error, {
          data: 'app-deeplink-decompressKeyFromEncodedURIComponent',
        });
        return {
          route: 'WEBCARD',
          params: {
            userName,
          },
        };
      }
    } else if (compressedContactCard) {
      let contactData: string;
      let signature: string;
      let geolocation: Geolocation;
      try {
        [contactData, signature, geolocation] = JSON.parse(
          //lz-string decompressFromEncodedURIComponent does not decode properly when space in the url is converted to %20? (happens with applink)
          //we need to use decodeURI in order to decode the url properly
          decompressFromEncodedURIComponent(decodeURI(compressedContactCard)),
        );
      } catch (error) {
        Sentry.captureException(error, {
          data: 'app-deeplink-decompressFromEncodedURIComponent',
        });
        return {
          route: 'WEBCARD',
          params: {
            userName,
          },
        };
      }

      if (signature && contactData) {
        try {
          const additionalContactData = await verifySign({
            signature,
            data: contactData,
            salt: userName,
          });
          logEvent('link_contactCard');
          return {
            route: 'WEBCARD',
            params: {
              userName,
              contactData,
              additionalContactData,
              geolocation,
            },
          };
        } catch {
          logEvent('link_webCard');
          return {
            route: 'WEBCARD',
            params: {
              userName,
            },
          };
        }
      }
    } else {
      logEvent('link_webCard');
      return {
        route: 'WEBCARD',
        params: {
          userName,
        },
      };
    }
  }
  //if nothing was trigger, return to home
  return {
    route: 'HOME',
  };
};

const handleAppClip = async (url: string): Promise<Route | undefined> => {
  //get u param and c param from url
  const parsedUrl = new URL(url);
  const params = new URLSearchParams(parsedUrl.search);
  //little duplication but avoiding touching the actual deeplink . and having a custom logEvent
  logEvent('applink_contactCard');

  const username = params.get('u');
  const compressedContactCard = params.get('c');

  if (username && compressedContactCard) {
    let contactData: string;
    let signature: string;
    let geolocation: {
      location: {
        latitude: number;
        longitude: number;
      };
      address?: {
        city: string;
        subregion: string;
        region: string;
        country: string;
      };
    };
    try {
      [contactData, signature, geolocation] = JSON.parse(
        //lz-string decompressFromEncodedURIComponent does not decode properly when space in the url is converted to %20? (happens with applink)
        //we need to use decodeURI in order to decode the url properly
        decompressFromEncodedURIComponent(decodeURI(compressedContactCard)),
      );

      if (signature && contactData) {
        const additionalContactData = await verifySign({
          signature,
          data: contactData,
          salt: username,
          geolocation,
        });

        return {
          route: 'WEBCARD',
          params: {
            userName: username,
            contactData,
            additionalContactData,
            geolocation,
          },
        };
      }
    } catch (error) {
      Sentry.captureException(error, {
        data: 'appClip-deeplink-decompressFromEncodedURIComponent',
      });
      return {
        route: 'WEBCARD',
        params: {
          userName: username,
        },
      } as const;
    }
  } else {
    return {
      route: 'HOME',
    } as const;
  }
};

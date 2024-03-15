import * as Sentry from '@sentry/react-native';
import { toGlobalId } from 'graphql-relay';
import { decompressFromEncodedURIComponent } from 'lz-string';
import { verifySign } from './MobileWebAPI';
import type { Route } from '#routes';

const getSearchParamFromURL = (url: string, param: string) => {
  const include = url.includes(`${param}=`);

  if (!include) return null;

  const params = url.split(/([&?=])/);
  const index = params.indexOf(param);
  const value = params[index + 2];
  return value;
};

const profileUrl = /^\/?([^/?]+)(?:\/([^/?]+))?.*$/;
const resetPasswordUrl = new RegExp('^reset-password');
const prefixes = [process.env.APP_SCHEME, process.env.NEXT_PUBLIC_URL];
export const matchUrlWithRoute = async (
  url: string,
): Promise<Route | undefined> => {
  const prefix = prefixes.find(prefix => prefix && url.startsWith(prefix));
  if (!prefix) {
    return;
  }
  const withoutPrefix = url.replace(prefix, '');
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
    const username = matchProfile[1];
    if (!username) {
      return;
    }

    if (matchProfile && matchProfile[2] != null) {
      const postId = matchProfile[2];
      if (postId) {
        return {
          route: 'POST',
          params: {
            postId: toGlobalId('Post', postId),
          },
        };
      }
      return {
        route: 'WEBCARD',
        params: {
          userName: username,
        },
      };
    }
    //this is a webCard
    const compressedContactCard = getSearchParamFromURL(url, 'c');
    if (compressedContactCard) {
      let contactData: string;
      let signature: string;
      try {
        [contactData, signature] = JSON.parse(
          decompressFromEncodedURIComponent(compressedContactCard),
        );
      } catch (error) {
        Sentry.captureException(error);
        return {
          route: 'WEBCARD',
          params: {
            userName: username,
          },
        };
      }

      if (signature && contactData) {
        try {
          const additionalContactData = await verifySign({
            signature,
            data: contactData,
            salt: username,
          });

          return {
            route: 'WEBCARD',
            params: {
              userName: username,
              contactData,
              additionalContactData,
            },
          };
        } catch {
          return {
            route: 'WEBCARD',
            params: {
              userName: username,
            },
          };
        }
      }
    } else {
      //this is a webcard deeplink
      return {
        route: 'WEBCARD',
        params: {
          userName: username,
        },
      };
    }
  }
};

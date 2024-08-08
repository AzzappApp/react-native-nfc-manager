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

const profileUrl = /^^([^/?]+)(?:\/([^/?]+))?(?:\/([^/?]+))?.*$/;
const resetPasswordUrl = new RegExp('^reset-password');
const prefixes = [
  process.env.APP_SCHEME,
  process.env.NEXT_PUBLIC_URL,
  'https://dev.azzapp.com',
  'https://staging.azzapp.com',
  'https://www.azzapp.com',
  'https://azzapp.com',
];
//we had to many issue with end, add all url to avoid issue with env variable during build

export const matchUrlWithRoute = async (
  url: string,
  onOpeningRoute: (route: string) => void,
): Promise<Route | undefined> => {
  const prefix = prefixes.find(prefix => prefix && url.startsWith(prefix));
  if (!prefix) {
    return;
  }
  let withoutPrefix = url.replace(prefix, '');
  if (withoutPrefix.startsWith('/')) {
    withoutPrefix = withoutPrefix.slice(1);
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
    const username = matchProfile[1];
    const route = matchProfile[2];
    const routeId = matchProfile[3];
    if (!username) {
      return;
    }
    if (route === 'post' && routeId) {
      if (routeId) {
        return {
          route: 'POST',
          params: {
            postId: toGlobalId('Post', routeId),
          },
        };
      }
    } else if (route === 'emailSignature') {
      //this should not happen only if the user uf the open on azzap smart banner (or on android)
      onOpeningRoute('emailSignature');
      return {
        route: 'WEBCARD',
        params: {
          userName: username,
        },
      };
    }
    //this is a webCard and maybe container a download liink
    const compressedContactCard = getSearchParamFromURL(url, 'c');
    if (compressedContactCard) {
      let contactData: string;
      let signature: string;
      try {
        [contactData, signature] = JSON.parse(
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
  //if nothing was trigger, return to home
  return {
    route: 'HOME',
  };
};

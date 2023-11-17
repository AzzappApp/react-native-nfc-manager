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

const profileUrl = new RegExp('([^?]+)');
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

    const compressedContactCard = getSearchParamFromURL(url, 'c');
    if (compressedContactCard) {
      let contactData: string;
      let signature: string;
      try {
        [contactData, signature] = JSON.parse(
          decompressFromEncodedURIComponent(compressedContactCard),
        );
      } catch {
        return {
          route: 'PROFILE',
          params: {
            userName: username,
          },
        };
      }

      if (signature && contactData) {
        try {
          await verifySign({
            signature,
            data: contactData,
            salt: username,
          });

          return {
            route: 'PROFILE',
            params: {
              userName: username,
              contactData,
            },
          };
        } catch {
          return {
            route: 'PROFILE',
            params: {
              userName: username,
            },
          };
        }
      }
    } else {
      return {
        route: 'PROFILE',
        params: {
          userName: username,
        },
      };
    }
  }
};

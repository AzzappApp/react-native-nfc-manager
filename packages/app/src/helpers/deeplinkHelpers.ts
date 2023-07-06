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

export const matchUrlWithRoute = async (
  url: string,
): Promise<Route | undefined> => {
  const prefixes = [process.env.APP_SCHEME, process.env.NEXT_PUBLIC_URL];
  const prefix = prefixes.find(prefix => prefix && url.startsWith(prefix));
  if (prefix) {
    const withoutPrefix = url.replace(prefix, '');

    const regex = new RegExp('^profile/([^?]+)');

    const match = withoutPrefix.match(regex);

    if (match) {
      const username = match[1];

      const signature = decodeURIComponent(
        getSearchParamFromURL(url, 's') ?? '',
      );

      const contactData = decodeURIComponent(
        getSearchParamFromURL(url, 'c') ?? '',
      );

      if (username) {
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
          } catch (e) {
            console.error(e);
            return {
              route: 'PROFILE',
              params: {
                userName: username,
              },
            };
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
    }
  }
};

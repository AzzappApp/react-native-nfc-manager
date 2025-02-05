import { useCallback, useEffect } from 'react';
import { Linking } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import { useRouter } from '#components/NativeRouter';
import { matchUrlWithRoute } from '#helpers/deeplinkHelpers';
import { useIsAuthenticated } from './authStateHooks';
import type { NativeRouter } from '#components/NativeRouter';

export const storage = new MMKV({
  id: 'deepLink',
});

const ROUTE_KEY = '@azzapp/route';

export const useDeepLink = (router: NativeRouter | null) => {
  const authenticated = useIsAuthenticated();
  const deepLinkHandler = useCallback(
    async (url: string) => {
      const route = await matchUrlWithRoute(url);
      if (route) {
        if (authenticated) {
          if (route.route === 'HOME') {
            //routing to HOME causes that the footer menu is not displayed
            router?.backToTop();
          } else {
            router?.push(route);
          }
        } else {
          storage.set(ROUTE_KEY, JSON.stringify(route));
        }
      }
    },
    [authenticated, router],
  );

  useEffect(() => {
    const listener = Linking.addEventListener('url', ({ url }) => {
      deepLinkHandler(url).catch(err => {
        console.error(err);
      });
      return () => {
        listener.remove();
      };
    });

    return listener.remove;
  }, [deepLinkHandler]);

  useEffect(() => {
    Linking.getInitialURL()
      .then(url => {
        if (url) {
          deepLinkHandler(url).catch(err => {
            console.error(err);
          });
        }
      })
      .catch(err => {
        console.error(err);
      });
  }, [deepLinkHandler]);
};

export const useDeepLinkStoredRoute = () => {
  const router = useRouter();
  useEffect(() => {
    const route = storage.getString(ROUTE_KEY);
    if (route) {
      storage.delete(ROUTE_KEY);
      const storedRoute = JSON.parse(route);

      if (storedRoute.route === 'HOME') {
        //routing to HOME causes that the footer menu is not displayed
        router.backToTop();
      } else {
        router.push(JSON.parse(route));
      }
    }
  }, [router]);
};

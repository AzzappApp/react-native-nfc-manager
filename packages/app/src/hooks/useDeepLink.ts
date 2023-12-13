import { useCallback, useEffect } from 'react';
import { Linking } from 'react-native';
import { useRouter } from '#components/NativeRouter';
import { matchUrlWithRoute } from '#helpers/deeplinkHelpers';
import useAuthState from './useAuthState';

export const useDeepLink = () => {
  const { authenticated } = useAuthState();
  const router = useRouter();
  const deeplinkHandler = useCallback(
    async (url: string) => {
      if (authenticated) {
        const route = await matchUrlWithRoute(url);
        if (route) {
          router.push(route);
        }
      }
    },
    [authenticated, router],
  );

  useEffect(() => {
    const listener = Linking.addEventListener('url', ({ url }) => {
      deeplinkHandler(url).catch(err => {
        console.error(err);
      });
      return () => {
        listener.remove();
      };
    });

    return listener.remove;
  }, [deeplinkHandler]);

  useEffect(() => {
    Linking.getInitialURL()
      .then(url => {
        if (url) {
          deeplinkHandler(url).catch(err => {
            console.error(err);
          });
        }
      })
      .catch(err => {
        console.error(err);
      });
  }, [deeplinkHandler]);
};

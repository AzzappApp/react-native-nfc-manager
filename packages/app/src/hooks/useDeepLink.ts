import { useCallback, useEffect } from 'react';
import { useIntl } from 'react-intl';
import { Alert, Linking } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import { useRouter } from '#components/NativeRouter';
import { matchUrlWithRoute } from '#helpers/deeplinkHelpers';
import useAuthState from './useAuthState';
import type { NativeRouter } from '#components/NativeRouter';

export const storage = new MMKV({
  id: 'deepLink',
});

const ROUTE_KEY = '@azzapp/route';

export const useDeepLink = (router: NativeRouter | null) => {
  const { authenticated } = useAuthState();
  const intl = useIntl();
  const deeplinkHandler = useCallback(
    async (url: string) => {
      const route = await matchUrlWithRoute(url, (route: string) => {
        if (route === 'emailSignature') {
          Alert.alert(
            intl.formatMessage({
              defaultMessage: 'Email Signature',
              description: 'Email Signature alert title when opening on mobile',
            }),
            intl.formatMessage({
              defaultMessage:
                'Please open this link on a desktop to configure your email signature.',
              description:
                'Email Signature alert message when opening on mobile',
            }),
          );
        }
      });
      if (route) {
        if (authenticated) {
          router?.push(route);
        } else {
          storage.set(ROUTE_KEY, JSON.stringify(route));
        }
      }
    },
    [authenticated, intl, router],
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

export const useDeepLinkStoredRoute = () => {
  const router = useRouter();
  useEffect(() => {
    const route = storage.getString(ROUTE_KEY);
    if (route) {
      storage.delete(ROUTE_KEY);
      router.push(JSON.parse(route));
    }
  }, [router]);
};

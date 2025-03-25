import * as Sentry from '@sentry/react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, useColorScheme, View } from 'react-native';
import { hide as hideSplashScreen } from 'react-native-bootsplash';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import ERRORS from '@azzapp/shared/errors';
import NetworkAvailableContextProvider, {
  useNetworkAvailableFetcher,
} from '#networkAvailableContext';
import { colors } from '#theme';
import { ContextUploadProvider } from '#components/CoverEditor/CoverUploadContext';
import ErrorBoundary from '#components/ErrorBoundary';
import ErrorScreen from '#components/ErrorScreen';
import Toast from '#components/Toast';
import { addAuthStateListener, getAuthState } from '#helpers/authStore';
import { addGlobalEventListener } from '#helpers/globalEvents';
import { PermissionProvider } from '#helpers/PermissionContext';
import useApplicationFonts from '#hooks/useApplicationFonts';
import useBoolean from '#hooks/useBoolean';
import useScreenDimensions from '#hooks/useScreenDimensions';
import { OfflineVCardScreenRenderer } from '#screens/OfflineVCardScreen';
import UpdateApplicationScreen from '#screens/UpdateApplicationScreen';
import appInit from './appInit';
import AppIntlProvider from './AppIntlProvider';
import AppRouter from './AppRouter';

const initPromise = appInit();

const App = () => {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    initPromise.finally(() => {
      setReady(true);
      // TODO when should we hide the splash screen?
      setTimeout(() => {
        hideSplashScreen({ fade: true });
      }, 200);
    });
  }, []);

  const [needsUpdate, setNeedsUpdate] = useState(false);
  useEffect(
    () =>
      addGlobalEventListener('NETWORK_ERROR', ({ payload }) => {
        const { error } = payload;
        if (
          error instanceof Error &&
          error.message === ERRORS.UPDATE_APP_VERSION
        ) {
          setNeedsUpdate(true);
        }
      }),
    [],
  );

  useEffect(() => {
    const setSentryUser = async () => {
      const { profileInfos } = getAuthState();
      Sentry.setUser({
        id: profileInfos?.userId,
        username: profileInfos?.email ?? profileInfos?.phoneNumber ?? undefined,
        email: profileInfos?.email ?? undefined,
        phoneNumber: profileInfos?.phoneNumber,
      });
      Sentry.setTags({
        profileId: profileInfos?.profileId,
        webCardId: profileInfos?.webCardId,
        profileRole: profileInfos?.profileRole,
      });
    };
    setSentryUser();
    addAuthStateListener(setSentryUser);
  }, []);

  const onError = useCallback((error: Error) => {
    Sentry.captureException(error);
  }, []);

  const colorScheme = useColorScheme();

  const safeAreaBackgroundStyle = useMemo(() => {
    return {
      backgroundColor: colorScheme === 'light' ? colors.white : colors.black,
    };
  }, [colorScheme]);

  const isConnected = useNetworkAvailableFetcher();
  const [offlineScreenDisplayed, showOfflineScreen, hideOfflineScreen] =
    useBoolean(false);

  useEffect(() => {
    if (!isConnected) {
      showOfflineScreen();
    }
  }, [isConnected, showOfflineScreen]);
  const { width: screenWidth, height: screenHeight } = useScreenDimensions();

  // TODO handle errors
  const [fontLoaded] = useApplicationFonts();
  if (!ready || !fontLoaded) {
    return null;
  }

  return (
    <AppIntlProvider>
      <PermissionProvider>
        <KeyboardProvider>
          <SafeAreaProvider
            initialMetrics={Platform.select({
              android: null,
              default: initialWindowMetrics,
            })}
            style={safeAreaBackgroundStyle}
          >
            <NetworkAvailableContextProvider value={isConnected}>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <ContextUploadProvider>
                  {needsUpdate ? (
                    <UpdateApplicationScreen />
                  ) : (
                    <ErrorBoundary onError={onError}>
                      {({ error, reset }) =>
                        error ? <ErrorScreen retry={reset} /> : <AppRouter />
                      }
                    </ErrorBoundary>
                  )}
                  {offlineScreenDisplayed ? (
                    <View
                      style={{
                        width: screenWidth,
                        height: screenHeight,
                      }}
                    >
                      <OfflineVCardScreenRenderer
                        onClose={hideOfflineScreen}
                        canLeaveScreen={isConnected}
                      />
                    </View>
                  ) : undefined}
                  <Toast />
                </ContextUploadProvider>
              </GestureHandlerRootView>
            </NetworkAvailableContextProvider>
          </SafeAreaProvider>
        </KeyboardProvider>
      </PermissionProvider>
    </AppIntlProvider>
  );
};

export default App;

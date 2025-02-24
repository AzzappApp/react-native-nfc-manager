import * as Sentry from '@sentry/react-native';
import { GraphQLError } from 'graphql';
import isEqual from 'lodash/isEqual';
import React, { Suspense, useCallback, useEffect, useRef } from 'react';
import { FormattedMessage } from 'react-intl';
import { Image, useWindowDimensions, View } from 'react-native';
import {
  type PreloadedQuery,
  fetchQuery,
  useRelayEnvironment,
} from 'react-relay';
import ERRORS from '@azzapp/shared/errors';
import { FetchError, isNetworkError } from '@azzapp/shared/networkHelpers';
import { useNetworkAvailableContext } from '#networkAvailableContext';
import ErrorBoundary from '#components/ErrorBoundary';
import ErrorScreen from '#components/ErrorScreen';
import {
  useRouter,
  type NativeScreenProps,
  type ScreenOptions,
} from '#components/NativeRouter';
import { useAppState } from '#hooks/useAppState';
import Button from '#ui/Button';
import Container from '#ui/Container';
import LoadingView from '#ui/LoadingView';
import Text from '#ui/Text';
import {
  addAuthStateListener,
  getAuthState,
  type ProfileInfos,
} from './authStore';
import {
  disposeQueryFor,
  getLoadQueryInfo,
  loadQueryFor,
  useManagedQuery,
} from './RelayQueryManager';
import type { Route } from '#routes';
import type { LoadQueryOptions } from './RelayQueryManager';
import type { ScreenPrefetchOptions } from './ScreenPrefetcher';
import type { ComponentType } from 'react';
import type { EdgeInsets } from 'react-native-safe-area-context';
import type { OperationType, Subscription } from 'relay-runtime';

export type ErrorRendererProps = {
  retry: () => void;
  cancel: () => void;
  canGoBack: boolean;
};

export type RelayScreenOptions<TRoute extends Route> = LoadQueryOptions<
  TRoute['params']
> &
  ScreenPrefetchOptions<TRoute> & {
    /**
     * The fallback component to render while the query is loading.
     */
    fallback?: React.ComponentType<any> | null;
    /**
     * The component to render when an error occurs.
     */
    errorFallback?: React.ComponentType<ErrorRendererProps> | null;
    /**
     * Wether the screen can go back or not.
     *
     * @default true
     */
    canGoBack?: boolean;

    /**
     * The interval in milliseconds to poll the query.
     */
    pollInterval?: number;
    /**
     * If true, the query will be bound to the current webCard (true by default)
     * @default true
     */
    profileBound?: boolean;
    /**
     * If true, the screen will stop polling when it is not focused.
     * @default true
     */
    stopPollingWhenNotFocused?: boolean;
    /**
     * If true, the screen will refresh the query when it gains focus.
     * @default false
     */
    refreshOnFocus?: boolean;
  };

/**
 * The props injected in a screen component by the `relayScreen` HOC.
 */
export type RelayScreenProps<
  T extends Route,
  P extends OperationType,
> = NativeScreenProps<T> & {
  /**
   * The preloaded query.
   */
  preloadedQuery: PreloadedQuery<P>;
  /**
   * A function to refresh the query.
   */
  refreshQuery?: () => void;
};

/**
 * Check if a component is a relay screen.
 * @param Component The component to check.
 * @returns True if the component is a relay screen, false otherwise.
 */
export const isRelayScreen = (
  Component: any,
): Component is RelayScreenOptions<any> => {
  const type = typeof Component?.query;
  return type === 'object' || type === 'function';
};

/**
 * A HOC to wrap a screen component with a relay query.
 * @param Component  The screen component.
 * @param param1 The Query Options.
 * @returns
 */
function relayScreen<TRoute extends Route>(
  Component: ComponentType<RelayScreenProps<TRoute, any>>,
  {
    fallback,
    errorFallback,
    canGoBack = true,
    profileBound = true,
    pollInterval,
    stopPollingWhenNotFocused = true,
    refreshOnFocus = false,
    ...options
  }: RelayScreenOptions<TRoute> & {
    getScreenOptions?: (
      params: TRoute['params'],
      safeArea: EdgeInsets,
    ) => ScreenOptions;
  },
): ComponentType<Omit<RelayScreenProps<TRoute, any>, 'preloadedQuery'>> &
  typeof options & {
    getScreenOptions?: () => ScreenOptions;
  } {
  const RelayWrapper = (props: RelayScreenProps<TRoute, any>) => {
    // #region Query loading
    const {
      screenId,
      route: { params },
      hasFocus,
    } = props;

    const { preloadedQuery } = useManagedQuery((props as any).screenId) ?? {};

    useEffect(() => {
      if (!preloadedQuery && hasFocus) {
        loadQueryFor(screenId, options, params);
      }
    }, [screenId, params, preloadedQuery, hasFocus]);
    // #endregion

    // #region Auth handling
    // We need to dispose the query when the profile changes
    // if the query is profile bound
    const profileInfosRef = useRef<ProfileInfos | null>(null);
    useEffect(() => {
      profileInfosRef.current = profileBound
        ? getAuthState().profileInfos
        : null;
    }, []);

    useEffect(() => {
      addAuthStateListener(newState => {
        const newProfileInfos = profileBound ? newState.profileInfos : null;
        if (
          !isEqual(profileInfosRef.current ?? null, newProfileInfos ?? null)
        ) {
          disposeQueryFor(screenId);
          profileInfosRef.current = newProfileInfos;
        }
      });
    }, [params, screenId]);
    // #endregion

    // #region Polling
    const environment = useRelayEnvironment();
    useEffect(() => {
      let currentTimeout: any;
      let currentSubscription: Subscription | null;
      let cancelled = false;
      let retryCount = 0;
      if (
        Number.isInteger(pollInterval) &&
        (hasFocus || !stopPollingWhenNotFocused)
      ) {
        const poll = () => {
          const innerFetch = () => {
            const { query, variables } = getLoadQueryInfo(
              options,
              params,
              profileInfosRef.current,
            );
            const { useOfflineCache } = options;
            currentSubscription = fetchQuery(environment, query, variables, {
              fetchPolicy: 'network-only',
              networkCacheConfig: {
                force: true,
                metadata: { useOfflineCache },
              },
            }).subscribe({
              complete: () => {
                retryCount = 0;
                if (cancelled) {
                  return;
                }
                poll();
              },
              error: () => {
                retryCount += 1;
                setTimeout(
                  () => {
                    if (cancelled) {
                      return;
                    }
                    innerFetch();
                  },
                  2 * Math.min(retryCount, 5) * 1000,
                );
              },
            });
          };
          currentTimeout = setTimeout(innerFetch, pollInterval);
        };
        poll();
      }
      return () => {
        cancelled = true;
        currentSubscription?.unsubscribe();
        clearTimeout(currentTimeout);
      };
    }, [environment, params, hasFocus, screenId]);
    // #endregion

    // #region Query refreshing
    const refreshQuery = useCallback(() => {
      loadQueryFor(screenId, options, params, true);
    }, [params, screenId]);

    // refresh the query when the screen gains focus or when the
    // app combe back from background  or when the network is available
    // after being disconnected
    const appState = useAppState();
    const isConnected = useNetworkAvailableContext();
    const appStatePrevious = useRef(appState);
    const isConnectedPrevious = useRef(isConnected);
    const hasFocusPrevious = useRef(hasFocus);
    useEffect(() => {
      if (
        refreshOnFocus &&
        appState === 'active' &&
        hasFocus &&
        isConnected &&
        (appStatePrevious.current !== appState ||
          isConnectedPrevious.current !== isConnected ||
          hasFocusPrevious.current !== hasFocus)
      ) {
        refreshQuery();
        if (isConnectedPrevious.current !== isConnected) {
          errorBoundaryRef.current?.reset();
        }
      }
      appStatePrevious.current = appState;
      isConnectedPrevious.current = isConnected;
      hasFocusPrevious.current = hasFocus;
    }, [appState, hasFocus, isConnected, refreshQuery]);
    // #endregion

    // #region Error handling
    const router = useRouter();

    const onError = useCallback((error: Error) => {
      if (!isNetworkError(error) && error.message !== ERRORS.INVALID_TOKEN) {
        // TODO should we log more information about the error?
        Sentry.captureException(error, {
          data: 'relayScreen',
        });
      }
    }, []);

    const cancel = useCallback(() => {
      router.back();
    }, [router]);

    const errorBoundaryRef = useRef<ErrorBoundary | null>(null);
    const retry = useCallback(() => {
      errorBoundaryRef.current?.reset();
      loadQueryFor(screenId, options, params, true);
    }, [params, screenId]);
    // #endregion

    const Fallback = fallback ?? DefaultScreenFallback;
    const ErrorFallback = errorFallback ?? DefaultErrorFallback;

    return (
      <ErrorBoundary ref={errorBoundaryRef} onError={onError}>
        {({ error }) => {
          if (!error) {
            return (
              <Suspense fallback={<Fallback {...props} />}>
                {preloadedQuery ? (
                  <Component
                    {...props}
                    preloadedQuery={preloadedQuery}
                    refreshQuery={refreshQuery}
                  />
                ) : (
                  <Fallback {...props} />
                )}
              </Suspense>
            );
          }
          if (isNetworkError(error) || error.message === ERRORS.INVALID_TOKEN) {
            return <Fallback {...props} />;
          }
          if (
            error instanceof FetchError ||
            error instanceof GraphQLError ||
            error.name === 'GraphQLError'
          ) {
            return (
              <ErrorFallback
                retry={retry}
                cancel={cancel}
                canGoBack={canGoBack}
              />
            );
          }
          return <ErrorScreen retry={retry} />;
        }}
      </ErrorBoundary>
    );
  };

  const displayName = Component.displayName ?? Component.name ?? 'Screen';
  RelayWrapper.displayName = `RelayWrapper(${displayName})`;
  Object.assign(RelayWrapper, Component, {
    ...options,
    profileBound,
  });

  return RelayWrapper as any;
}

export default relayScreen;

const DefaultScreenFallback = () => {
  const { width, height } = useWindowDimensions();
  return (
    <Container style={{ width, height }}>
      <LoadingView />
    </Container>
  );
};

const DefaultErrorFallback = ({
  retry,
  cancel,
  canGoBack,
}: ErrorRendererProps) => (
  <Container
    style={{
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      gap: 10,
    }}
  >
    <Image
      source={require('#assets/logo.png')}
      style={{ width: 100, height: 100 }}
    />
    <Text variant="large">
      <FormattedMessage
        defaultMessage="Loading error"
        description="Screen alert message loading error title"
      />
    </Text>
    <Text variant="medium">
      <FormattedMessage
        defaultMessage="Could not load the data"
        description="Screen Alert message loading error"
      />
    </Text>
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {canGoBack && (
        <Button
          label={
            <FormattedMessage
              defaultMessage="Cancel"
              description="Screen alert message loading error cancel button"
            />
          }
          onPress={cancel}
          variant="secondary"
          style={{ width: 120 }}
        />
      )}
      <Button
        label={
          <FormattedMessage
            defaultMessage="Retry"
            description="Screen alert message loading error retry button"
          />
        }
        onPress={retry}
        style={{ width: 120 }}
      />
    </View>
  </Container>
);

import * as Sentry from '@sentry/react-native';
import { GraphQLError } from 'graphql';
import isEqual from 'lodash/isEqual';
import React, { Suspense, useCallback, useEffect, useRef } from 'react';
import { useIntl } from 'react-intl';
import { Alert, Appearance } from 'react-native';
import {
  type PreloadedQuery,
  fetchQuery,
  useRelayEnvironment,
} from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import ERRORS from '@azzapp/shared/errors';
import { FetchError, isNetworkError } from '@azzapp/shared/networkHelpers';
import {
  useRouter,
  type NativeScreenProps,
  useScreenHasFocus,
  type ScreenOptions,
} from '#components/NativeRouter';
import LoadingView from '#ui/LoadingView';
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
    errorFallback?: React.ComponentType<any> | null;
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
    fallback: Fallback = LoadingView,
    errorFallback: ErrorFallback,
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
    const {
      screenId,
      route: { params },
    } = props;

    const profileInfosRef = useRef<ProfileInfos | null>(null);
    useEffect(() => {
      profileInfosRef.current = profileBound
        ? getAuthState().profileInfos
        : null;
    }, []);

    useEffect(() => {
      addAuthStateListener(() => {
        const newProfileInfos = profileBound
          ? getAuthState().profileInfos
          : null;
        if (
          !isEqual(profileInfosRef.current ?? null, newProfileInfos ?? null)
        ) {
          disposeQueryFor(screenId);
          profileInfosRef.current = newProfileInfos;
        }
      });
    }, [params, screenId]);

    const { preloadedQuery } = useManagedQuery((props as any).screenId) ?? {};

    const hasFocus = useScreenHasFocus();

    useEffect(() => {
      if (!preloadedQuery && hasFocus) {
        loadQueryFor(screenId, options, params);
      }
    }, [screenId, params, preloadedQuery, hasFocus]);

    const environment = useRelayEnvironment();

    //this method is used to force refresh, mainly in case of push notification
    const refreshQuery = useCallback(() => {
      //TODO: should we had a param to refresh only when hasFocus. in case of push notification it should refresh even if the screen is not focused
      loadQueryFor(screenId, options, params, true);
    }, [params, screenId]);

    useEffect(() => {
      let currentTimeout: any;
      let currentSubscription: Subscription | null;
      let cancelled = false;
      let retryCount = 0;
      if (
        Number.isInteger(pollInterval) &&
        (props.hasFocus || !stopPollingWhenNotFocused)
      ) {
        const poll = (interval?: number) => {
          currentTimeout = setTimeout(
            () => {
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
                  poll(pollInterval);
                },
                error: () => {
                  retryCount += 1;
                  setTimeout(
                    () => {
                      if (cancelled) {
                        return;
                      }
                      poll(pollInterval);
                    },
                    2 ** Math.min(retryCount, 5) * 1000,
                  );
                },
              });
            },
            interval ?? (refreshOnFocus ? 0 : pollInterval),
          );
        };
        poll();
      }
      return () => {
        cancelled = true;
        currentSubscription?.unsubscribe();
        clearTimeout(currentTimeout);
      };
    }, [environment, params, props.hasFocus, screenId]);

    const intl = useIntl();
    const router = useRouter();

    const isInErrorState = useRef(false);
    const errorBoundaryRef = useRef<RelayScreenErrorBoundary>(null);
    const retry = useCallback(() => {
      isInErrorState.current = false;
      loadQueryFor(screenId, options, params, true);
      errorBoundaryRef.current?.reset();
    }, [params, screenId]);

    const onError = useCallback(
      (error: Error) => {
        Sentry.captureException(error, { data: 'relayScreen' });
        if (isInErrorState.current) {
          return;
        }

        isInErrorState.current = true;
        Alert.alert(
          intl.formatMessage({
            defaultMessage: 'Loading error',
            description: 'Screen alert message loading error title',
          }),
          intl.formatMessage({
            defaultMessage: 'Could not load the data',
            description: 'Screen Alert message loading error',
          }),
          convertToNonNullArray([
            canGoBack
              ? {
                  text: intl.formatMessage({
                    defaultMessage: 'Cancel',
                    description:
                      'Screen alert message loading error cancel button',
                  }),
                  onPress: () => {
                    isInErrorState.current = false;
                    router.back();
                  },
                  style: 'cancel',
                }
              : null,
            {
              text: intl.formatMessage({
                defaultMessage: 'Retry',
                description: 'Screen alert message loading error retry button',
              }),
              onPress: () => retry(),
            },
          ]),
          {
            userInterfaceStyle: Appearance.getColorScheme() ?? 'light',
          },
        );
      },
      [intl, retry, router],
    );

    const inner = (
      <Suspense fallback={Fallback ? <Fallback {...props} /> : null}>
        {preloadedQuery && (
          <Component
            {...props}
            preloadedQuery={preloadedQuery}
            refreshQuery={refreshQuery}
          />
        )}
      </Suspense>
    );
    if (__DEV__) {
      return inner;
    }

    ErrorFallback = ErrorFallback ?? Fallback;
    return (
      <RelayScreenErrorBoundary
        ref={errorBoundaryRef}
        onError={onError}
        fallback={
          ErrorFallback ? <ErrorFallback {...props} retry={retry} /> : null
        }
      >
        {inner}
      </RelayScreenErrorBoundary>
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

const isRelayNetworkError = (error: Error) => {
  if (error instanceof FetchError && error.message !== ERRORS.INVALID_TOKEN) {
    return true;
  }
  if (error instanceof GraphQLError || error.name === 'GraphQLError') {
    return true;
  }
  if (isNetworkError(error)) {
    return true;
  }
  return false;
};

export type RelayScreenErrorBoundaryProps = {
  fallback: React.ReactNode;
  children: React.ReactNode;
  onError: (error: Error) => void;
};

export class RelayScreenErrorBoundary extends React.Component<
  RelayScreenErrorBoundaryProps,
  { error: Error | null }
> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  reset() {
    this.setState({ error: null });
  }

  componentDidCatch(error: Error) {
    if (isRelayNetworkError(error)) {
      this.props.onError?.(error);
    }
  }

  render() {
    const { children, fallback } = this.props;
    const { error } = this.state;
    if (error) {
      if (!isRelayNetworkError(error)) {
        throw error;
      }
      return fallback;
    }
    return children;
  }
}

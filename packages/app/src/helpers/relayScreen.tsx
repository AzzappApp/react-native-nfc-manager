import { GraphQLError } from 'graphql';
import React, { Suspense, useCallback, useEffect, useRef } from 'react';
import { useIntl } from 'react-intl';
import { Alert, Appearance } from 'react-native';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import ERRORS from '@azzapp/shared/errors';
import {
  FetchError,
  TIMEOUT_ERROR_MESSAGE,
} from '@azzapp/shared/networkHelpers';
import { useRouter, type NativeScreenProps } from '#components/NativeRouter';
import { loadQueryFor, useManagedQuery } from './RelayQueryManager';
import type { Route } from '#routes';
import type { LoadQueryOptions } from './RelayQueryManager';
import type { ComponentType } from 'react';
import type { PreloadedQuery } from 'react-relay';
import type { OperationType } from 'relay-runtime';

export type RelayScreenOptions<U> = LoadQueryOptions<U> & {
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
  canGoback?: boolean;
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
function relayScreen<T extends RelayScreenProps<any, any>>(
  Component: ComponentType<T>,
  {
    fallback: Fallback,
    errorFallback: ErrorFallback,
    canGoback = true,
    ...options
  }: RelayScreenOptions<T['route']['params']>,
): ComponentType<Omit<T, 'preloadedQuery'>> & typeof options {
  const RelayWrapper = (props: T) => {
    const {
      screenId,
      route: { params },
    } = props;
    const preloadedQuery = useManagedQuery((props as any).screenId)!;
    useEffect(() => {
      if (!preloadedQuery) {
        loadQueryFor(screenId, options, params);
      }
    }, [screenId, params, preloadedQuery]);

    const intl = useIntl();
    const router = useRouter();

    const isInErrorState = useRef(false);
    const erroBoundaryRef = useRef<RelayScreenErrorBoundary>(null);
    const retry = useCallback(() => {
      isInErrorState.current = false;
      loadQueryFor(screenId, options, params, true);
      erroBoundaryRef.current?.reset();
    }, [params, screenId]);

    const onError = useCallback(() => {
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
          canGoback
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
    }, [intl, retry, router]);

    ErrorFallback = ErrorFallback ?? Fallback;
    return (
      <RelayScreenErrorBoundary
        ref={erroBoundaryRef}
        onError={onError}
        fallback={
          ErrorFallback ? <ErrorFallback {...props} retry={retry} /> : null
        }
      >
        <Suspense fallback={Fallback ? <Fallback {...props} /> : null}>
          {preloadedQuery && (
            <Component {...props} preloadedQuery={preloadedQuery} />
          )}
        </Suspense>
      </RelayScreenErrorBoundary>
    );
  };

  const displayName = Component.displayName ?? Component.name ?? 'Screen';
  RelayWrapper.displayName = `RelayWrapper(${displayName})`;
  Object.assign(RelayWrapper, Component, options);

  return RelayWrapper as any;
}

export default relayScreen;

const isRelayNetworkError = (error: Error) => {
  if (error instanceof FetchError && error.message !== ERRORS.INVALID_TOKEN) {
    return true;
  }
  if (error instanceof GraphQLError) {
    return true;
  }
  if (
    error instanceof TypeError &&
    (error.message === 'Network request failed' ||
      error.message === TIMEOUT_ERROR_MESSAGE)
  ) {
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

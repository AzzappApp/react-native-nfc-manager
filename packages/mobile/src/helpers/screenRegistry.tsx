import { PlatformEnvironmentProvider } from '@azzapp/app/lib/PlatformEnvironment';
import { useMemo, Suspense } from 'react';
import { Navigation } from 'react-native-navigation';
import { RelayEnvironmentProvider, usePreloadedQuery } from 'react-relay';
import createPlatformEnvironment from './createPlatformEnvironment';
import { useQueryLoaderQuery, registerComponentQuery } from './QueryLoader';
import { getRelayEnvironment } from './relayEnvironment';
import type { Routes } from '@azzapp/shared/lib/routes';
import type { ComponentType } from 'react';
import type { Options } from 'react-native-navigation';
import type { GraphQLTaggedNode, PreloadedQuery } from 'react-relay';
import type { OperationType } from 'relay-runtime';

export type ScreenOption<T> = {
  component: ComponentType<T>;
  options?: Options | ((props: T) => Options);
};

export type RelayScreenOptions<
  T extends { data: U['response']; params?: any },
  U extends OperationType,
> = {
  component: ComponentType<T>;
  query: GraphQLTaggedNode | ((params: T['params']) => GraphQLTaggedNode);
  fallback?: React.ComponentType<any> | null;
  getVariables?: (params: T['params']) => U['variables'];
  options?: Options | ((props: T) => Options | null);
};

export type ScreenRegistryOptions = {
  // if one day typescript let us provide something else than any here ...
  [key in Routes]: RelayScreenOptions<any, any> | ScreenOption<any>;
};

export const registerScreens = (options: ScreenRegistryOptions) => {
  Object.entries(options).forEach(([route, screenDef]) => {
    let component = screenDef.component;
    if (isRelayScreen(screenDef)) {
      component = wrapRelayScreen(screenDef.component, screenDef.fallback);
      registerComponentQuery(route, screenDef);
    }
    Navigation.registerComponent(
      route,
      createScreenProvider(component, screenDef.options),
    );
  });
};

const isRelayScreen = (
  screen: RelayScreenOptions<any, any> | ScreenOption<any>,
): screen is RelayScreenOptions<any, any> => {
  return (screen as any).query != null;
};

const defaultScreenOptions: Options = {
  topBar: { visible: false },
  bottomTabs: { visible: false },
};

function createScreenProvider<T>(
  Component: ComponentType<T>,
  options: Options | ((props: T) => Options | null) = defaultScreenOptions,
) {
  const Screen = (props: T) => {
    const componentId: string = (props as any).componentId;
    const platformEnvironment = useMemo(
      () => createPlatformEnvironment(componentId),
      [componentId],
    );
    return (
      <RelayEnvironmentProvider environment={getRelayEnvironment()}>
        <PlatformEnvironmentProvider value={platformEnvironment}>
          <Component {...props} />
        </PlatformEnvironmentProvider>
      </RelayEnvironmentProvider>
    );
  };

  const componentName = Component.displayName ?? Component.name ?? 'Screen';

  Screen.displayName = `ScreenProvider(${componentName})`;

  Screen.options = options
    ? typeof options === 'function'
      ? (props: any) => ({ ...defaultScreenOptions, ...options(props) })
      : { ...defaultScreenOptions, ...options }
    : defaultScreenOptions;

  return () => Screen;
}

function wrapRelayScreen<
  T extends { data: U['response']; params?: any },
  U extends OperationType,
>(Component: ComponentType<T>, Fallback?: React.ComponentType<any> | null) {
  const RelayWrapper = (props: Omit<T, 'data'>) => {
    const [query, preloadedQuery] = useQueryLoaderQuery(
      (props as any).componentId,
    )!;
    return (
      <Suspense fallback={Fallback ? <Fallback {...props} /> : null}>
        {preloadedQuery && (
          <RelayScreenWrapper
            query={query}
            component={Component}
            screenProps={props}
            preloadedQuery={preloadedQuery}
          />
        )}
      </Suspense>
    );
  };

  const displayName = Component.displayName ?? Component.name ?? 'Screen';
  RelayWrapper.displayName = `RelayWrapper(${displayName})`;
  return RelayWrapper;
}

type RelayScreenWrapperProps<
  T extends { data: U['response'] },
  U extends OperationType,
> = {
  component: React.ComponentType<any>;
  query: GraphQLTaggedNode;
  preloadedQuery: PreloadedQuery<U>;
  screenProps: Omit<T, 'data'>;
};

function RelayScreenWrapper<
  T extends { data: U['response'] },
  U extends OperationType,
>({
  component: Component,
  query,
  preloadedQuery,
  screenProps,
}: RelayScreenWrapperProps<T, U>) {
  const data = usePreloadedQuery(query, preloadedQuery);
  return <Component data={data} {...screenProps} />;
}

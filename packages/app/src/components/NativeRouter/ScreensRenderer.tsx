import EventEmitter from 'events';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import memoize from 'lodash/memoize';
import { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import {
  Platform,
  StyleSheet,
  type NativeSyntheticEvent,
  type TargetedEvent,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen, ScreenContainer, ScreenStack } from 'react-native-screens';
import useLatestCallback from '#hooks/useLatestCallback';
import { ScreenRendererContext } from './routerContexts';
import { useRouter } from './routerHooks';
import type { Route, ROUTES } from '#routes';
import type {
  NativeScreenProps,
  RouterState,
  ScreenOptions,
  StackState,
  TabsState,
} from './routerTypes';
import type { ReactNode, ComponentType } from 'react';

export type ScreenMap = Record<ROUTES, ComponentType<NativeScreenProps<any>>>;

type TabsMap = Partial<
  Record<string, ComponentType<TabsState & { id: string; hasFocus?: boolean }>>
>;

export type ScreensRendererProps = {
  routerState: RouterState;
  screens: ScreenMap;
  tabs?: TabsMap;
  defaultScreenOptions?: ScreenOptions | null;
  onFinishTransitioning?: (e: NativeSyntheticEvent<TargetedEvent>) => void;
  onScreenHasBeenDismissed?: (id: string) => void;
};

const emptyTabsMap = {};

export const ScreensRenderer = ({
  routerState,
  screens,
  tabs = emptyTabsMap,
  defaultScreenOptions,
  onFinishTransitioning,
  onScreenHasBeenDismissed,
}: ScreensRendererProps) => {
  const { stack, modals } = routerState;

  const router = useRouter();
  const onScreenHasBeenDismissedLatest = useLatestCallback(
    onScreenHasBeenDismissed,
  );
  const onScreenDismissed = useCallback(
    (id: string) => {
      router.__screenDismissed(id);
      onScreenHasBeenDismissedLatest(id);
    },
    [router, onScreenHasBeenDismissedLatest],
  );

  const modalDismissed = useMemo(
    () => memoize((modalId: string) => () => onScreenDismissed(modalId)),
    [onScreenDismissed],
  );

  const onFinishTransitioningLatest = useLatestCallback(onFinishTransitioning);

  const currentScreenId = router.getCurrentScreenId();

  // useMemo here instead of memo the component itself
  // to avoid re-rendering the whole tree when callbacks change (onScreenDismissed, onFinishTransitioning)
  return useMemo(
    () => (
      <BottomSheetModalProvider>
        <StackRenderer
          stack={stack}
          screens={screens}
          tabsRenderers={tabs}
          defaultScreenOptions={defaultScreenOptions}
          onFinishTransitioning={onFinishTransitioningLatest}
          onScreenDismissed={onScreenDismissed}
          hasFocus={modals.length === 0}
        >
          {modals
            .filter(({ ownerId }) => ownerId === currentScreenId)
            .map(({ id, children, animationType, gestureEnabled }) => (
              <Screen
                key={id}
                activityState={2}
                isNativeStack
                gestureEnabled={gestureEnabled}
                onDismissed={modalDismissed(id)}
                stackAnimation={
                  animationType === 'fade'
                    ? 'fade'
                    : animationType === 'none'
                      ? 'none'
                      : 'slide_from_bottom'
                }
                hideKeyboardOnSwipe
                style={StyleSheet.absoluteFill}
              >
                <GestureHandlerRootView style={styles.flex}>
                  {children}
                </GestureHandlerRootView>
              </Screen>
            ))}
        </StackRenderer>
      </BottomSheetModalProvider>
    ),
    [
      currentScreenId,
      defaultScreenOptions,
      modalDismissed,
      modals,
      onFinishTransitioningLatest,
      onScreenDismissed,
      screens,
      stack,
      tabs,
    ],
  );
};

const StackRenderer = ({
  stack,
  screens,
  tabsRenderers,
  defaultScreenOptions,
  hasFocus,
  children,
  onScreenDismissed,
  onFinishTransitioning,
}: {
  stack: StackState;
  screens: ScreenMap;
  tabsRenderers: TabsMap;
  defaultScreenOptions?: ScreenOptions | null;
  hasFocus?: boolean;
  children?: ReactNode;
  onFinishTransitioning?: (e: NativeSyntheticEvent<TargetedEvent>) => void;
  onScreenDismissed?: (id: string) => void;
}) => {
  // Memoize the screens to avoid re-rendering them when children change (modals)
  const childScreens = useMemo(
    () =>
      stack.map((routeInfo, index) => {
        const screenHasFocus = hasFocus && index === stack.length - 1;
        if (routeInfo.kind === 'tabs') {
          return (
            <Screen
              key={routeInfo.id}
              enabled
              isNativeStack
              style={StyleSheet.absoluteFill}
              hideKeyboardOnSwipe
              {...routeInfo.state.screenOptions}
            >
              <TabsRenderer
                id={routeInfo.id}
                tabState={routeInfo.state}
                screens={screens}
                tabsRenderers={tabsRenderers}
                defaultScreenOptions={defaultScreenOptions}
                onFinishTransitioning={onFinishTransitioning}
                onScreenDismissed={onScreenDismissed}
                hasFocus={screenHasFocus}
              />
            </Screen>
          );
        }

        return (
          <ScreenRenderer
            key={routeInfo.id}
            id={routeInfo.id}
            {...routeInfo.state}
            defaultScreenOptions={defaultScreenOptions}
            screens={screens}
            onScreenDismissed={onScreenDismissed}
            hasFocus={screenHasFocus}
            isNativeStack
          />
        );
      }),
    [
      stack,
      hasFocus,
      defaultScreenOptions,
      screens,
      onScreenDismissed,
      tabsRenderers,
      onFinishTransitioning,
    ],
  );

  return (
    <ScreenStack
      style={styles.flex}
      onFinishTransitioning={onFinishTransitioning}
    >
      {childScreens}
      {children}
    </ScreenStack>
  );
};

const TabsRenderer = ({
  id,
  tabState,
  tabsRenderers,
  screens,
  defaultScreenOptions,
  hasFocus,
  onScreenDismissed,
  onFinishTransitioning,
}: {
  id: string;
  tabState: TabsState;
  tabsRenderers: TabsMap;
  screens: ScreenMap;
  defaultScreenOptions?: ScreenOptions | null;
  hasFocus?: boolean;
  onScreenDismissed?: (id: string) => void;
  onFinishTransitioning?: (e: NativeSyntheticEvent<TargetedEvent>) => void;
}) => {
  const TabsListRenderer = tabsRenderers[id];
  const { tabs, currentIndex, lazy, unmountInactive, tabsHistory } = tabState;

  const tabsToRender = useMemo(() => {
    if (unmountInactive) {
      return [{ index: currentIndex, routeInfo: tabs[currentIndex] }];
    }
    const tabsWithIndex = tabs.map((routeInfo, index) => ({
      index,
      routeInfo,
    }));
    if (lazy) {
      return tabsWithIndex.filter(
        ({ index }) => tabsHistory.includes(index) || index === currentIndex,
      );
    }
    return tabsWithIndex;
  }, [unmountInactive, lazy, tabs, currentIndex, tabsHistory]);

  // does this `useMemo` make sense? Not sure
  // but it doesn't hurt to memoize the whole thing
  const tabsScreens = useMemo(
    () => (
      <ScreenContainer style={styles.flex} hasTwoStates>
        {tabsToRender.map(({ routeInfo, index }) => {
          const screenHasFocus = hasFocus && index === currentIndex;

          const isActive = currentIndex === index;
          if (routeInfo.kind === 'stack') {
            return (
              <Screen
                key={routeInfo.id}
                activityState={isActive ? 2 : 0}
                enabled
                style={StyleSheet.absoluteFill}
                hideKeyboardOnSwipe
              >
                <StackRenderer
                  stack={routeInfo.state}
                  screens={screens}
                  tabsRenderers={tabsRenderers}
                  defaultScreenOptions={defaultScreenOptions}
                  onFinishTransitioning={onFinishTransitioning}
                  // we don't dispatch onDismissed for tab switch
                  onScreenDismissed={isActive ? onScreenDismissed : undefined}
                  hasFocus={screenHasFocus}
                />
              </Screen>
            );
          }

          return (
            <ScreenRenderer
              {...routeInfo.state}
              key={routeInfo.id}
              id={routeInfo.id}
              activityState={currentIndex === index ? 2 : 0}
              defaultScreenOptions={defaultScreenOptions}
              screens={screens}
              isNativeStack={false}
              hasFocus={screenHasFocus}
            />
          );
        })}
      </ScreenContainer>
    ),
    [
      tabsToRender,
      hasFocus,
      currentIndex,
      defaultScreenOptions,
      screens,
      tabsRenderers,
      onFinishTransitioning,
      onScreenDismissed,
    ],
  );

  const tabsList = useMemo(
    () =>
      TabsListRenderer ? (
        <TabsListRenderer id={id} {...tabState} hasFocus={hasFocus} />
      ) : null,
    [TabsListRenderer, id, tabState, hasFocus],
  );

  return (
    <>
      {tabsScreens}
      {tabsList}
    </>
  );
};

type ScreenRendererProps = Route & {
  id: string;
  screens: ScreenMap;
  activityState?: 0 | 1 | 2;
  isNativeStack?: boolean;
  defaultScreenOptions?: ScreenOptions | null;
  hasFocus?: boolean;
  onScreenDismissed?: (id: string) => void;
};

const ScreenRenderer = ({
  id,
  route,
  params,
  screens,
  activityState,
  defaultScreenOptions,
  hasFocus,
  isNativeStack,
  onScreenDismissed,
}: ScreenRendererProps) => {
  const Component: any = screens[route];

  const navigationEventEmitter = useRef(new EventEmitter()).current;
  navigationEventEmitter.setMaxListeners(Infinity);
  const safeArea = useSafeAreaInsets();

  useEffect(
    () => () => {
      navigationEventEmitter.removeAllListeners();
    },
    [navigationEventEmitter],
  );

  const [options, setOptions] = useState(() => {
    let options: ScreenOptions | null = defaultScreenOptions ?? null;
    if (typeof Component.options === 'object') {
      options = { ...options, ...Component.options };
    }
    if (typeof Component.getScreenOptions === 'function') {
      options = { ...options, ...Component.getScreenOptions(params, safeArea) };
    }
    return options;
  });

  const [didAppear, setDidAppear] = useState(false);
  const screenContextValue = useMemo(
    () => ({
      id,
      navigationEventEmitter,
      hasFocus,
      didAppear,
      setOptions,
    }),
    [id, navigationEventEmitter, didAppear, hasFocus],
  );

  const onAppear = useCallback(() => {
    navigationEventEmitter.emit('appear');
    setDidAppear(true);
  }, [navigationEventEmitter]);

  const onDismissed = useCallback(() => {
    // TODO this event might be dispatched on tab switch which has no sense
    navigationEventEmitter.emit('dismissed');
    onScreenDismissed?.(id);
  }, [id, navigationEventEmitter, onScreenDismissed]);

  const onWillAppear = useCallback(() => {
    navigationEventEmitter.emit('willAppear');
  }, [navigationEventEmitter]);

  const onWillDisappear = useCallback(() => {
    navigationEventEmitter.emit('willDisappear');
  }, [navigationEventEmitter]);

  const onDisappear = useCallback(() => {
    navigationEventEmitter.emit('disappear');
  }, [navigationEventEmitter]);

  const currentRoute = useMemo(() => ({ route, params }), [route, params]);

  const content = useMemo(
    () =>
      Component ? (
        <Component screenId={id} hasFocus={hasFocus} route={currentRoute} />
      ) : null,
    [Component, id, hasFocus, currentRoute],
  );
  const [delayedState, setDelayedState] = useState(activityState);

  useEffect(() => {
    if (Platform.OS === 'android') {
      // workaround for android
      // when we switch between 2 tabs, react native skia is unmounted too quickly
      // due to new activityState. Adding a very small delay to make the new tab active
      // allows to hide this issue
      // The 2 tabs will be inactive at the same time
      if (activityState === 0) {
        setTimeout(() => {
          setDelayedState(activityState);
        }, 20);
      } else {
        setDelayedState(activityState);
      }
    }
  }, [activityState]);

  if (!Component) {
    console.error(`Unknown component for route ${route}`);
    return null;
  }

  return (
    <Screen
      {...options}
      key={id}
      activityState={Platform.OS === 'android' ? delayedState : activityState}
      isNativeStack={isNativeStack}
      onAppear={onAppear}
      onWillAppear={onWillAppear}
      onDisappear={onDisappear}
      onWillDisappear={onWillDisappear}
      onDismissed={onDismissed}
      style={StyleSheet.absoluteFill}
      hideKeyboardOnSwipe
    >
      <ScreenRendererContext.Provider value={screenContextValue}>
        {content}
      </ScreenRendererContext.Provider>
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
});

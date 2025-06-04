import {
  createContext,
  createRef,
  forwardRef,
  useCallback,
  useContext,
  useImperativeHandle,
  useRef,
} from 'react';
import { ScrollView, View } from 'react-native';
import type { RefObject, Ref, ForwardedRef } from 'react';
import type {
  LayoutRectangle,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollViewProps,
} from 'react-native';

export type ChildPositionAwareScrollViewProps = ScrollViewProps & {
  ScrollViewComponent?: React.ComponentType<ScrollViewProps>;
  renderScrollView?: (
    props: ScrollViewProps & {
      ref: Ref<ScrollView>;
    },
  ) => React.ReactNode;
};

export type ChildPositionAwareScrollViewHandle = {
  getTopChildId: () => Promise<string | null>;
  scrollToChild: (childId: string) => Promise<void>;
  scrollTo: (args: { y: number; animated?: boolean }) => void;
  getContentInfos: () => Promise<{
    scrollY: number;
    scrollViewLayout: LayoutRectangle;
    childInfos: Array<{
      childId: string;
      layout: LayoutRectangle;
      ref: View;
    }>;
  } | null>;
};

const ChildPositionAwareScrollView = (
  {
    ScrollViewComponent = ScrollView,
    renderScrollView,
    contentContainerStyle,
    onScroll,
    children,
    ...props
  }: ChildPositionAwareScrollViewProps,
  ref: ForwardedRef<ChildPositionAwareScrollViewHandle>,
) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollViewContentRef = useRef<View>(null);
  const scrollViewChildRefs = useRef<{ [id: string]: RefObject<View | null> }>(
    {},
  );
  const scrollPositionRef = useRef<number>(0);

  const scrollViewChildRef = useCallback((id: string) => {
    if (!scrollViewChildRefs.current[id]) {
      scrollViewChildRefs.current[id] = createRef();
    }
    return scrollViewChildRefs.current[id];
  }, []);

  const onScrollInner = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollPositionRef.current = event.nativeEvent.contentOffset.y;
      onScroll?.(event);
    },
    [onScroll],
  );

  const getTopChildId = useCallback(async () => {
    const scrollView = scrollViewRef.current;
    if (!scrollView) {
      return null;
    }
    const childPositions = (
      await Promise.all(
        Object.entries(scrollViewChildRefs.current).map(
          async ([childId, ref]) => {
            const view = ref.current;
            if (!view) {
              return null;
            }
            return {
              childId,
              y: (await measureLayout(view, scrollView)).y,
            };
          },
        ),
      )
    )
      .filter(child => !!child)
      .sort((a, b) => a.y - b.y);

    const scrollPosition = scrollPositionRef.current;
    let currentChildId: string | null = null;
    let currentDelta = Infinity;
    for (const child of childPositions) {
      const delta = scrollPosition - child.y;
      if (delta >= 0 && delta < currentDelta) {
        currentChildId = child.childId;
        currentDelta = scrollPosition - child.y;
      }
    }
    return currentChildId ?? null;
  }, []);

  const scrollToChild = useCallback(async (childId: string) => {
    const scrollView = scrollViewRef.current;
    if (!scrollView) {
      return;
    }
    const view = scrollViewChildRefs.current[childId]?.current;
    if (!view) {
      return;
    }
    const childLayout = await measureLayout(view, scrollView);
    const scrollPosition = childLayout.y;
    scrollPositionRef.current = scrollPosition;
    scrollView.scrollTo({
      y: scrollPosition,
      animated: false,
    });
  }, []);

  const scrollTo = useCallback(
    ({ y, animated = true }: { y: number; animated?: boolean }) => {
      const scrollView = scrollViewRef.current;
      if (!scrollView) {
        return;
      }
      scrollPositionRef.current = y;
      scrollView.scrollTo({ y, animated });
    },
    [],
  );

  const getContentInfos = useCallback(async () => {
    const scrollView = scrollViewRef.current;
    if (!scrollView) {
      return null;
    }
    const [scrollViewLayout, childInfos] = await Promise.all([
      new Promise<LayoutRectangle>(resolve => {
        (scrollView as unknown as View).measureInWindow(
          (x, y, width, height) => {
            resolve({
              width,
              height,
              x,
              y,
            });
          },
        );
      }),
      Promise.all(
        Object.entries(scrollViewChildRefs.current).map(
          async ([childId, ref]) => {
            const view = ref.current;
            if (!view) {
              return null;
            }
            return {
              childId,
              layout: await measureLayout(view, scrollView),
              ref: view,
            };
          },
        ),
      ),
    ]);

    const scrollY = scrollPositionRef.current;
    return {
      scrollY,
      scrollViewLayout,
      childInfos: childInfos.filter(child => !!child),
    };
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      getTopChildId,
      scrollToChild,
      scrollTo,
      getContentInfos,
    }),
    [getTopChildId, scrollTo, getContentInfos, scrollToChild],
  );

  children = (
    <View
      ref={scrollViewContentRef}
      style={contentContainerStyle}
      collapsable={false}
    >
      {children}
    </View>
  );

  return (
    <ChildPositionAwareScrollViewContext.Provider
      value={{ scrollViewChildRef }}
    >
      {renderScrollView ? (
        renderScrollView({
          ref: scrollViewRef,
          ...props,
          onScroll: onScrollInner,
          contentContainerStyle,
          children,
        })
      ) : (
        <ScrollViewComponent
          // @ts-expect-error cannot be typed properly
          ref={scrollViewRef}
          {...props}
          onScroll={onScrollInner}
          contentContainerStyle={contentContainerStyle}
        >
          {children}
        </ScrollViewComponent>
      )}
    </ChildPositionAwareScrollViewContext.Provider>
  );
};

export default forwardRef(ChildPositionAwareScrollView);

const ChildPositionAwareScrollViewContext = createContext<{
  scrollViewChildRef: (id: string) => Ref<View>;
} | null>(null);

export const useScrollViewChildRef = (id: string) => {
  const context = useContext(ChildPositionAwareScrollViewContext);
  if (!context) {
    throw new Error(
      'useScrollViewChildRef must be used within a ChildPositionAwareScrollViewProvider',
    );
  }
  return context.scrollViewChildRef(id);
};

const measureLayout = (node: View, parent: any) =>
  new Promise<LayoutRectangle>(resolve => {
    node.measureLayout(parent, (x, y, width, height) => {
      resolve({
        width,
        height,
        x,
        y,
      });
    });
  });

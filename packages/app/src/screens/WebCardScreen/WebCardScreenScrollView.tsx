import {
  createContext,
  useCallback,
  useMemo,
  useRef,
  useState,
  forwardRef,
} from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  FadeOut,
  enableLayoutAnimations,
  interpolate,
  measure,
  runOnJS,
  useAnimatedRef,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { mergeRefs } from '#helpers/mergeRefs';
import useScreenInsets from '#hooks/useScreenInsets';
import { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';
import { HEADER_HEIGHT } from '#ui/Header';
import {
  BUTTON_SIZE,
  EDIT_BLOCK_GAP,
  EDIT_TRANSITION_DURATION,
  useWebCardEditScale,
} from './webCardScreenHelpers';
import {
  useEditTransition,
  useEditTransitionListeners,
} from './WebCardScreenTransitions';
import type { ForwardedRef, ReactNode } from 'react';
import type {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollViewProps,
  View,
} from 'react-native';

export type WebCardScreenScrollViewProps = ScrollViewProps & {
  /**
   * Whether the webCard is in edit mode
   */
  editing: boolean;
  /**
   * Whether the webCard is in edit mode
   */
  allBlockLoaded: boolean;
  /**
   * Footer
   */
  editFooter: ReactNode;
  /**
   * Footer
   */
  editFooterHeight: number;
};

/**
 * A wrapper component for the webCard screen content. Handle the edit animation
 */
const WebCardScreenScrollView = (
  {
    editing,
    allBlockLoaded,
    children,
    onScroll,
    editFooter,
    editFooterHeight,
    ...props
  }: WebCardScreenScrollViewProps,
  forwardedRef: ForwardedRef<ScrollView>,
) => {
  const editScale = useWebCardEditScale();
  const editTransition = useEditTransition();
  const [editTransitionActive, setEditTransitionActive] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  const blockContainerRef = useAnimatedRef<View>();
  const blocks = useRef<{
    [key: string]: {
      index: number;
      height: number;
      visible: boolean;
    };
  }>({});

  const [blockCount, setBlockCount] = useState(0);

  const blockCountsUpdateTimeout = useRef<any>(null);
  const updateBlockCounts = useCallback(() => {
    if (blockCountsUpdateTimeout.current) {
      clearTimeout(blockCountsUpdateTimeout.current);
    }
    blockCountsUpdateTimeout.current = setTimeout(() => {
      blockCountsUpdateTimeout.current = null;
      setBlockCount(Object.keys(blocks.current).length);
    }, 100);
  }, []);

  const scrollPositionInfos = useRef<{
    position: number;
    editPosition: number;
  }>({
    position: 0,
    editPosition: 0,
  });

  const onScrollInner = useCallback(
    (scrollEvent: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (editTransitionActive) {
        return;
      }
      const editing = editTransition?.value ?? 0 > 0;
      const blockSortedByIndex = Object.entries(blocks.current)
        .sort(([, a], [, b]) => a.index - b.index)
        .map(([id, value]) => ({ id, ...value }));

      // TODO we assume the height of the scroll view
      // it would be better to get it from the layout but the value will change between
      // editing and not editing
      const scrollViewHeight = Dimensions.get('window').height;
      const scrollViewEditingHeight = scrollViewHeight - editFooterHeight;
      const y =
        scrollEvent.nativeEvent.contentOffset.y +
        (editing ? scrollViewEditingHeight : scrollViewHeight) / 2;

      let middleBlockPosition = 0;
      let middleBlockEditPosition = 20;
      let middleBlockHeight = 0;
      let middleBlockEditHeight = 0;
      for (const block of blockSortedByIndex) {
        const nextBlockHeight = block.visible ? block.height : 0;
        const nextBlockEditHeight =
          (Math.max(block.height, BUTTON_SIZE) +
            (EDIT_BLOCK_GAP / editScale) * 2) *
          editScale;
        const nextPosition = middleBlockPosition + nextBlockHeight;
        const nextEditPosition = middleBlockEditPosition + nextBlockEditHeight;

        if ((editing ? nextEditPosition : nextPosition) >= y) {
          break;
        }
        middleBlockPosition = nextPosition;
        middleBlockEditPosition = nextEditPosition;
        middleBlockHeight = nextBlockHeight;
        middleBlockEditHeight = nextBlockEditHeight;
      }

      scrollPositionInfos.current = {
        position: Math.max(
          middleBlockPosition - scrollViewHeight / 2 + middleBlockHeight / 2,
          0,
        ),
        editPosition: Math.max(
          middleBlockEditPosition -
            scrollViewEditingHeight / 2 +
            middleBlockEditHeight / 2 -
            HEADER_HEIGHT,
          0,
        ),
      };
      onScroll?.(scrollEvent);
    },
    [
      editTransitionActive,
      editTransition,
      editFooterHeight,
      onScroll,
      editScale,
    ],
  );

  useEditTransitionListeners({
    start: editing => {
      setEditTransitionActive(true);
      enableLayoutAnimations(false);

      // TODO we launch the scroll animation in this event but it would be better to do it
      // with a controlled useAnimatedProps (or something like it) once reanimated allows it
      // in the meantime using scrollTo multiple time in a row in a reaction create flickering
      // in the animation, so this is a workaround that at least keeps the animation smooth
      const { position, editPosition } = scrollPositionInfos.current;
      scrollViewRef.current?.scrollTo({
        y: editing ? editPosition : position,
        animated: true,
      });
    },
    end: () => {
      setEditTransitionActive(false);
      enableLayoutAnimations(true);
    },
  });

  const insets = useScreenInsets();
  const containerStyle = useAnimatedStyle(() => {
    return {
      top: (editTransition?.value ?? 0) * (insets.top + HEADER_HEIGHT),
    };
  });

  const contentContainerStyle = useAnimatedStyle(() => {
    return {
      paddingVertical: (editTransition?.value ?? 0) * 20,
    };
  });

  const [needReComputeHeight, setNeedReComputeHeight] = useState(0);
  const recomputeHeightTimeoutRef = useRef<any>(null);
  const scheduleRecomputeHeight = useCallback(() => {
    clearTimeout(recomputeHeightTimeoutRef.current);
    recomputeHeightTimeoutRef.current = setTimeout(() => {
      setNeedReComputeHeight(val => val + 1);
    }, 50);
  }, []);
  const outerBlockContainerStyle = useAnimatedStyle(() => {
    if ((editTransition?.value ?? 0) <= 0.98) {
      return { height: 'auto' };
    }

    const measurement = measure(blockContainerRef);
    if (!measurement) {
      return { height: 'auto' };
    }
    if (measurement.height === 0) {
      runOnJS(scheduleRecomputeHeight)();
      return { height: 'auto' };
    }
    return {
      height: measurement.height,
    };
    // we add blockCount to the deps because we want to recompute the height when the children change
  }, [editTransition, blockCount, needReComputeHeight]);

  const blocksContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: interpolate(
            editTransition?.value ?? 0,
            [0, 1],
            [1, editScale],
          ),
        },
      ],
    };
  }, [editTransition, editScale]);

  const footerStyle = useAnimatedStyle(() => {
    return {
      opacity: editTransition?.value ?? 0,
      transform: [
        {
          scale: interpolate(
            editTransition?.value ?? 0,
            [0, 1],
            [1, 1 / editScale],
          ),
        },
      ],
    };
  }, [editTransition, editScale]);

  const contextValue = useMemo(
    () => ({
      registerBlock: (
        id: string,
        index: number,
        height: number,
        visible: boolean,
      ) => {
        blocks.current[id] = {
          index,
          height,
          visible,
        };
        updateBlockCounts();
      },
      unregisterBlock: (id: string) => {
        delete blocks.current[id];
        updateBlockCounts();
      },
    }),
    [updateBlockCounts],
  );

  const mergedRefs = useMemo(
    () => mergeRefs([scrollViewRef, forwardedRef]),
    [forwardedRef],
  );

  return (
    <Animated.View style={[StyleSheet.absoluteFill, containerStyle]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
        }}
        contentInsetAdjustmentBehavior="never"
        ref={mergedRefs}
        scrollToOverflowEnabled
        onScroll={onScrollInner}
        scrollEventThrottle={16}
        {...props}
      >
        <Animated.View
          style={[
            contentContainerStyle,
            { marginBottom: insets.bottom + BOTTOM_MENU_HEIGHT + 20 },
          ]}
        >
          <Animated.View style={outerBlockContainerStyle}>
            <Animated.View
              ref={blockContainerRef}
              style={[blocksContainerStyle, { transformOrigin: 'top' }]}
            >
              <WebCardScreenScrollViewContext.Provider value={contextValue}>
                {children}
              </WebCardScreenScrollViewContext.Provider>
              {editing && (
                <Animated.View
                  style={footerStyle}
                  entering={FadeIn.duration(EDIT_TRANSITION_DURATION)}
                  exiting={FadeOut.duration(EDIT_TRANSITION_DURATION)}
                >
                  {editFooter}
                </Animated.View>
              )}
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </Animated.View>
  );
};

export default forwardRef(WebCardScreenScrollView);

/* eslint-disable @typescript-eslint/no-unused-vars */
export const WebCardScreenScrollViewContext = createContext({
  registerBlock: (
    id: string,
    index: number,
    height: number,
    visible: boolean,
  ) => {},
  unregisterBlock: (id: string) => {},
});
/* eslint-enable @typescript-eslint/no-unused-vars */

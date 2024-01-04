import { createContext, useCallback, useMemo, useRef, useState } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Animated, {
  enableLayoutAnimations,
  interpolate,
  measure,
  useAnimatedRef,
  useAnimatedStyle,
} from 'react-native-reanimated';
import useScreenInsets from '#hooks/useScreenInsets';
import { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';
import { HEADER_HEIGHT } from '#ui/Header';
import {
  BUTTON_SIZE,
  EDIT_BLOCK_GAP,
  useWebCardEditScale,
} from './webCardScreenHelpers';
import {
  useEditTransition,
  useEditTransitionListeners,
} from './WebCardScreenTransitions';
import type { ReactNode } from 'react';
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
const WebCardScreenScrollView = ({
  editing,
  allBlockLoaded,
  children,
  onScroll,
  editFooter,
  editFooterHeight,
  ...props
}: WebCardScreenScrollViewProps) => {
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
      paddingTop: (editTransition?.value ?? 0) * 20,
    };
  });

  const outerBlockContainerStyle = useAnimatedStyle(() => {
    if ((editTransition?.value ?? 0) <= 0.98) {
      return { height: 'auto' };
    }

    const measurement = measure(blockContainerRef);
    if (!measurement) {
      return { height: 'auto' };
    }
    return {
      height: measurement.height,
    };
  });

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
  });

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
      },
      unregisterBlock: (id: string) => {
        delete blocks.current[id];
      },
    }),
    [blocks],
  );

  return (
    <Animated.View style={[StyleSheet.absoluteFill, containerStyle]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
        }}
        contentInsetAdjustmentBehavior="never"
        ref={scrollViewRef}
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
            </Animated.View>
          </Animated.View>
          {editing && editFooter}
        </Animated.View>
      </ScrollView>
    </Animated.View>
  );
};

export default WebCardScreenScrollView;

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

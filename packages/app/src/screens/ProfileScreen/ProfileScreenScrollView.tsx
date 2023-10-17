import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  scrollTo,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { COVER_RATIO } from '@azzapp/shared/coverHelpers';
import useScreenInsets from '#hooks/useScreenInsets';
import { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';
import { HEADER_HEIGHT } from '#ui/Header';
import { BUTTON_SIZE, useProfileEditScale } from './profileScreenHelpers';
import {
  useEditTransition,
  useEditTransitionListeners,
} from './ProfileScreenTransitions';
import type { ReactNode } from 'react';
import type {
  ScrollViewProps,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';

export type ProfileScreenScrollViewProps = ScrollViewProps & {
  /**
   * Whether the profile is in edit mode
   */
  editing: boolean;
  /**
   * Whether the profile is in edit mode
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
 * A wrapper component for the profile screen content. Handle the edit animation
 */
const ProfileScreenScrollView = ({
  editing,
  allBlockLoaded,
  children,
  onScroll,
  editFooter,
  editFooterHeight,
  ...props
}: ProfileScreenScrollViewProps) => {
  const editScale = useProfileEditScale();

  const coverHeight = Dimensions.get('window').width / COVER_RATIO;

  const blockInfos = useRef(
    new Map<string, { index: number; visible: boolean; height: number }>([
      [
        'cover',
        {
          index: 0,
          visible: true,
          height: coverHeight,
        },
      ],
    ]),
  );

  const layoutInitialized = useRef(false);
  const [layoutReady, setLayoutReady] = useState(false);
  const layoutChangedListeners = useRef(new Set<() => void>());
  const blockContainerDimensions = useSharedValue({
    height: coverHeight,
    editingHeight: (coverHeight + 2 * EDIT_BLOCK_GAP) * editScale,
  });

  const blockPositions = useRef(
    new Map<
      string,
      {
        editPosition: number;
        position: number;
      }
    >([
      [
        'cover',
        {
          editPosition: EDIT_BLOCK_GAP,
          position: 0,
        },
      ],
    ]),
  );

  const computeLayoutTimeout = useRef<any>();

  // it should not change during the lifetime of the component
  const buttonSize = useRef(BUTTON_SIZE / editScale);

  const allBlockLoadedRef = useRef(allBlockLoaded);

  const computeLayout = useCallback(() => {
    const allBlocksMeasured = Object.values(blockInfos).every(
      block => block.height !== -1,
    );

    if (
      (!allBlocksMeasured && !layoutInitialized.current) ||
      !allBlockLoadedRef.current
    ) {
      return;
    }
    const blocks = [...blockInfos.current.entries()]
      .sort(([, a], [, b]) => a.index - b.index)
      .map(([id, block]) => ({
        id,
        ...block,
      }));
    blockPositions.current.clear();
    let currentPosition = 0;
    let currentPositionEditing = 0;
    for (const block of blocks) {
      currentPositionEditing += EDIT_BLOCK_GAP;
      blockPositions.current.set(block.id, {
        editPosition: currentPositionEditing,
        position: currentPosition,
      });
      currentPosition += block.visible ? block.height : 0;
      currentPositionEditing += Math.max(block.height, buttonSize.current);
      currentPositionEditing += EDIT_BLOCK_GAP;
    }

    blockContainerDimensions.value = {
      height: currentPosition,
      editingHeight: currentPositionEditing,
    };
    layoutInitialized.current = true;
    setTimeout(() => {
      // we need to wait for the height to be applied on container before displaying the other elements
      setLayoutReady(true);
    }, 10);
  }, [blockContainerDimensions]);

  const scheduleLayout = useCallback(() => {
    clearTimeout(computeLayoutTimeout.current);
    computeLayoutTimeout.current = setTimeout(() => {
      computeLayoutTimeout.current = undefined;
      computeLayout();
      layoutChangedListeners.current.forEach(listener => listener());
    }, 10);
  }, [computeLayout]);

  useEffect(() => {
    if (allBlockLoadedRef.current !== allBlockLoaded) {
      allBlockLoadedRef.current = allBlockLoaded;
      scheduleLayout();
    }
  }, [allBlockLoaded, scheduleLayout]);

  const registerBlock = useCallback(
    (id: string, infos: { index: number; visible: boolean }) => {
      if (blockInfos.current.has(id)) {
        return;
      }
      blockInfos.current.set(id, {
        ...infos,
        height: -1,
      });
      scheduleLayout();
      return () => {
        blockInfos.current.delete(id);
        scheduleLayout();
      };
    },
    [scheduleLayout],
  );

  const getBlockPositions = useCallback(
    (id: string) => {
      return blockPositions.current.get(id);
    },
    [blockPositions],
  );

  const setBlockInfos = useCallback(
    (
      id: string,
      updates: Partial<{ index: number; visible: boolean; height: number }>,
    ) => {
      const block = blockInfos.current.get(id);
      if (!block) {
        return;
      }
      if (
        Object.keys(updates).every(
          key => (block as any)[key] === (updates as any)[key],
        )
      ) {
        return;
      }
      Object.assign(block, updates);
      scheduleLayout();
    },
    [scheduleLayout],
  );

  const addLayoutChangedListener = useCallback((listener: () => void) => {
    layoutChangedListeners.current.add(listener);
    return () => {
      layoutChangedListeners.current.delete(listener);
    };
  }, []);

  const contextValue = useMemo(
    () => ({
      registerBlock,
      getBlockPositions,
      setBlockInfos,
      addLayoutChangedListener,
    }),
    [addLayoutChangedListener, getBlockPositions, registerBlock, setBlockInfos],
  );

  const editTransiton = useEditTransition();

  // it's important that we control this value during the animation process
  // otherwise the scrollview will jump, that's why we use a shared value
  // even though it's not animated
  const transitioning = useRef(false);

  const scrollYRef = useRef(0);
  const onScrollInner = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      onScroll?.(e);
      scrollYRef.current = e.nativeEvent.contentOffset.y;
    },
    [onScroll],
  );

  const scrollViewRef = useAnimatedRef<ScrollView>();
  const scrollAnimationContext = useSharedValue({
    from: 0,
    to: 0,
    editing,
    active: false,
  });

  useEditTransitionListeners({
    start: editing => {
      const { height: contentHeight, editingHeight } =
        blockContainerDimensions.value;
      transitioning.current = true;
      const scrollY = scrollYRef.current;
      const editScrollContentHeight =
        editingHeight * editScale + editFooterHeight;
      const ratio = editScrollContentHeight / contentHeight;
      scrollAnimationContext.value = {
        from: scrollY,
        to: editing ? scrollY * ratio : scrollY / ratio,
        editing,
        active: true,
      };
    },
    end: editing => {
      transitioning.current = false;
      scrollAnimationContext.value = {
        from: 0,
        to: 0,
        editing,
        active: false,
      };
    },
  });

  useAnimatedReaction(
    () => [editTransiton?.value, scrollAnimationContext.value] as const,
    ([editTransiton, { from, to, editing, active }]) => {
      if (!active || editTransiton === undefined) {
        return;
      }

      const scrollY = interpolate(editTransiton, editing ? [0, 1] : [1, 0], [
        from,
        to,
      ]);
      const startValue = editing ? from : to;
      if (scrollY === startValue) {
        // initial value might cause a glitch
        return;
      }
      scrollTo(scrollViewRef, 0, scrollY, false);
    },
  );

  const insets = useScreenInsets();
  const containerStyle = useAnimatedStyle(() => {
    return {
      top: (editTransiton?.value ?? 0) * (insets.top + HEADER_HEIGHT),
    };
  });

  const contentContainerStyle = useAnimatedStyle(() => {
    return {
      paddingTop: (editTransiton?.value ?? 0) * 20,
    };
  });

  const innerContainerStyle = useAnimatedStyle(() => {
    const { height, editingHeight } = blockContainerDimensions.value;
    return {
      height: interpolate(
        editTransiton?.value ?? 0,
        [0, 1],
        [height, editingHeight * editScale],
      ),
    };
  });

  const blocksContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: interpolate(editTransiton?.value ?? 0, [0, 1], [1, editScale]),
        },
      ],
    };
  });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, containerStyle]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
        }}
        contentInsetAdjustmentBehavior="never"
        ref={scrollViewRef}
        scrollEventThrottle={16}
        onScroll={onScrollInner}
        scrollToOverflowEnabled
        {...props}
      >
        <Animated.View
          style={[
            contentContainerStyle,
            {
              marginBottom: insets.bottom + BOTTOM_MENU_HEIGHT + 20,
            },
          ]}
        >
          <Animated.View style={innerContainerStyle}>
            <Animated.View style={blocksContainerStyle}>
              <ProfileScreenScrollViewContext.Provider value={contextValue}>
                {children}
              </ProfileScreenScrollViewContext.Provider>
            </Animated.View>
          </Animated.View>
          {editing && layoutReady && editFooter}
        </Animated.View>
      </ScrollView>
    </Animated.View>
  );
};

export default ProfileScreenScrollView;

export const ProfileScreenScrollViewContext = createContext<{
  registerBlock: (
    id: string,
    infos: {
      index: number;
      visible: boolean;
    },
  ) => void;
  getBlockPositions: (id: string) =>
    | {
        editPosition: number;
        position: number;
      }
    | undefined;
  setBlockInfos: (
    id: string,
    updates: Partial<{
      index: number;
      visible: boolean;
      height: number;
    }>,
  ) => void;
  addLayoutChangedListener: (listener: () => void) => () => void;
} | null>(null);

export const EDIT_BLOCK_GAP = 20;

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  type LayoutChangeEvent,
  type ScrollViewProps,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import useScreenInsets from '#hooks/useScreenInsets';
import { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';
import { HEADER_HEIGHT } from '#ui/Header';
import { useProfileEditScale } from './profileScreenHelpers';
import { useEditTransition } from './ProfileScreenTransitions';

export type ProfileScreenScrollViewProps = ScrollViewProps & {
  /**
   * true when the profile is ready to be displayed (animation finished)
   */
  ready: boolean;
  /**
   * Whether the profile is in edit mode
   */
  editing: boolean;
  /**
   * The number of block in the web card
   */
  blocksCount: number;
};

/**
 * A wrapper component for the profile screen content. Handle the edit animation
 */
const ProfileScreenScrollView = ({
  editing,
  children,
  blocksCount,
  onScroll,
  ...props
}: ProfileScreenScrollViewProps) => {
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setContentHeight(e.nativeEvent.layout.height);
  }, []);

  const editScale = useProfileEditScale();

  const scrollViewRef = useRef<ScrollView>(null);
  const scrollY = useRef<number>(0);

  const onScrollInner = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    onScroll?.(e);
    scrollY.current = e.nativeEvent.contentOffset.y;
  };

  const contentDimensions = useRef({ currentHeight: 0, nextHeight: 0 });
  useEffect(() => {
    if (contentHeight == null) return;
    contentDimensions.current = {
      currentHeight: contentHeight,
      nextHeight: editing
        ? contentHeight - blocksCount * 40
        : contentHeight + blocksCount * 40,
    };
  }, [children, contentHeight, editScale, editing, blocksCount]);

  useEffect(() => {
    const { currentHeight, nextHeight } = contentDimensions.current;
    scrollViewRef.current?.scrollTo({
      y: scrollY.current * (currentHeight / nextHeight),
      animated: true,
    });
  }, [editScale, editing]);

  const insets = useScreenInsets();
  const editTransiton = useEditTransition();
  const containerStyle = useAnimatedStyle(() => {
    return {
      top: editTransiton.value * (insets.top + HEADER_HEIGHT),
    };
  });

  const contentContainerStyle = useAnimatedStyle(() => {
    return {
      paddingTop: editTransiton.value * 20,
    };
  });

  const innerStyle = useAnimatedStyle(() => {
    if (contentHeight == null) return {};
    return {
      transform: [
        {
          translateY: interpolate(
            editTransiton.value,
            [0, 1],
            [0, (contentHeight * editScale) / 2 - contentHeight / 2],
          ),
        },
        {
          scale: interpolate(editTransiton.value, [0, 1], [1, editScale]),
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
          paddingBottom: insets.bottom + BOTTOM_MENU_HEIGHT * (editing ? 2 : 1),
        }}
        contentInsetAdjustmentBehavior="never"
        ref={scrollViewRef}
        scrollEventThrottle={16}
        onScroll={onScrollInner}
        {...props}
      >
        <Animated.View
          style={[
            contentContainerStyle,
            contentHeight != null && {
              height: editing ? contentHeight * editScale : contentHeight,
            },
          ]}
        >
          <Animated.View onLayout={onLayout} style={innerStyle}>
            {children}
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </Animated.View>
  );
};

export default ProfileScreenScrollView;

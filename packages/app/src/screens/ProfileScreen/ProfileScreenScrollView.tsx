import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';
import {
  EDIT_TRANSITION_DURATION,
  useProfileEditScale,
} from './profileScreenHelpers';
import type { LayoutChangeEvent, ScrollViewProps } from 'react-native';

export type ProfileScreenScrollViewProps = ScrollViewProps & {
  /**
   * true when the profile is ready to be displayed (animation finished)
   */
  ready: boolean;
  /**
   * Whether the profile is in edit mode
   */
  editing: boolean;
};

/**
 * A wrapper component for the profile screen content. Handle the edit animation
 */
const ProfileScreenScrollView = ({
  editing,
  children,
  ...props
}: ProfileScreenScrollViewProps) => {
  const { bottom: insetBottom } = useSafeAreaInsets();
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setContentHeight(e.nativeEvent.layout.height);
  }, []);

  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  }, [editing]);

  const editingSharedValue = useSharedValue(editing ? 1 : 0);
  useEffect(() => {
    editingSharedValue.value = withTiming(editing ? 1 : 0, {
      duration: EDIT_TRANSITION_DURATION,
    });
  }, [editing, editingSharedValue]);

  const editScale = useProfileEditScale();

  const containerStyle = useAnimatedStyle(() => {
    if (contentHeight == null) return {};
    return {
      paddingTop: editingSharedValue.value * 20,
    };
  });

  const innerStyle = useAnimatedStyle(() => {
    if (contentHeight == null) return {};
    return {
      transform: [
        {
          translateY: interpolate(
            editingSharedValue.value,
            [0, 1],
            [0, (contentHeight * editScale) / 2 - contentHeight / 2],
          ),
        },
        {
          scale: interpolate(editingSharedValue.value, [0, 1], [1, editScale]),
        },
      ],
    };
  });

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        flexGrow: 1,
        paddingBottom: insetBottom + BOTTOM_MENU_HEIGHT * (editing ? 2 : 1),
      }}
      contentInsetAdjustmentBehavior="never"
      ref={scrollViewRef}
      {...props}
    >
      <Animated.View
        style={[
          containerStyle,
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
  );
};

export default ProfileScreenScrollView;

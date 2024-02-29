import { useMemo, useRef, forwardRef } from 'react';
import { Dimensions, useWindowDimensions } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  FadeOut,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { mergeRefs } from '#helpers/mergeRefs';
import useScreenInsets from '#hooks/useScreenInsets';
import { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';
import { HEADER_HEIGHT } from '#ui/Header';
import {
  EDIT_TRANSITION_DURATION,
  useWebCardEditScale,
} from './webCardScreenHelpers';
import { useEditTransition } from './WebCardScreenTransitions';
import type { ForwardedRef, ReactNode } from 'react';
import type { ScrollViewProps } from 'react-native';

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

const { height: windowHeight } = Dimensions.get('screen');

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

  const scrollViewRef = useRef<ScrollView>(null);

  const { width: windowWidth } = useWindowDimensions();
  const insets = useScreenInsets();
  const containerStyle = useAnimatedStyle(() => {
    const editProgress = editTransition?.value ?? 0;
    const editToGap = insets.top + HEADER_HEIGHT;
    return {
      position: 'absolute',
      top: editProgress * editToGap,
      left: interpolate(
        editProgress,
        [0, 1],
        [0, (windowWidth - windowWidth / editScale) / 2],
      ),
      height: interpolate(
        editProgress,
        [0, 1],
        [windowHeight, (windowHeight - editToGap) / editScale],
      ),
      width: interpolate(
        editProgress,
        [0, 1],
        [windowWidth, windowWidth / editScale],
      ),
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

  const contentContainerStyle = useAnimatedStyle(() => {
    const editProgress = editTransition?.value ?? 0;
    return {
      paddingVertical: editProgress * 20,
      marginBottom:
        (insets.bottom + BOTTOM_MENU_HEIGHT + 20) *
        (1 + (editProgress * 1) / editScale),
    };
  });

  const footerStyle = useAnimatedStyle(() => {
    return {
      opacity: editTransition?.value ?? 0,
      width: windowWidth,
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

  const mergedRefs = useMemo(
    () => mergeRefs([scrollViewRef, forwardedRef]),
    [forwardedRef],
  );

  return (
    <Animated.View style={[containerStyle, { transformOrigin: 'top' }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: 'center',
        }}
        contentInsetAdjustmentBehavior="never"
        ref={mergedRefs}
        scrollToOverflowEnabled
        onScroll={onScroll}
        scrollEventThrottle={16}
        {...props}
      >
        <Animated.View style={contentContainerStyle}>
          {children}
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
      </ScrollView>
    </Animated.View>
  );
};

export default forwardRef(WebCardScreenScrollView);

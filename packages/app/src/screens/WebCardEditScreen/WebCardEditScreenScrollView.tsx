import { forwardRef, type ForwardedRef, type ReactNode } from 'react';
import { View, type ScrollViewProps } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useTooltipContext } from '#helpers/TooltipContext';
import useScreenDimensions from '#hooks/useScreenDimensions';
import useScreenInsets from '#hooks/useScreenInsets';
import { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';
import ChildPositionAwareScrollView from '#ui/ChildPositionAwareScrollView';
import { HEADER_HEIGHT } from '#ui/Header';
import IconButton from '#ui/IconButton';
import { useWebCardEditScale } from './webCardEditScreenHelpers';
import { WEBCARD_SCREEN_EDIT_MODE_FOOTER_HEIGHT } from './WebCardScreenEditModeFooter';
import type { ChildPositionAwareScrollViewHandle } from '#ui/ChildPositionAwareScrollView';

export type WebCardEditScreenScrollViewProps = Omit<
  ScrollViewProps,
  'hitSlop'
> & {
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
const WebCardEditScreenScrollView = (
  {
    children,
    onScroll,
    editFooter,
    editFooterHeight,
    ...props
  }: WebCardEditScreenScrollViewProps,
  forwardedRef: ForwardedRef<ChildPositionAwareScrollViewHandle>,
) => {
  const editScale = useWebCardEditScale();

  const { width: screenWidth, height: screenHeight } = useScreenDimensions();
  const { toggleTooltips } = useTooltipContext();

  const insets = useScreenInsets();

  const editTopGap = insets.top + HEADER_HEIGHT;

  const openHilt = () => {
    toggleTooltips(['cover', 'editFooter', 'section']);
  };

  return (
    <>
      <IconButton
        icon="information"
        iconSize={26}
        size={45}
        variant="icon"
        style={{
          top: editTopGap,
        }}
        onPress={openHilt}
      />

      <View
        style={{
          position: 'absolute',
          top: editTopGap + 50,
          left: (screenWidth - screenWidth / editScale) / 2,
          height: (screenHeight - editTopGap) / editScale,
          width: screenWidth / editScale,
          transformOrigin: 'top',
          transform: [{ scale: editScale }],
        }}
      >
        <ChildPositionAwareScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            alignItems: 'center',
          }}
          contentInsetAdjustmentBehavior="never"
          ref={forwardedRef}
          scrollToOverflowEnabled
          scrollEventThrottle={16}
          {...props}
        >
          <View
            style={{
              paddingVertical: 20,
              marginBottom: insets.bottom + BOTTOM_MENU_HEIGHT / editScale,
            }}
          >
            {children}
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(200)}
            >
              <View
                style={{
                  width: screenWidth,
                  transform: [
                    { scale: 1 / editScale },
                    {
                      translateY: -(
                        (WEBCARD_SCREEN_EDIT_MODE_FOOTER_HEIGHT *
                          (1 - 1 / editScale)) /
                        2
                      ),
                    },
                  ],
                }}
              >
                {editFooter}
              </View>
            </Animated.View>
          </View>
        </ChildPositionAwareScrollView>
      </View>
    </>
  );
};

export default forwardRef(WebCardEditScreenScrollView);

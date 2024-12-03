import { memo } from 'react';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { shadow } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useAnimatedState from '#hooks/useAnimatedState';
import Container from '#ui/Container';
import type { CardModuleDimension } from '../cardModuleEditorType';

type CardModulePreviewContainerProps = {
  viewMode: 'desktop' | 'mobile';
  dimension: CardModuleDimension;
  backgroundColor?: string;
  children: React.ReactNode;
  scaleFactor: number;
};

const CardModulePreviewContainer = ({
  dimension,
  backgroundColor,
  children,
  viewMode,
  scaleFactor,
}: CardModulePreviewContainerProps) => {
  // #region hook
  const styles = useStyleSheet(styleSheet);
  const viewModeTimer = useAnimatedState(viewMode === 'mobile' ? 0 : 1, {
    duration: PREVIEW_ANIMATION_DURATION,
  });
  // #endregion
  // #region ui
  const scaleViewStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: interpolate(
            viewModeTimer.value,
            [0, 1],
            [0.55, scaleFactor * 0.8],
          ),
        },
      ],
    };
  });
  const deviceEmulatedView = useAnimatedStyle(() => {
    const oppositeScale = interpolate(
      viewModeTimer.value,
      [0, 1 / 0.55],
      [1, 1 / 0.8],
      Extrapolation.CLAMP,
    );
    const animatedHeight = withTiming(dimension.height, {
      duration: PREVIEW_ANIMATION_DURATION,
    });

    const animatedWidth = withTiming(dimension.width, {
      duration: PREVIEW_ANIMATION_DURATION,
    });
    return {
      height: animatedHeight,
      width: animatedWidth,
      transform: [{ scale: oppositeScale }],
    };
  });
  // #endregion

  return (
    <Container style={styles.container}>
      <Animated.View style={[scaleViewStyle, styles.scaledContainer]}>
        {/* The opposite scale is used to remove the application of scale effect on the module renderer itself,
          this will allow to render module in edition / view mode the same way using normal dimension(screenWidth etc)
          height is added to simulated different frame aspec ratio between mobile and web
        */}
        <Animated.View
          style={[
            deviceEmulatedView,
            styles.deviceEmulated,
            {
              backgroundColor,
            },
          ]}
        >
          {children}
        </Animated.View>
      </Animated.View>
    </Container>
  );
};

export default memo(CardModulePreviewContainer);

const styleSheet = createStyleSheet(appearance => ({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scaledContainer: {
    ...shadow(appearance, 'bottom'),
  },
  deviceEmulated: {
    overflow: 'hidden', //do not remove this, it will cause the module to be cut off in some case '(desktop mainly)
    justifyContent: 'center',
    borderRadius: 24,
  },
}));

export const PREVIEW_ANIMATION_DURATION = 250;

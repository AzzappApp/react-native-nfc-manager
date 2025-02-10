import { memo } from 'react';
import Animated, {
  interpolate,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { shadow } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useAnimatedState from '#hooks/useAnimatedState';
import Container from '#ui/Container';
import { CardModuleEditionProvider } from '../CardModuleEditionContext';
import type { CardModuleDimension } from '../cardModuleEditorType';
import type { DisplayMode } from '@azzapp/shared/cardModuleHelpers';

type CardModulePreviewContainerProps = {
  displayMode: DisplayMode;
  dimension: CardModuleDimension;
  backgroundColor?: string;
  children: React.ReactNode;
  scaleFactor: number;
};

const CardModulePreviewContainer = ({
  dimension,
  backgroundColor,
  children,
  displayMode,
  scaleFactor,
}: CardModulePreviewContainerProps) => {
  // #region hook
  const styles = useStyleSheet(styleSheet);
  //using animatedState to not have a defined a sharedValue, to animate with the new value(handle by the hook)
  const animatedScaledFactor = useAnimatedState(scaleFactor, {
    duration: PREVIEW_ANIMATION_DURATION,
  });
  const displayModeTimer = useAnimatedState(displayMode === 'mobile' ? 0 : 1, {
    duration: PREVIEW_ANIMATION_DURATION,
  });
  // #endregion
  // #region ui
  const scaleViewStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale:
            animatedScaledFactor.value *
            interpolate(displayModeTimer.value, [0, 1], [0.55, 0.8]),
        },
      ],
    };
  });
  const deviceEmulatedView = useAnimatedStyle(() => {
    return {
      height: withTiming(dimension.height, {
        duration: PREVIEW_ANIMATION_DURATION,
      }),
      width: withTiming(dimension.width, {
        duration: PREVIEW_ANIMATION_DURATION,
      }),
    };
  });
  // #endregion

  return (
    <CardModuleEditionProvider value>
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
    </CardModuleEditionProvider>
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
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 24,
    padding: 20, //for shadow on android
  },
  deviceEmulated: {
    overflow: 'hidden', //do not remove this, it will cause the module to be cut off in some case '(desktop mainly)
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    ...shadow(appearance, 'center', false),
  },
}));

export const PREVIEW_ANIMATION_DURATION = 250;

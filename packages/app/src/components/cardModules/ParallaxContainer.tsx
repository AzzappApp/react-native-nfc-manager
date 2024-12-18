import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import CardModuleMediaItem from './CardModuleMediaItem';
import { PREVIEW_ANIMATION_DURATION } from './tool/CardModulePreviewContainer';
import type {
  CardModuleDimension,
  CardModuleSourceMedia,
} from './cardModuleEditorType';
import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

type ParallaxContainerProps = {
  media: CardModuleSourceMedia;
  index: number;
  scrollY: SharedValue<number>;
  dimension: CardModuleDimension;
  disableParallax?: boolean;
  modulePosition?: SharedValue<number>;
  children?: ReactNode | undefined;
  imageStyle?: ViewStyle; // some variant need opacity and backgroundcolor (mediaText) but not other (media)
  imageContainerStyle?: ViewStyle; // some variant need opacity and backgroundcolor (mediaText) but not other (media)
};

const PARALLAX_RATIO = 0.8;

const ParallaxContainer = ({
  media,
  dimension,
  index,
  scrollY,
  modulePosition,
  disableParallax,
  children,
  imageStyle,
  imageContainerStyle,
}: ParallaxContainerProps) => {
  const animatedImageContainerStyle = useAnimatedStyle(() => {
    const itemStartY = (modulePosition?.value ?? 0) + index * dimension.height;
    const itemEndY = itemStartY + dimension.height;

    const animatedHeight = withTiming(dimension.height, {
      duration: PREVIEW_ANIMATION_DURATION,
    });

    const translateY = disableParallax
      ? 0
      : interpolate(
          scrollY.value,
          [itemStartY - dimension.height, itemStartY, itemEndY],
          [
            -dimension.height * PARALLAX_RATIO,
            0,
            dimension.height * PARALLAX_RATIO,
          ],
        );

    return {
      height: animatedHeight,
      width: dimension.width,
      transform: [{ translateY }],
    };
  });

  return (
    <View style={[styles.container, dimension]}>
      <Animated.View style={[animatedImageContainerStyle, imageContainerStyle]}>
        <CardModuleMediaItem
          media={media}
          dimension={dimension}
          imageStyle={{
            width: dimension.width,
            height: dimension.height,
            ...imageStyle,
          }}
        />
      </Animated.View>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});

export default ParallaxContainer;

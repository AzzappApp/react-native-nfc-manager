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
import type { SharedValue } from 'react-native-reanimated';

type ParallaxContainerProps = {
  media: CardModuleSourceMedia;
  index: number;
  scrollY: SharedValue<number>;
  dimension: CardModuleDimension;
  disableParallax?: boolean;
  modulePosition?: SharedValue<number>;
  children?: ReactNode | undefined;
};

const PARALLAX_RATIO = 0.2;

const ParallaxContainer = ({
  media,
  dimension,
  index,
  scrollY,
  modulePosition,
  disableParallax,
  children,
}: ParallaxContainerProps) => {
  const imageContainerStyle = useAnimatedStyle(() => {
    const itemStartY = (modulePosition?.value ?? 0) + index * dimension.height;
    const itemEndY = itemStartY + dimension.height;

    const animatedHeight = withTiming(dimension.height * (1 + PARALLAX_RATIO), {
      duration: PREVIEW_ANIMATION_DURATION,
    });

    const translateY = interpolate(
      scrollY.value,
      [itemStartY - dimension.height, itemStartY, itemEndY],
      [-dimension.height * PARALLAX_RATIO, 0, 0],
    );

    const containerRatio = dimension.width / dimension.height;
    return {
      height: dimension.height * (1 + PARALLAX_RATIO),
      width: animatedHeight * (1 + PARALLAX_RATIO) * containerRatio,
      transform: disableParallax ? [{ translateY: 0 }] : [{ translateY }],
    };
  });

  return (
    <View style={[styles.container, dimension]}>
      <Animated.View style={imageContainerStyle}>
        <CardModuleMediaItem
          media={media}
          dimension={dimension}
          imageStyle={{
            width: dimension.width,
            height: dimension.height * (1 + PARALLAX_RATIO),
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

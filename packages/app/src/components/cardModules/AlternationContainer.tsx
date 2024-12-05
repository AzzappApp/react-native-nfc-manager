import { useCallback } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  createVariantsStyleSheet,
  useVariantStyleSheet,
} from '#helpers/createStyles';
import CardModuleMediaItem from './CardModuleMediaItem';
import type { CardModuleSourceMedia } from './cardModuleEditorType';
import type { CardStyle } from '@azzapp/shared/cardHelpers';
import type { LayoutChangeEvent, ViewProps } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

type AlternationContainerProps = ViewProps & {
  viewMode: 'desktop' | 'mobile';
  dimension: {
    width: number;
    height: number;
  };
  borderRadius?: number;
  media: CardModuleSourceMedia;
  cardStyle: CardStyle | null | undefined;
  index: number;
  scrollY: SharedValue<number>;
  parentY?: SharedValue<number>;
  modulePosition?: SharedValue<number>;
  disableAnimation?: boolean;
};

const ANIMATION_DURATION = 1000;

/**
 * ALternation container for the section module type
 * it always containt a media and ONE children
 * @return {*}
 */
const AlternationContainer = ({
  viewMode,
  dimension,
  cardStyle,
  style,
  children,
  media,
  index,
  scrollY,
  modulePosition,
  parentY,
  disableAnimation,
  ...props
}: AlternationContainerProps) => {
  const styles = useVariantStyleSheet(stylesheet, viewMode);
  const mediaWidth =
    viewMode === 'desktop'
      ? (dimension.width - 2 * PADDING_HORIZONTAL - HORIZONTAL_GAP) / 2
      : dimension.width - 2 * PADDING_HORIZONTAL;

  const componentY = useSharedValue(0);
  const componentHeight = useSharedValue(0);

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      componentY.value = event.nativeEvent.layout.y;
      componentHeight.value = event.nativeEvent.layout.height;
    },
    [componentHeight, componentY],
  );

  const animatedStyle = useAnimatedStyle(() => {
    const itemStartY =
      (modulePosition?.value ?? 0) + componentY.value + (parentY?.value ?? 0);
    const itemEndY = itemStartY + componentHeight.value;

    if (disableAnimation) {
      return {
        transform: [{ translateX: 0 }],
        opacity: 1,
      };
    }

    const translateX = withTiming(
      scrollY.value > itemStartY - dimension.height && scrollY.value < itemEndY
        ? 0
        : index % 2 === 0
          ? -150
          : 150,
      { duration: ANIMATION_DURATION },
    );

    const opacity = withTiming(
      scrollY.value > itemStartY - dimension.height && scrollY.value < itemEndY
        ? 1
        : 0,
      { duration: ANIMATION_DURATION },
    );

    return {
      transform: [{ translateX }],
      opacity,
    };
  });

  if (!media || !children) {
    return null;
  }

  return (
    <View
      {...props}
      style={[styles.container, { width: dimension.width }, style]}
      onLayout={onLayout}
    >
      {viewMode === 'mobile' || index % 2 === 0 ? (
        <Animated.View
          style={[
            styles.imageContainer,
            { width: mediaWidth, borderRadius: cardStyle?.borderRadius ?? 0 },
            animatedStyle,
          ]}
        >
          <CardModuleMediaItem
            media={media}
            dimension={{
              width: mediaWidth,
              height: mediaWidth,
            }}
          />
        </Animated.View>
      ) : null}
      <View style={{ width: mediaWidth }}>{children}</View>
      {viewMode === 'desktop' && index % 2 === 1 ? (
        <Animated.View
          style={[
            styles.imageContainer,
            { width: mediaWidth, borderRadius: cardStyle?.borderRadius ?? 0 },
            animatedStyle,
          ]}
        >
          <CardModuleMediaItem
            media={media}
            dimension={{
              width: mediaWidth,
              height: mediaWidth,
            }}
          />
        </Animated.View>
      ) : null}
    </View>
  );
};
const HORIZONTAL_GAP = 40;
const PADDING_HORIZONTAL = 20;

const stylesheet = createVariantsStyleSheet(() => ({
  default: {
    container: { borderRadius: 0 },
    imageContainer: { overflow: 'hidden' },
  },
  mobile: {
    container: {
      flex: 1,
      flexDirection: 'column',
      paddingHorizontal: PADDING_HORIZONTAL,
      paddingVertical: 20,
      rowGap: 20,
    },
  },
  desktop: {
    container: {
      flex: 1,
      flexDirection: 'row',
      paddingHorizontal: PADDING_HORIZONTAL,
      paddingVertical: 20,
      columnGap: 40,
    },
  },
}));

export default AlternationContainer;

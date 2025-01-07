import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, View } from 'react-native';

import {
  isModuleAnimationDisabled,
  type DisplayMode,
  type WebCardViewMode,
} from '@azzapp/shared/cardModuleHelpers';
import {
  createVariantsStyleSheet,
  useVariantStyleSheet,
} from '#helpers/createStyles';
import useIsModuleItemInViewPort from '#hooks/useIsModuleItemInViewPort';
import CardModuleMediaSelector from './CardModuleMediaSelector';
import type { CardModuleSourceMedia } from './cardModuleEditorType';
import type { CardStyle } from '@azzapp/shared/cardHelpers';
import type { LayoutChangeEvent, ViewProps } from 'react-native';

type AlternationContainerProps = ViewProps & {
  displayMode: DisplayMode;
  dimension: {
    width: number;
    height: number;
  };
  canPlay: boolean;
  borderRadius?: number;
  media: CardModuleSourceMedia;
  cardStyle: CardStyle | null | undefined;
  index: number;
  scrollY: Animated.Value;
  parentY?: number;
  modulePosition?: number;
  webCardViewMode?: WebCardViewMode;
};

const ANIMATION_DURATION = 1000;

/**
 * ALternation container for the section module type
 * it always containt a media and ONE children
 * @return {*}
 */
const AlternationContainer = ({
  displayMode,
  dimension,
  cardStyle,
  style,
  children,
  media,
  index,
  scrollY,
  modulePosition,
  parentY,
  canPlay,
  webCardViewMode,
  ...props
}: AlternationContainerProps) => {
  const styles = useVariantStyleSheet(stylesheet, displayMode);
  const mediaWidth =
    displayMode === 'desktop'
      ? (dimension.width - 2 * PADDING_HORIZONTAL - HORIZONTAL_GAP) / 2
      : dimension.width - 2 * PADDING_HORIZONTAL;

  const [componentY, setComponentY] = useState(0);
  const [componentHeight, setComponentHeight] = useState(0);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setComponentY(event.nativeEvent.layout.y);
    setComponentHeight(event.nativeEvent.layout.height);
  }, []);

  const translateX = useRef(
    new Animated.Value(
      modulePosition === undefined && index === 0
        ? 0
        : index % 2 === 0
          ? -150
          : 150,
    ),
  ).current;
  const opacity = useRef(
    new Animated.Value(modulePosition === undefined && index === 0 ? 1 : 0),
  ).current;

  const isRunning = useRef(false);
  const hideAnimation = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    const itemStartY = (modulePosition ?? 0) + (parentY ?? 0) + componentY;
    const itemEndY = itemStartY + componentHeight;

    const listener = scrollY.addListener(({ value }) => {
      if (value >= itemStartY - dimension.height && value <= itemEndY) {
        if (hideAnimation.current) {
          hideAnimation.current.stop();
          hideAnimation.current = null;
        }

        if (!isRunning.current) {
          isRunning.current = true;
          Animated.parallel([
            Animated.timing(translateX, {
              toValue: 0,
              duration: ANIMATION_DURATION,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 1,
              duration: ANIMATION_DURATION,
              useNativeDriver: true,
            }),
          ]).start(({ finished }) => {
            if (finished) {
              isRunning.current = false;
            }
          });
        }
      } else if (!hideAnimation.current && !isRunning.current) {
        hideAnimation.current = Animated.parallel([
          Animated.timing(translateX, {
            toValue: index % 2 === 0 ? -150 : 150,
            duration: ANIMATION_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: ANIMATION_DURATION,
            useNativeDriver: true,
          }),
        ]);
        hideAnimation.current.start(({ finished }) => {
          if (finished) {
            hideAnimation.current = null;
          }
        });
      }
    });

    return () => scrollY.removeListener(listener);
  }, [
    scrollY,
    modulePosition,
    parentY,
    dimension.height,
    translateX,
    opacity,
    componentY,
    componentHeight,
    index,
  ]);

  const disableAnimation = isModuleAnimationDisabled(
    displayMode,
    webCardViewMode,
  );

  const imageContainerStyle = useMemo(
    () => [
      styles.imageContainer,
      {
        width: mediaWidth,
        borderRadius: cardStyle?.borderRadius ?? 0,
        transform: [{ translateX: disableAnimation ? 0 : translateX }],
        opacity:
          disableAnimation ||
          (Platform.OS === 'android' && media.kind === 'video')
            ? 1
            : opacity,
      },
    ],
    [
      styles.imageContainer,
      mediaWidth,
      cardStyle?.borderRadius,
      disableAnimation,
      translateX,
      media.kind,
      opacity,
    ],
  );

  const imageDimension = useMemo(
    () => ({
      width: mediaWidth,
      height: mediaWidth,
    }),
    [mediaWidth],
  );

  const inViewport = useIsModuleItemInViewPort(
    scrollY,
    modulePosition ?? 0,
    dimension,
  );
  console.log({ media: media.id, inViewport });
  if (!media || !children) {
    return null;
  }

  return (
    <View
      {...props}
      style={[styles.container, { width: dimension.width }, style]}
      onLayout={onLayout}
    >
      {displayMode !== 'desktop' || index % 2 === 0 ? (
        <Animated.View style={imageContainerStyle}>
          <CardModuleMediaSelector
            media={media}
            dimension={imageDimension}
            canPlay={canPlay && inViewport}
          />
        </Animated.View>
      ) : null}
      <View style={{ width: mediaWidth }}>{children}</View>
      {displayMode === 'desktop' && index % 2 === 1 ? (
        <Animated.View style={imageContainerStyle}>
          <CardModuleMediaSelector
            media={media}
            dimension={imageDimension}
            canPlay={canPlay && inViewport}
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

import { useState, useCallback, useRef, useEffect, useMemo, memo } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View } from 'react-native';
import { isModuleAnimationDisabled } from '@azzapp/shared/cardModuleHelpers';
import { useFullScreenOverlayContext } from '#components/WebCardPreviewFullScreenOverlay';
import useIsModuleItemInViewPort from '#hooks/useIsModuleItemInViewPort';
import CardModuleMediaSelector from './CardModuleMediaSelector';
import type {
  CardModuleSourceMedia,
  CardModuleDimension,
} from './cardModuleEditorType';
import type { CardStyle } from '@azzapp/shared/cardHelpers';
import type {
  DisplayMode,
  WebCardViewMode,
} from '@azzapp/shared/cardModuleHelpers';
import type { LayoutChangeEvent } from 'react-native';

export type AppearanceSliderContainerProps = {
  index: number;
  media: CardModuleSourceMedia;
  dimension: CardModuleDimension;
  displayMode: DisplayMode;
  cardStyle?: CardStyle | null;
  canPlay: boolean;
  setEditableItemIndex?: (index: number) => void;
  modulePosition?: number;
  scrollY: Animated.Value;
  offsetY: number;
  webCardViewMode?: WebCardViewMode;
  parentY: number;
  displayDimension: CardModuleDimension;
  delaySec: number;
};

const AppearanceSliderContainer = ({
  media,
  index,
  dimension,
  cardStyle,
  canPlay,
  modulePosition,
  displayMode,
  webCardViewMode,
  parentY,
  scrollY,
  offsetY,
  displayDimension,
  delaySec,
}: AppearanceSliderContainerProps) => {
  const itemStartY =
    (modulePosition ?? 0) + offsetY + ANIMATION_DELAY_BUFFER_PIXEL;

  const [componentY, setComponentY] = useState(0);
  const [componentHeight, setComponentHeight] = useState(0);
  const inViewport = useIsModuleItemInViewPort(
    scrollY,
    itemStartY + componentHeight,
    componentHeight,
    componentHeight > 0,
    webCardViewMode === 'edit',
    dimension,
  );
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setComponentY(event.nativeEvent.layout.y);
    setComponentHeight(event.nativeEvent.layout.height);
  }, []);

  //make them visible at first even out of the screen until the first listener of scrollY is triggered
  const translateY = useRef(
    new Animated.Value(inViewport ? 0 : TRANSLATION_Y_ANIMATION),
  ).current;
  const opacity = useRef(new Animated.Value(inViewport ? 1 : 0)).current;

  const isRunning = useRef(false);
  const hideAnimation = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    const itemStartY = (modulePosition ?? 0) + (parentY ?? 0) + componentY;
    const itemEndY = itemStartY + componentHeight;
    const viewportHeight = dimension.height;
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500, //different than animation duration, tested with upmitt, submit to changes
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        isRunning.current = false;
      }
    });
    const listener = scrollY.addListener(({ value }) => {
      if (
        value + viewportHeight - ANIMATION_DELAY_BUFFER_PIXEL >= itemStartY &&
        value <= itemEndY
      ) {
        if (hideAnimation.current) {
          hideAnimation.current.stop();
          hideAnimation.current = null;
        }

        if (!isRunning.current) {
          isRunning.current = true;
          Animated.sequence([
            Animated.delay(delaySec * 1000),
            Animated.parallel([
              Animated.timing(translateY, {
                toValue: 0,
                duration: ANIMATION_DURATION,
                useNativeDriver: true,
              }),
              Animated.timing(opacity, {
                toValue: 1,
                duration: 500, //different than animation duration, tested with upmitt, submit to changes
                useNativeDriver: true,
              }),
            ]),
          ]).start(({ finished }) => {
            if (finished) {
              isRunning.current = false;
            }
          });
        }
      } else if (!hideAnimation.current && !isRunning.current) {
        hideAnimation.current = Animated.parallel([
          Animated.timing(translateY, {
            toValue:
              value > itemStartY
                ? -TRANSLATION_Y_ANIMATION
                : TRANSLATION_Y_ANIMATION,
            duration: ANIMATION_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 500,
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
    translateY,
    opacity,
    componentY,
    componentHeight,
    index,
    delaySec,
  ]);

  const disableAnimation = isModuleAnimationDisabled(
    displayMode,
    webCardViewMode,
  );

  const imageContainerStyle = useMemo(
    () => [
      {
        width: dimension.width,
        borderRadius: cardStyle?.borderRadius ?? 0,
        transform: [{ translateY: disableAnimation ? 0 : translateY }],

        opacity:
          disableAnimation ||
          (Platform.OS === 'android' && media.kind === 'video')
            ? 1
            : opacity,
      },
    ],
    [
      dimension.width,
      cardStyle?.borderRadius,
      disableAnimation,
      translateY,
      media.kind,
      opacity,
    ],
  );

  const imageQueuePriority = useMemo(
    () =>
      webCardViewMode === 'edit' ? 'normal' : inViewport ? 'high' : 'normal',
    [inViewport, webCardViewMode],
  );
  const { setMedia } = useFullScreenOverlayContext(media);

  return (
    <View style={{ width: displayDimension.width }} onLayout={onLayout}>
      <Animated.View style={imageContainerStyle}>
        <Pressable style={styles.flex} onPress={setMedia}>
          <CardModuleMediaSelector
            media={media}
            dimension={displayDimension}
            canPlay={canPlay && inViewport}
            imageStyle={{
              borderRadius: cardStyle?.borderRadius ?? 0,
              overflow: 'hidden',
            }}
            priority={imageQueuePriority}
          />
        </Pressable>
      </Animated.View>
    </View>
  );
};
const styles = StyleSheet.create({
  flex: { flex: 1 },
});

export default memo(AppearanceSliderContainer);

// this is a buffer in pixel before starting the animation
const ANIMATION_DELAY_BUFFER_PIXEL = 100;
const TRANSLATION_Y_ANIMATION = 200;
const ANIMATION_DURATION = 400;

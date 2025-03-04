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

type AlternationContainerProps = Pick<ViewProps, 'children' | 'onLayout'> & {
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
  isFullAlternation?: boolean;
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
  children,
  media,
  index,
  scrollY,
  modulePosition,
  parentY,
  canPlay,
  webCardViewMode,
  isFullAlternation,
}: AlternationContainerProps) => {
  const cardStyleGap = cardStyle?.gap || 0;

  const styles = useVariantStyleSheet(stylesheet, displayMode);
  const mediaWidth = isFullAlternation
    ? displayMode === 'desktop'
      ? dimension.width / 2
      : dimension.width
    : displayMode === 'desktop'
      ? dimension.width / 2 - cardStyleGap
      : dimension.width - 2 * cardStyleGap;

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
          ? 150
          : -150,
    ),
  ).current;
  const opacity = useRef(
    new Animated.Value(modulePosition === undefined && index === 0 ? 1 : 0),
  ).current;

  const hideAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const isRunning = useRef(false);

  useEffect(() => {
    const itemStartY = (modulePosition ?? 0) + (parentY ?? 0) + componentY;
    const itemEndY = itemStartY + componentHeight;
    //we need to handle the initial case where no scroll happened
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
            toValue: index % 2 === 0 ? 150 : -150,
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
        borderRadius: isFullAlternation ? 0 : (cardStyle?.borderRadius ?? 0),
        transform: [{ translateX: disableAnimation ? 0 : translateX }],
        opacity:
          disableAnimation ||
          (Platform.OS === 'android' && media.kind === 'video')
            ? 1
            : opacity,
        marginTop: isFullAlternation ? 0 : cardStyleGap,
        marginBottom:
          !isFullAlternation && displayMode === 'desktop' ? cardStyleGap : 0,
      },
    ],
    [
      styles.imageContainer,
      mediaWidth,
      isFullAlternation,
      cardStyle?.borderRadius,
      disableAnimation,
      translateX,
      media.kind,
      opacity,
      cardStyleGap,
      displayMode,
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
    (modulePosition ?? 0) + index * componentHeight,
    componentHeight,
    componentHeight > 0,
    webCardViewMode === 'edit',
    dimension,
  );

  if (!media || !children) {
    return null;
  }

  const textGap = Math.max(20, cardStyleGap);

  const even = index % 2 === 0;
  return (
    <View
      style={
        isFullAlternation ? styles.fullAlternationContainer : styles.container
      }
      onLayout={onLayout}
    >
      {displayMode === 'desktop' && even ? (
        <View
          style={{
            padding: textGap,
            width: dimension.width / 2,
          }}
        >
          {children}
        </View>
      ) : undefined}
      {displayMode !== 'desktop' || even ? (
        <Animated.View
          style={[
            imageContainerStyle,
            displayMode === 'desktop' && !isFullAlternation
              ? {
                  marginBottom: cardStyleGap,
                }
              : undefined,
          ]}
        >
          <CardModuleMediaSelector
            media={media}
            dimension={imageDimension}
            canPlay={canPlay && inViewport}
            priority={inViewport ? 'high' : 'normal'}
          />
        </Animated.View>
      ) : null}
      {displayMode === 'desktop' && !even ? (
        <View style={{ width: dimension.width / 2 }}>
          <Animated.View
            style={[
              imageContainerStyle,
              displayMode === 'desktop' && !isFullAlternation
                ? {
                    left: cardStyleGap,
                    width: mediaWidth,
                    marginBottom: cardStyleGap,
                  }
                : undefined,
            ]}
          >
            <CardModuleMediaSelector
              media={media}
              dimension={imageDimension}
              canPlay={canPlay && inViewport}
              priority={inViewport ? 'high' : 'normal'}
            />
          </Animated.View>
        </View>
      ) : null}
      {displayMode === 'mobile' || !even ? (
        <View
          style={{
            width:
              displayMode === 'desktop' ? dimension.width / 2 : dimension.width,
            padding: textGap,
          }}
        >
          {children}
        </View>
      ) : undefined}
    </View>
  );
};

const stylesheet = createVariantsStyleSheet(() => ({
  default: {
    container: { borderRadius: 0 },
    imageContainer: {
      overflow: 'hidden',
    },
  },
  mobile: {
    container: {
      flex: 1,
      flexDirection: 'column',
      alignItems: 'center',
    },
    fullAlternationContainer: {
      flex: 1,
      flexDirection: 'column',
      alignItems: 'center',
    },
  },
  desktop: {
    container: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    fullAlternationContainer: {
      flex: 1,
      flexDirection: 'row',
    },
  },
}));

export default AlternationContainer;

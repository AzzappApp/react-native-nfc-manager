import { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  COVER_BASE_WIDTH,
  COVER_RATIO,
  DEFAULT_COVER_CONTENT_ORTIENTATION,
  DEFAULT_COVER_CONTENT_POSITION,
  DEFAULT_COVER_FONT_FAMILY,
  DEFAULT_COVER_FONT_SIZE,
  DEFAULT_COVER_TEXT_COLOR,
} from '@azzapp/shared/coverHelpers';
import useLatestCallback from '#hooks/useLatestCallback';
import { getTextAnimator } from './coverTextAnimators';
import type {
  TextOrientation,
  TextPosition,
  TextStyle,
} from '@azzapp/shared/coverHelpers';
import type {
  ViewProps,
  ViewStyle,
  TextLayoutEventData,
  NativeSyntheticEvent,
  TextLayoutLine,
  LayoutChangeEvent,
  LayoutRectangle,
} from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

export type CoverTextRendererProps = Omit<ViewProps, 'children'> & {
  /**
   * The title of the cover
   */
  title: string | null | undefined;
  /**
   * The style of the title
   */
  titleStyle: TextStyle | null | undefined;
  /**
   * The sub title of the cover
   */
  subTitle: string | null | undefined;
  /**
   * The style of the sub title
   */
  subTitleStyle: TextStyle | null | undefined;
  /**
   * The text orientation of the cover
   */
  textOrientation: TextOrientation | null | undefined;
  /**
   * The text position of the cover
   */
  textPosition: TextPosition | null | undefined;
  /**
   * The animation of the text
   */
  textAnimation?: string | null | undefined;
  /**
   * The color palette of the cover
   */
  colorPalette: {
    primary: string;
    light: string;
    dark: string;
  };
  /**
   * the height of the cover
   */
  height: number;
  /**
   * animation shared value
   */
  animationSharedValue?: SharedValue<number> | null | undefined;

  /**
   * onReadyToAnimate callback
   */
  onReadyToAnimate?: () => void;
};

const CoverTextRenderer = ({
  title,
  titleStyle,
  subTitle,
  subTitleStyle,
  textOrientation,
  textPosition,
  height,
  style,
  colorPalette,
  textAnimation,
  animationSharedValue,
  onReadyToAnimate,
  ...props
}: CoverTextRendererProps) => {
  const width = height * COVER_RATIO;
  const scale = width / COVER_BASE_WIDTH;

  const orientation = textOrientation ?? DEFAULT_COVER_CONTENT_ORTIENTATION;
  const position = textPosition ?? DEFAULT_COVER_CONTENT_POSITION;

  const verticalPosition: 'bottom' | 'middle' | 'top' =
    // prettier-ignore
    position.startsWith( 'top', )
    ? 'top'
    : position.startsWith('bottom')
    ? 'bottom'
    : 'middle';

  const horizontalPosition: 'center' | 'left' | 'right' =
    // prettier-ignore
    position.endsWith( 'Left', )
    ? 'left'
    : position.endsWith('Right')
    ? 'right'
    : 'center';

  let overlayJustifyContent: ViewStyle['justifyContent'];
  if (orientation === 'horizontal') {
    overlayJustifyContent =
      verticalPosition === 'top'
        ? 'flex-start'
        : verticalPosition === 'middle'
        ? 'center'
        : 'flex-end';
  } else if (orientation === 'topToBottom') {
    overlayJustifyContent =
      horizontalPosition === 'left'
        ? 'flex-end'
        : horizontalPosition === 'center'
        ? 'center'
        : 'flex-start';
  } else {
    overlayJustifyContent =
      horizontalPosition === 'left'
        ? 'flex-start'
        : horizontalPosition === 'center'
        ? 'center'
        : 'flex-end';
  }

  let textAlign: 'center' | 'left' | 'right';
  if (orientation === 'horizontal') {
    textAlign =
      horizontalPosition === 'left'
        ? 'left'
        : horizontalPosition === 'center'
        ? 'center'
        : 'right';
  } else if (orientation === 'topToBottom') {
    textAlign =
      verticalPosition === 'top'
        ? 'left'
        : verticalPosition === 'middle'
        ? 'center'
        : 'right';
  } else {
    textAlign =
      verticalPosition === 'bottom'
        ? 'left'
        : verticalPosition === 'middle'
        ? 'center'
        : 'right';
  }

  const topPadding = width * 0.15;
  const padding = width * 0.05;

  const titleOverlayStyles: ViewStyle | null = {
    position: 'absolute',
    width: orientation === 'horizontal' ? width : height,
    height: orientation === 'horizontal' ? height : width,
    transform:
      orientation !== 'horizontal'
        ? [
            { rotate: orientation === 'bottomToTop' ? '-90deg' : '90deg' },
            {
              translateX:
                // prettier-ignore
                (orientation === 'bottomToTop' ? -1 : 1) * 
                (height - width) / 2,
            },
            {
              translateY:
                // prettier-ignore
                (orientation === 'bottomToTop' ? 1 : -1) * 
                (width - height) / 2,
            },
          ]
        : [],
    paddingBottom: padding,
    paddingTop: orientation === 'horizontal' ? topPadding : padding,
    paddingLeft: orientation === 'topToBottom' ? topPadding : padding,
    paddingRight: orientation === 'bottomToTop' ? topPadding : padding,
    justifyContent: overlayJustifyContent,
  };

  const titleTextStyle = {
    fontFamily: titleStyle?.fontFamily ?? DEFAULT_COVER_FONT_FAMILY,
    color: swapColor(
      titleStyle?.color ?? DEFAULT_COVER_TEXT_COLOR,
      colorPalette,
    ),
    fontSize: (titleStyle?.fontSize ?? DEFAULT_COVER_FONT_SIZE) * scale,
    textAlign,
  } as const;

  const subTitleTextStyle = {
    fontFamily: subTitleStyle?.fontFamily ?? DEFAULT_COVER_FONT_FAMILY,
    color: swapColor(
      subTitleStyle?.color ?? DEFAULT_COVER_TEXT_COLOR,
      colorPalette,
    ),
    fontSize: (subTitleStyle?.fontSize ?? DEFAULT_COVER_FONT_SIZE) * scale,
    textAlign,
  } as const;

  const [textContainerLayout, setTextContainerLayout] =
    useState<LayoutRectangle | null>(null);
  const [titleLayout, setTitleLayout] = useState<TextLayoutLine[] | null>(null);
  const [subTitleLayout, setSubTitleLayout] = useState<TextLayoutLine[] | null>(
    null,
  );

  const currentTitle = useRef(title);
  const currentSubTitle = useRef(subTitle);
  const readyToAnimated = useRef(false);

  if (currentTitle.current !== title) {
    currentTitle.current = title;
    setTitleLayout(null);
    setTextContainerLayout(null);
    readyToAnimated.current = false;
  }
  if (currentSubTitle.current !== subTitle) {
    currentSubTitle.current = subTitle;
    setSubTitleLayout(null);
    setTextContainerLayout(null);
    readyToAnimated.current = false;
  }

  const onTitleLayout = useCallback(
    (event: NativeSyntheticEvent<TextLayoutEventData>) => {
      setTitleLayout(event.nativeEvent.lines);
    },
    [],
  );

  const onSubTitleLayout = useCallback(
    (event: NativeSyntheticEvent<TextLayoutEventData>) => {
      setSubTitleLayout(event.nativeEvent.lines);
    },
    [],
  );

  const onTextContainerLayout = useCallback((event: LayoutChangeEvent) => {
    setTextContainerLayout(event.nativeEvent.layout);
  }, []);

  const layoutMeasurementReady =
    !!textContainerLayout &&
    (!title || !!titleLayout) &&
    (!subTitle || !!subTitleLayout);

  const onReadyToAnimateRef = useLatestCallback(onReadyToAnimate);
  useEffect(() => {
    if (layoutMeasurementReady && !readyToAnimated.current) {
      onReadyToAnimateRef?.();
      readyToAnimated.current = true;
    }
  }, [layoutMeasurementReady, onReadyToAnimateRef]);

  if (!title && !subTitle) {
    return null;
  }

  const CoverTextAnimator = textAnimation
    ? getTextAnimator(textAnimation)
    : null;

  return (
    <View style={[style, { height, width }]} {...props}>
      <View style={titleOverlayStyles}>
        <View
          onLayout={onTextContainerLayout}
          style={{
            opacity: animationSharedValue && CoverTextAnimator ? 0 : 1,
          }}
        >
          <Text
            allowFontScaling={false}
            style={titleTextStyle}
            onTextLayout={onTitleLayout}
          >
            {title}
          </Text>
          {!!subTitle && (
            <Text
              allowFontScaling={false}
              style={subTitleTextStyle}
              onTextLayout={onSubTitleLayout}
            >
              {subTitle}
            </Text>
          )}
        </View>
        {animationSharedValue &&
          CoverTextAnimator &&
          layoutMeasurementReady && (
            <CoverTextAnimator
              title={title}
              titleLayout={titleLayout}
              titleTextStyle={titleTextStyle}
              subTitle={subTitle}
              subTitleLayout={subTitleLayout}
              subTitleTextStyle={subTitleTextStyle}
              textContainerLayout={textContainerLayout}
              orientation={orientation}
              animation={textAnimation!}
              animationSharedValue={animationSharedValue}
              height={height}
            />
          )}
      </View>
    </View>
  );
};

export default CoverTextRenderer;

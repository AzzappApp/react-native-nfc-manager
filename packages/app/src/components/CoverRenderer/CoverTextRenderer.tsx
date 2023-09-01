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
import type {
  TextOrientation,
  TextPosition,
  TextStyle,
} from '@azzapp/shared/coverHelpers';
import type { ViewProps, ViewStyle } from 'react-native';

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
   * the height of the cover
   */
  height: number;
  /**
   * The color palette of the cover
   */
  colorPalette: {
    primary: string;
    light: string;
    dark: string;
  };
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

  const topPadding = width * 0.3;
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

  return (
    <View style={[style, { height, width }]} {...props}>
      <View style={titleOverlayStyles}>
        <Text allowFontScaling={false} style={titleTextStyle}>
          {title ?? ''}
        </Text>
        {!!subTitle && (
          <Text allowFontScaling={false} style={subTitleTextStyle}>
            {subTitle}
          </Text>
        )}
      </View>
    </View>
  );
};

export default CoverTextRenderer;

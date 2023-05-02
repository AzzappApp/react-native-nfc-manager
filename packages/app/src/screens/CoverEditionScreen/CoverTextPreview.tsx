import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Text, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import {
  COVER_BASE_WIDTH,
  COVER_RATIO,
  DEFAULT_COVER_CONTENT_ORTIENTATION,
  DEFAULT_COVER_CONTENT_PLACEMENT,
  DEFAULT_COVER_FONT_FAMILY,
  DEFAULT_COVER_FONT_SIZE,
  DEFAULT_COVER_TEXT_COLOR,
} from '@azzapp/shared/cardHelpers';
import type {
  CardCoverContentStyleInput,
  CardCoverTextStyleInput,
} from '@azzapp/relay/artifacts/CoverEditionScreenMutation.graphql';
import type { ForwardedRef } from 'react';
import type { ViewProps, ViewStyle } from 'react-native';

export type CoverTextPreviewProps = Omit<ViewProps, 'children'> & {
  /**
   * The title of the cover
   */
  title: string | null | undefined;
  /**
   * The style of the title
   */
  titleStyle: CardCoverTextStyleInput | null | undefined;
  /**
   * The sub title of the cover
   */
  subTitle: string | null | undefined;
  /**
   * The style of the sub title
   */
  subTitleStyle: CardCoverTextStyleInput | null | undefined;
  /**
   * The style of the content
   */
  contentStyle: CardCoverContentStyleInput | null | undefined;
  /**
   * the height of the cover
   */
  height: number;
};

export type CoverTextPreviewHandle = {
  capture: () => Promise<string | null>;
};

const CoverTextPreview = (
  {
    title,
    titleStyle,
    subTitle,
    subTitleStyle,
    contentStyle,
    height,
    style,
    ...props
  }: CoverTextPreviewProps,
  forwardedRef: ForwardedRef<CoverTextPreviewHandle>,
) => {
  const width = height * COVER_RATIO;
  const scale = width / COVER_BASE_WIDTH;

  const orientation =
    contentStyle?.orientation ?? DEFAULT_COVER_CONTENT_ORTIENTATION;
  const placement = contentStyle?.placement ?? DEFAULT_COVER_CONTENT_PLACEMENT;

  const verticalPosition: 'bottom' | 'middle' | 'top' =
    // prettier-ignore
    placement.startsWith( 'top', )
    ? 'top'
    : placement.startsWith('bottom')
    ? 'bottom'
    : 'middle';

  const horizontalPosition: 'center' | 'left' | 'right' =
    // prettier-ignore
    placement.endsWith( 'Left', )
    ? 'left'
    : placement.endsWith('Right')
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
    padding: '5%',
    paddingTop: orientation === 'horizontal' ? '30%' : '5%',
    paddingLeft: orientation === 'topToBottom' ? '30%' : '5%',
    paddingRight: orientation === 'bottomToTop' ? '30%' : '5%',
    justifyContent: overlayJustifyContent,
  };

  const titleTextStyle = {
    fontFamily: titleStyle?.fontFamily ?? DEFAULT_COVER_FONT_FAMILY,
    color: titleStyle?.color ?? DEFAULT_COVER_TEXT_COLOR,
    fontSize: (titleStyle?.fontSize ?? DEFAULT_COVER_FONT_SIZE) * scale,
    textAlign,
  } as const;

  const subTitleTextStyle = {
    fontFamily: subTitleStyle?.fontFamily ?? DEFAULT_COVER_FONT_FAMILY,
    color: subTitleStyle?.color ?? DEFAULT_COVER_TEXT_COLOR,
    fontSize: (subTitleStyle?.fontSize ?? DEFAULT_COVER_FONT_SIZE) * scale,
    textAlign,
  } as const;

  const textOverlayRef = useRef<View | null>(null);

  useImperativeHandle(
    forwardedRef,
    () => ({
      async capture() {
        if (textOverlayRef.current == null) {
          return null;
        }
        return captureRef(textOverlayRef.current, {
          format: 'png',
          quality: 1,
        });
      },
    }),
    [],
  );

  return (
    <View ref={textOverlayRef} style={[style, { height, width }]} {...props}>
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

export default forwardRef(CoverTextPreview);

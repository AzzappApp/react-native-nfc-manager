'use client';

import cx from 'classnames';
import useResizeObserver from 'use-resize-observer';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  COVER_BASE_WIDTH,
  DEFAULT_COVER_CONTENT_ORTIENTATION,
  DEFAULT_COVER_CONTENT_POSITION,
  DEFAULT_COVER_FONT_FAMILY,
  DEFAULT_COVER_FONT_SIZE,
  DEFAULT_COVER_TEXT_COLOR,
} from '@azzapp/shared/coverHelpers';
import { fontsMap } from '#helpers/fonts';
import styles from './CoverTextRenderer.css';
import type {
  TextOrientation,
  TextPosition,
  TextStyle,
} from '@azzapp/shared/coverHelpers';

export type CoverTextRendererProps = Omit<
  React.HTMLProps<HTMLDivElement>,
  'children' | 'title'
> & {
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
  style,
  colorPalette,
  className,
  ...props
}: CoverTextRendererProps) => {
  const { ref, width = 0 } = useResizeObserver<HTMLDivElement>({
    round: Math.floor,
  });

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

  let overlayJustifyContent: 'center' | 'flex-end' | 'flex-start';
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

  const titleFontFamily = titleStyle?.fontFamily ?? DEFAULT_COVER_FONT_FAMILY;

  const scale = width / COVER_BASE_WIDTH;

  const titleTextStyle = {
    color: swapColor(
      titleStyle?.color ?? DEFAULT_COVER_TEXT_COLOR,
      colorPalette,
    ),
    fontSize: `${(titleStyle?.fontSize ?? DEFAULT_COVER_FONT_SIZE) * scale}px`,
    textAlign,
  } as const;

  const subTitleFontFamily =
    subTitleStyle?.fontFamily ?? DEFAULT_COVER_FONT_FAMILY;
  const subTitleTextStyle = {
    color: swapColor(
      subTitleStyle?.color ?? DEFAULT_COVER_TEXT_COLOR,
      colorPalette,
    ),
    fontSize: `${
      (subTitleStyle?.fontSize ?? DEFAULT_COVER_FONT_SIZE) * scale
    }px`,
    textAlign,
  } as const;

  return (
    <div className={cx(styles.coverTextRender, className)} ref={ref} {...props}>
      <h1
        style={{
          justifyContent: overlayJustifyContent,
        }}
        className={cx(
          styles.coverTextContainer,
          orientation !== 'horizontal' && styles.coverTextContainerVertical,
          orientation === 'horizontal' && styles.coverTextContainerHorizontal,
          orientation === 'topToBottom' && styles.coverTextContainerTopToBottom,
          orientation === 'bottomToTop' && styles.coverTextContainerBottomToTop,
        )}
      >
        <div
          style={titleTextStyle}
          className={fontsMap[titleFontFamily].className}
        >
          {title ?? ''}
        </div>
        {!!subTitle && (
          <div
            style={subTitleTextStyle}
            className={fontsMap[subTitleFontFamily].className}
          >
            {subTitle}
          </div>
        )}
      </h1>
    </div>
  );
};

export default CoverTextRenderer;

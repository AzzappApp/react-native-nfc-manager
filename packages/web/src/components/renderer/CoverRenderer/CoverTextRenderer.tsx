import cx from 'classnames';
import {
  forwardRef,
  type ForwardedRef,
  useImperativeHandle,
  useRef,
} from 'react';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  COVER_BASE_WIDTH,
  DEFAULT_COVER_CONTENT_ORTIENTATION,
  DEFAULT_COVER_CONTENT_POSITION,
  DEFAULT_COVER_FONT_FAMILY,
  DEFAULT_COVER_FONT_SIZE,
  DEFAULT_COVER_TEXT_COLOR,
} from '@azzapp/shared/coverHelpers';
import { extractLetters } from '@azzapp/shared/stringHelpers';
import { fontsMap } from '#helpers/fonts';
import { textAnimations } from './CoverRendererTextAnimations';
import styles from './CoverTextRenderer.css';
import type {
  TextOrientation,
  TextPosition,
  TextStyle,
} from '@azzapp/shared/coverHelpers';

export type CoverTextRendererProps = Omit<
  React.HTMLProps<HTMLDivElement>,
  'children' | 'title' | 'width'
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

  width?: number;

  textAnimation?: string | null;
};

export type CoverTextRenderHandler = {
  playJsAnimation: (duration: number, iterations: number) => void;
};

const CoverTextRenderer = (
  {
    title,
    titleStyle,
    subTitle,
    subTitleStyle,
    textOrientation,
    textPosition,
    style,
    colorPalette,
    className,
    width,
    textAnimation,
    ...props
  }: CoverTextRendererProps,
  ref: ForwardedRef<CoverTextRenderHandler>,
) => {
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

  const scale = width && width / COVER_BASE_WIDTH;

  const titleTextStyle = {
    color: swapColor(
      titleStyle?.color ?? DEFAULT_COVER_TEXT_COLOR,
      colorPalette,
    ),
    fontSize: scale
      ? `${(titleStyle?.fontSize ?? DEFAULT_COVER_FONT_SIZE) * scale}px`
      : `${titleStyle?.fontSize ?? DEFAULT_COVER_FONT_SIZE}em`,
    textAlign,
    position: 'relative',
    wordWrap: 'break-word',
    whiteSpace: 'pre',
  } as const;

  const subTitleFontFamily =
    subTitleStyle?.fontFamily ?? DEFAULT_COVER_FONT_FAMILY;
  const subTitleTextStyle = {
    color: swapColor(
      subTitleStyle?.color ?? DEFAULT_COVER_TEXT_COLOR,
      colorPalette,
    ),
    fontSize: scale
      ? `${(subTitleStyle?.fontSize ?? DEFAULT_COVER_FONT_SIZE) * scale}px`
      : `${subTitleStyle?.fontSize ?? DEFAULT_COVER_FONT_SIZE}em`,
    textAlign,
    position: 'relative',
    wordWrap: 'break-word',
    whiteSpace: 'pre',
  } as const;

  const foundAnimation =
    textAnimation && textAnimation in textAnimations
      ? textAnimations[textAnimation as keyof typeof textAnimations]
      : null;

  const maskDirection = textAnimation?.endsWith('Left')
    ? 'right'
    : textAnimation?.endsWith('Right')
      ? 'left'
      : textAnimation?.endsWith('Top')
        ? 'bottom'
        : textAnimation?.endsWith('Bottom')
          ? 'top'
          : null;

  const containersRef = useRef<HTMLDivElement[]>([]);

  const titleLetters = extractLetters(title ?? '');
  const subTitleLetters = extractLetters(subTitle ?? '');

  const lettersRef = useRef<
    Array<{ el: HTMLSpanElement; letterAnimPosition: number }>
  >([]);

  useImperativeHandle(
    ref,
    () => ({
      playJsAnimation: (duration: number, iterations?: number) => {
        if (foundAnimation) {
          if (Array.isArray(foundAnimation)) {
            containersRef.current.map(c =>
              c.animate(foundAnimation, {
                duration,
                iterations: iterations ?? 1,
              }),
            );
          } else if (typeof foundAnimation === 'function') {
            lettersRef.current.map(l =>
              l.el.animate(foundAnimation(l.letterAnimPosition), {
                duration,
                iterations: iterations ?? 1,
              }),
            );
          }
        }
      },
    }),
    [foundAnimation],
  );

  return (
    <div className={cx(styles.coverTextRender, className)} {...props}>
      <div
        style={{
          justifyContent: overlayJustifyContent,
          maskImage:
            maskDirection === 'left' || maskDirection === 'top'
              ? `linear-gradient(to ${maskDirection}, transparent 0%, black 5%, black 100%)`
              : maskDirection === 'right' || maskDirection === 'bottom'
                ? `linear-gradient(to ${maskDirection}, black 0%, black 95%, transparent 100%)`
                : undefined,
        }}
        className={cx(
          styles.coverTextContainer,
          orientation !== 'horizontal' && styles.coverTextContainerVertical,
          orientation === 'horizontal'
            ? verticalPosition === 'bottom'
              ? styles.coverTextContainerBottomHorizontal
              : styles.coverTextContainerHorizontal
            : undefined,
          orientation === 'topToBottom' && styles.coverTextContainerTopToBottom,
          orientation === 'bottomToTop' && styles.coverTextContainerBottomToTop,
        )}
      >
        <div className={styles.coverTextContentContainer}>
          <h1
            className={styles.coverTextContent}
            ref={el => {
              if (el && !containersRef.current.includes(el)) {
                containersRef.current.push(el);
              }
            }}
          >
            <span
              style={titleTextStyle}
              className={fontsMap[titleFontFamily].className}
            >
              {foundAnimation && typeof foundAnimation === 'function'
                ? titleLetters.map((letter, index, arr) => (
                    <span
                      className={styles.coverTextLetter}
                      key={index}
                      ref={el => {
                        if (el && !lettersRef.current.some(l => l.el === el)) {
                          lettersRef.current.push({
                            el,
                            letterAnimPosition:
                              (index + 1) /
                              (arr.length + subTitleLetters.length),
                          });
                        }
                      }}
                    >
                      {letter}
                    </span>
                  ))
                : title ?? ''}
            </span>
            {!!subTitle && (
              <span
                style={subTitleTextStyle}
                className={fontsMap[subTitleFontFamily].className}
              >
                {foundAnimation && typeof foundAnimation === 'function'
                  ? extractLetters(subTitle).map((letter, index, arr) => (
                      <span
                        className={styles.coverTextLetter}
                        key={index}
                        ref={el => {
                          if (
                            el &&
                            !lettersRef.current.some(l => l.el === el)
                          ) {
                            lettersRef.current.push({
                              el,
                              letterAnimPosition:
                                (titleLetters.length + index + 1) /
                                (arr.length + titleLetters.length),
                            });
                          }
                        }}
                      >
                        {letter}
                      </span>
                    ))
                  : subTitle}
              </span>
            )}
          </h1>
        </div>
      </div>
    </div>
  );
};

export default forwardRef(CoverTextRenderer);

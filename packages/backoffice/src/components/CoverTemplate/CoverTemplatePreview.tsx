import { useMemo } from 'react';
import {
  COVER_BASE_WIDTH,
  COVER_CARD_RADIUS,
  COVER_RATIO,
  DEFAULT_COVER_FONT_FAMILY,
  DEFAULT_COVER_FONT_SIZE,
  DEFAULT_COVER_TEXT_COLOR,
} from '@azzapp/shared/cardHelpers';
import { getImageURLForSize } from '@azzapp/shared/imagesHelpers';

import ImageTintColor from '#components/ImageTintColor';
import type { DetailedHTMLProps, HTMLAttributes } from 'react';

type CoverTemplatePreview = {
  values?: any;
  containerHeight?: number;
  thumbnail?: boolean;
};

//const CONTAINER_WIDTH = 375;
const CONTAINER_HEIGHT = 600;

const CoverTemplatePreview: React.FC<CoverTemplatePreview> = ({
  values,
  containerHeight = CONTAINER_HEIGHT,
  thumbnail = false,
}: CoverTemplatePreview) => {
  const containerWidth = useMemo(() => {
    return COVER_RATIO * containerHeight;
  }, [containerHeight]);
  const fontScale = useMemo(
    () => containerWidth / COVER_BASE_WIDTH,
    [containerWidth],
  );
  const {
    sourceMediaId,
    foregroundId,
    backgroundId,
    foregroundStyle,
    backgroundStyle,
    title,
    titleStyle,
    subTitle,
    subTitleStyle,
    contentStyle,
  } = values;

  const sourceMedia = useMemo(() => {
    if (sourceMediaId) {
      if (typeof sourceMediaId === 'string') {
        return getImageURLForSize(sourceMediaId, undefined, containerHeight, 1);
      }
      return sourceMediaId.src;
    }
  }, [containerHeight, sourceMediaId]);

  const orientation = contentStyle?.orientation;
  const placement = contentStyle?.placement;

  const verticalPosition = useMemo(() => {
    // prettier-ignore
    if (contentStyle?.placement){
   return  placement.startsWith( 'top', )
    ? 'top'
    : placement.startsWith('bottom')
    ? 'bottom'
    : 'middle';}
    else {
      return "bottom"
    }
  }, [contentStyle?.placement, placement]);

  const horizontalPosition = useMemo(() => {
    if (contentStyle?.placement) {
      return placement.endsWith('Left')
        ? 'left'
        : placement.endsWith('Right')
        ? 'right'
        : 'center';
    } else {
      return 'left';
    }
  }, [contentStyle?.placement, placement]);

  const overlayJustifyContent = useMemo(() => {
    if (orientation === 'horizontal') {
      return verticalPosition === 'top'
        ? 'flex-start'
        : verticalPosition === 'middle'
        ? 'center'
        : 'flex-end';
    } else if (orientation === 'topToBottom') {
      return horizontalPosition === 'left'
        ? 'flex-end'
        : horizontalPosition === 'center'
        ? 'center'
        : 'flex-start';
    } else {
      return horizontalPosition === 'left'
        ? 'flex-start'
        : horizontalPosition === 'center'
        ? 'center'
        : 'flex-end';
    }
  }, [horizontalPosition, orientation, verticalPosition]);

  const textAlign = useMemo(() => {
    if (orientation === 'horizontal') {
      return horizontalPosition === 'left'
        ? 'left'
        : horizontalPosition === 'center'
        ? 'center'
        : 'right';
    } else if (orientation === 'topToBottom') {
      return verticalPosition === 'top'
        ? 'left'
        : verticalPosition === 'middle'
        ? 'center'
        : 'right';
    } else {
      return verticalPosition === 'bottom'
        ? 'left'
        : verticalPosition === 'middle'
        ? 'center'
        : 'right';
    }
  }, [horizontalPosition, orientation, verticalPosition]);

  const titleOverlayStyles = useMemo(() => {
    if (orientation) {
      const cHeight =
        orientation === 'horizontal' ? containerHeight : containerWidth;
      const cWidth =
        orientation === 'horizontal' ? containerWidth : containerHeight;
      const res: Record<string, number | string> = {
        // position: 'absolute',
        display: 'flex',
        flexDirection: 'column',
        width: cWidth,
        height: cHeight,
        padding: '5%',
        paddingTop: orientation === 'horizontal' ? '30%' : '5%',
        paddingLeft: orientation === 'topToBottom' ? '30%' : '5%',
        paddingRight: orientation === 'bottomToTop' ? '30%' : '5%',
        justifyContent: overlayJustifyContent,
      };

      if (orientation === 'bottomToTop') {
        res.transform = `rotate(-90deg) translate(${
          -(containerHeight - containerWidth) / 2
        }px, ${(containerWidth - containerHeight) / 2}px)`;
      } else if (orientation === 'topToBottom') {
        res.transform = `rotate(90deg) translate(${
          (containerHeight - containerWidth) / 2
        }px, ${-(containerWidth - containerHeight) / 2}px)`;
      }
      return res;
    } else {
      return {};
    }
  }, [containerHeight, containerWidth, orientation, overlayJustifyContent]);

  const titleTextStyle: DetailedHTMLProps<
    HTMLAttributes<HTMLSpanElement>,
    HTMLSpanElement
  > = useMemo(() => {
    return {
      display: 'flex',
      flexDirection: 'column',
      fontFamily: titleStyle?.fontFamily ?? DEFAULT_COVER_FONT_FAMILY,
      color: titleStyle?.color ?? DEFAULT_COVER_TEXT_COLOR,
      fontSize: (titleStyle?.fontSize ?? DEFAULT_COVER_FONT_SIZE) * fontScale,
      textAlign,
    };
  }, [
    fontScale,
    textAlign,
    titleStyle?.color,
    titleStyle?.fontFamily,
    titleStyle?.fontSize,
  ]);

  const subTitleTextStyle: DetailedHTMLProps<
    HTMLAttributes<HTMLSpanElement>,
    HTMLSpanElement
  > = useMemo(() => {
    return {
      display: 'flex',
      flexDirection: 'column',
      fontFamily: subTitleStyle?.fontFamily ?? DEFAULT_COVER_FONT_FAMILY,
      color: subTitleStyle?.color ?? DEFAULT_COVER_TEXT_COLOR,
      fontSize:
        (subTitleStyle?.fontSize ?? DEFAULT_COVER_FONT_SIZE) * fontScale,
      textAlign,
    };
  }, [
    fontScale,
    subTitleStyle?.color,
    subTitleStyle?.fontFamily,
    subTitleStyle?.fontSize,
    textAlign,
  ]);

  return (
    <div
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: containerWidth + 20,
        marginRight: 10,
        marginLeft: 10,
        display: 'flex',
        alignSelf: 'flex-start',
        backgroundColor: 'white',
        borderRadius: 4,
        borderColor: 'rgb(128,128,128)',
        boxShadow: thumbnail
          ? 'none'
          : '0px 2px 1px -1px rgb(0 0 0 / 20%), 0px 1px 1px 0px rgb(0 0 0 / 14%), 0px 1px 3px 0px rgb(0 0 0 / 12%)',
      }}
    >
      <div
        style={{
          height: containerHeight,
          width: containerWidth,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
          borderRadius: COVER_CARD_RADIUS * containerWidth,
        }}
      >
        {backgroundId && (
          <ImageTintColor
            src={getImageURLForSize(
              backgroundId,
              undefined,
              containerHeight,
              1,
            )}
            width={containerWidth}
            height={containerHeight}
            style={{
              position: 'absolute',
              height: containerHeight,
              backgroundColor: 'transparent',
              zIndex: 0,
              borderRadius: COVER_CARD_RADIUS * containerWidth,
            }}
            color={backgroundStyle?.patternColor}
          />
        )}
        <img
          src={sourceMedia}
          height={containerHeight}
          style={{
            zIndex: 2,
          }}
        />
        {foregroundId && (
          <ImageTintColor
            src={getImageURLForSize(
              foregroundId,
              undefined,
              containerHeight,
              1,
            )}
            width={containerWidth}
            height={containerHeight}
            style={{
              position: 'absolute',
              height: containerHeight,
              borderRadius: COVER_CARD_RADIUS * containerWidth,
              zIndex: 4,
            }}
            color={foregroundStyle?.color}
          />
        )}
        {(title || subTitle) && (
          <div
            style={{
              position: 'absolute',
              height: containerHeight,
              width: containerWidth,
              zIndex: 40,
            }}
          >
            <div style={{ ...titleOverlayStyles }}>
              <span
                style={{
                  ...titleTextStyle,
                  width: '100%',
                  zIndex: 40,
                  lineHeight: 1, // cannot be sure it is the correct value to set.
                }}
              >
                {title}
              </span>
              {!!subTitle && (
                <span
                  style={{
                    ...subTitleTextStyle,
                    width: '100%',
                    zIndex: 40,
                    lineHeight: 1,
                  }}
                >
                  {subTitle}
                </span>
              )}
            </div>
          </div>
        )}
        {!thumbnail && (
          <div
            style={{
              position: 'absolute',
              height: containerHeight,
              width: containerWidth,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              backgroundColor: 'transparent',
            }}
          >
            <img
              src={'static/QR_code.png'}
              style={{
                borderRadius: 8,
                width: 55,
                height: 55,
                marginTop: 30,
                zIndex: 20,
              }}
            />
          </div>
        )}
        {!thumbnail && (
          <div
            style={{
              border: 1,
              borderStyle: 'solid',
              width: containerWidth,
              height: containerHeight,
              position: 'absolute',
              backgroundColor: 'transparent',
              zIndex: 5,
            }}
          />
        )}
      </div>
    </div>
  );
};

export default CoverTemplatePreview;

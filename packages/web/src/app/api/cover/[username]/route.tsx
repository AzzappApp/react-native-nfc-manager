import { ImageResponse } from '@vercel/og';
import cx from 'classnames';
import { NextResponse, type NextRequest } from 'next/server';
import { getMediasByIds, getWebCardByUserName } from '@azzapp/data/domains';
import { swapColor, DEFAULT_COLOR_PALETTE } from '@azzapp/shared/cardHelpers';
import {
  COVER_BASE_WIDTH,
  COVER_MAX_WIDTH,
  COVER_RATIO,
  DEFAULT_COVER_CONTENT_ORTIENTATION,
  DEFAULT_COVER_CONTENT_POSITION,
  DEFAULT_COVER_FONT_FAMILY,
  DEFAULT_COVER_FONT_SIZE,
  DEFAULT_COVER_TEXT_COLOR,
} from '@azzapp/shared/coverHelpers';
import ERRORS from '@azzapp/shared/errors';
import { decodeMediaId } from '@azzapp/shared/imagesHelpers';
import coverTextStyle from '#components/renderer/CoverRenderer/CoverTextRenderer.css';
import styles from '../../../../components/renderer/CoverRenderer/CoverRenderer.css';

export const runtime = 'edge';

const CLOUDINARY_CLOUDNAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const CLOUDINARY_BASE_URL = `https://res.cloudinary.com/${CLOUDINARY_CLOUDNAME}`;

export const GET = async (
  req: NextRequest,
  {
    params: { username },
  }: {
    params: { username: string };
  },
) => {
  const { searchParams } = req.nextUrl;
  const paramWidth = searchParams.get('width');
  const paramHeight = searchParams.get('height');
  const keepAspectRatio = searchParams.get('keepAspectRatio');

  const foundWidth =
    paramWidth && !isNaN(parseFloat(paramWidth))
      ? parseFloat(paramWidth)
      : null;
  const foundHeight =
    paramHeight && !isNaN(parseFloat(paramHeight))
      ? parseFloat(paramHeight)
      : null;

  let width: number | undefined = undefined;
  let height: number | undefined = undefined;

  if (foundWidth && foundHeight) {
    width = foundWidth;
    height = foundHeight;
  }

  if (foundHeight && !foundWidth) {
    height = foundHeight;
    width = foundHeight * COVER_RATIO;
  }

  if (foundWidth && !foundHeight) {
    width = foundWidth;
    height = foundWidth / COVER_RATIO;
  }

  if (!width) {
    width = COVER_MAX_WIDTH;
  }

  if (!height) {
    height = width / COVER_RATIO;
  }

  const imageWidth = keepAspectRatio ? height * COVER_RATIO : width;

  const scale = imageWidth / COVER_BASE_WIDTH;

  if (!username) {
    return NextResponse.json({ message: ERRORS.NOT_FOUND }, { status: 404 });
  }

  const webCard = await getWebCardByUserName(username);

  if (webCard?.cardIsPublished) {
    const { coverData, cardColors, coverTitle, coverSubTitle } = webCard;
    const mediaId = coverData?.mediaId;
    if (mediaId) {
      const [media] = await getMediasByIds([mediaId]);

      const url = (width: number, height: number) =>
        `${CLOUDINARY_BASE_URL}/${
          media?.kind === 'video' ? 'video' : 'image'
        }/upload${
          coverData.backgroundId
            ? `/u_${decodeMediaId(
                coverData.backgroundId,
              )}/fl_relative,w_1.0,e_colorize,co_rgb:${swapColor(
                coverData.backgroundPatternColor ?? '#FFF',
                cardColors,
              ).replace('#', '')},b_rgb:${swapColor(
                coverData.backgroundColor ?? 'light',
                cardColors,
              ).replace('#', '')}/fl_layer_apply`
            : ''
        }${
          coverData.foregroundId
            ? `/l_${decodeMediaId(
                coverData.foregroundId,
              )}/fl_relative,w_1.0,e_colorize,co_rgb:${swapColor(
                coverData.foregroundColor ?? '#FFF',
                cardColors,
              ).replace('#', '')}/fl_layer_apply/`
            : ''
        }${
          keepAspectRatio === 'left_pad' ? 'c_lpad' : 'c_fit'
        },g_east,w_${width},h_${height},ar_1:1/${decodeMediaId(mediaId)}.png`;

      const orientation =
        coverData.textOrientation ?? DEFAULT_COVER_CONTENT_ORTIENTATION;
      const position = coverData.textPosition ?? DEFAULT_COVER_CONTENT_POSITION;

      const verticalPosition: 'bottom' | 'middle' | 'top' =
        // prettier-ignore
        position.startsWith( 'top' )
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

      let textAlign: 'center' | 'flex-end' | 'flex-start';
      if (orientation === 'horizontal') {
        textAlign =
          horizontalPosition === 'left'
            ? 'flex-start'
            : horizontalPosition === 'center'
            ? 'center'
            : 'flex-end';
      } else if (orientation === 'topToBottom') {
        textAlign =
          verticalPosition === 'top'
            ? 'flex-start'
            : verticalPosition === 'middle'
            ? 'center'
            : 'flex-end';
      } else {
        textAlign =
          verticalPosition === 'bottom'
            ? 'flex-start'
            : verticalPosition === 'middle'
            ? 'center'
            : 'flex-end';
      }

      const titleFontFamily =
        coverData.titleStyle?.fontFamily ?? DEFAULT_COVER_FONT_FAMILY;
      const titleTextStyle = {
        color: swapColor(
          coverData.titleStyle?.color ?? DEFAULT_COVER_TEXT_COLOR,
          cardColors ?? DEFAULT_COLOR_PALETTE,
        ),
        fontSize: `${
          scale * (coverData.titleStyle?.fontSize ?? DEFAULT_COVER_FONT_SIZE)
        }px`,
      } as const;

      const subTitleFontFamily =
        coverData.subTitleStyle?.fontFamily ?? DEFAULT_COVER_FONT_FAMILY;
      const subTitleTextStyle = {
        color: swapColor(
          coverData.subTitleStyle?.color ?? DEFAULT_COVER_TEXT_COLOR,
          cardColors ?? DEFAULT_COLOR_PALETTE,
        ),
        fontSize: `${
          scale * (coverData.subTitleStyle?.fontSize ?? DEFAULT_COVER_FONT_SIZE)
        }px`,
      } as const;

      return new ImageResponse(
        (
          <div
            style={{
              display: 'flex',
              width,
              height,
              backgroundColor: 'transparent',
              alignItems:
                keepAspectRatio === 'left_pad' ? 'flex-end' : 'center',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                display: 'flex',
                flex: 1,
              }}
              className={styles.content}
            >
              <div
                style={{
                  backgroundColor: swapColor(
                    coverData.backgroundColor ?? 'light',
                    cardColors ?? DEFAULT_COLOR_PALETTE,
                  ),
                  display: 'flex',
                  height: '100%',
                  width: '100%',
                  maxWidth: imageWidth,
                  position: 'absolute',
                  top: 0,
                  right: 0, // To avoid the text to be on the left with keepAspectRatio
                }}
              />
              <img src={url(width, height)} />
              <div
                style={{
                  display: 'flex',
                  height: '100%',
                  width: '100%',
                  maxWidth: imageWidth,
                  position: 'absolute',
                  top: 0,
                  right: 0, // To avoid the text to be on the left with keepAspectRatio
                  fontSize: '5px',
                  flexDirection: 'column',
                  alignItems: textAlign,
                  justifyContent: overlayJustifyContent,
                  padding: '5%',
                  paddingTop: '30%',
                }}
                className={cx(
                  coverTextStyle.converTextContainer,
                  orientation !== 'horizontal' &&
                    coverTextStyle.converTextContainerVertical,
                  orientation === 'topToBottom' &&
                    coverTextStyle.converTextContainerTopToBottom,
                  orientation === 'bottomToTop' &&
                    coverTextStyle.converTextContainerBottomToTop,
                )}
              >
                <div style={{ fontFamily: titleFontFamily, ...titleTextStyle }}>
                  {coverTitle}
                </div>
                <div
                  style={{
                    fontFamily: subTitleFontFamily,
                    ...subTitleTextStyle,
                  }}
                >
                  {coverSubTitle}
                </div>
              </div>
            </div>
          </div>
        ),
        {
          width,
          height,
        },
      );
    } else {
      return NextResponse.json({ message: ERRORS.NOT_FOUND }, { status: 404 });
    }
  } else {
    if (webCard) {
      return NextResponse.json({ message: ERRORS.FORBIDDEN }, { status: 403 });
    }
    return NextResponse.json({ message: ERRORS.NOT_FOUND }, { status: 404 });
  }
};

import * as Sentry from '@sentry/nextjs';
import { ImageResponse } from 'next/og';
import { NextResponse, type NextRequest } from 'next/server';
import { getWebCardByUserNameWithRedirection } from '@azzapp/data/domains';
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
import coverTextStyle from '#components/renderer/CoverRenderer/CoverTextRenderer.css';
import { CROP, buildCoverImageUrl } from '#helpers/cover';
import { fontsMap } from '#helpers/fonts';
import type { Crop } from '#helpers/cover';

export const runtime = 'edge';

const fontsUrlMap = {
  AmaticSC_Bold:
    'https://cdn.jsdelivr.net/fontsource/fonts/amatic-sc@latest/latin-700-normal.ttf',
  AmaticSC_Regular:
    'https://cdn.jsdelivr.net/fontsource/fonts/amatic-sc@latest/latin-400-normal.ttf',
  Anton_Regular:
    'https://cdn.jsdelivr.net/fontsource/fonts/anton@latest/latin-400-normal.ttf',
  Archivo_Black:
    'https://cdn.jsdelivr.net/fontsource/fonts/archivo-black@latest/latin-400-normal.ttf',
  Archivo_Light:
    'https://cdn.jsdelivr.net/fontsource/fonts/archivo@latest/latin-300-normal.ttf',
  BebasNeue_Regular:
    'https://cdn.jsdelivr.net/fontsource/fonts/bebas-neue@latest/latin-400-normal.ttf',
  Cardo_Regular:
    'https://cdn.jsdelivr.net/fontsource/fonts/cardo@latest/latin-400-normal.ttf',
  Cinzel_Regular:
    'https://cdn.jsdelivr.net/fontsource/fonts/cinzel@latest/latin-400-normal.ttf',
  CormorantGaramond_Bold:
    'https://cdn.jsdelivr.net/fontsource/fonts/cormorant-garamond@latest/latin-700-normal.ttf',
  CourrierPrime_Regular:
    'https://cdn.jsdelivr.net/fontsource/fonts/courier-prime@latest/latin-400-normal.ttf',
  DMSerifDisplay_Regular:
    'https://cdn.jsdelivr.net/fontsource/fonts/dm-serif-display@latest/latin-400-normal.ttf',
  FaunaOne_Regular:
    'https://cdn.jsdelivr.net/fontsource/fonts/fauna-one@latest/latin-400-normal.ttf',
  Fraunces_Light:
    'https://cdn.jsdelivr.net/fontsource/fonts/fraunces@latest/latin-400-normal.ttf',
  GildaDisplay_Regular:
    'https://cdn.jsdelivr.net/fontsource/fonts/gilda-display@latest/latin-400-normal.ttf',
  Gloock_Regular:
    'https://cdn.jsdelivr.net/fontsource/fonts/gloock@latest/latin-400-normal.ttf',
  GreatVibes_Regular:
    'https://cdn.jsdelivr.net/fontsource/fonts/great-vibes@latest/latin-400-normal.ttf',
  Inter_Regular:
    'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.ttf',
  Inter_Medium:
    'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-500-normal.ttf',
  Inter_SemiBold:
    'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-600-normal.ttf',
  Inter_Black:
    'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-900-normal.ttf',
  JosefinSans_Regular:
    'https://cdn.jsdelivr.net/fontsource/fonts/josefin-sans@latest/latin-400-normal.ttf',
  Jost_Regular:
    'https://cdn.jsdelivr.net/fontsource/fonts/jost@latest/latin-400-normal.ttf',
  Kaushan_Regular:
    'https://cdn.jsdelivr.net/fontsource/fonts/kaushan-script@latest/latin-400-normal.ttf',
  Koulen_Regular:
    'https://cdn.jsdelivr.net/fontsource/fonts/koulen@latest/latin-400-normal.ttf',
  Lexend_ExtraBold:
    'https://cdn.jsdelivr.net/fontsource/fonts/lexend@latest/latin-800-normal.ttf',
  LibreBaskerville_Italic:
    'https://cdn.jsdelivr.net/fontsource/fonts/libre-baskerville@latest/latin-400-italic.ttf',
  LibreCaslonDisplay_Regular:
    'https://cdn.jsdelivr.net/fontsource/fonts/libre-caslon-display@latest/latin-400-normal.ttf',
  LibreCaslonText_Regular:
    'https://cdn.jsdelivr.net/fontsource/fonts/libre-caslon-text@latest/latin-400-normal.ttf',
  Limelight_Regular:
    'https://cdn.jsdelivr.net/fontsource/fonts/limelight@latest/latin-400-normal.ttf',
  Lora_Regular:
    'https://cdn.jsdelivr.net/fontsource/fonts/lora@latest/latin-400-normal.ttf',
  Lora_Bold:
    'https://cdn.jsdelivr.net/fontsource/fonts/lora@latest/latin-700-normal.ttf',
  Manrope_ExtraLight:
    'https://cdn.jsdelivr.net/fontsource/fonts/manrope@latest/latin-200-normal.ttf',
  Manrope_Light:
    'https://cdn.jsdelivr.net/fontsource/fonts/manrope@latest/latin-300-normal.ttf',
  Manrope_Regular:
    'https://cdn.jsdelivr.net/fontsource/fonts/manrope@latest/latin-400-normal.ttf',
  Monoton_Regular:
    'https://cdn.jsdelivr.net/fontsource/fonts/monoton@latest/latin-400-normal.ttf',
  Montserrat_Regular:
    'https://cdn.jsdelivr.net/fontsource/fonts/montserrat@latest/latin-400-normal.ttf',
  Montserrat_SemiBold:
    'https://cdn.jsdelivr.net/fontsource/fonts/montserrat@latest/latin-500-normal.ttf',
  MrDafoe_Regular:
    'https://cdn.jsdelivr.net/fontsource/fonts/mr-dafoe@latest/latin-400-normal.ttf',
  OpenSans_Regular:
    'https://cdn.jsdelivr.net/fontsource/fonts/open-sans@latest/latin-400-normal.ttf',
  Outfit_Medium:
    'https://cdn.jsdelivr.net/fontsource/fonts/outfit@latest/latin-500-normal.ttf',
  PlayfairDisplay_Bold:
    'https://cdn.jsdelivr.net/fontsource/fonts/playfair-display@latest/latin-700-normal.ttf',
  'Plus-Jakarta_Light':
    'https://cdn.jsdelivr.net/fontsource/fonts/plus-jakarta-sans@latest/latin-300-normal.ttf',
  'Plus-Jakarta_ExtraBold':
    'https://cdn.jsdelivr.net/fontsource/fonts/plus-jakarta-sans@latest/latin-900-normal.ttf',
  Poppins_Regular:
    'https://cdn.jsdelivr.net/fontsource/fonts/poppins@latest/latin-400-normal.ttf',
  Poppins_SemiBold:
    'https://cdn.jsdelivr.net/fontsource/fonts/poppins@latest/latin-600-normal.ttf',
  Poppins_Bold:
    'https://cdn.jsdelivr.net/fontsource/fonts/poppins@latest/latin-700-normal.ttf',
  Poppins_Black:
    'https://cdn.jsdelivr.net/fontsource/fonts/poppins@latest/latin-900-normal.ttf',
  Raleway_Regular:
    'https://cdn.jsdelivr.net/fontsource/fonts/raleway@latest/latin-400-normal.ttf',
  Rubik_Bold:
    'https://cdn.jsdelivr.net/fontsource/fonts/rubik@latest/latin-700-normal.ttf',
  Righteous_Regular:
    'https://cdn.jsdelivr.net/fontsource/fonts/righteous@latest/latin-400-normal.ttf',
  Rye_Regular:
    'https://cdn.jsdelivr.net/fontsource/fonts/rye@latest/latin-400-normal.ttf',
  SeaweedScript_Regular:
    'https://cdn.jsdelivr.net/fontsource/fonts/seaweed-script@latest/latin-400-normal.ttf',
  SixCaps_Regular:
    'https://cdn.jsdelivr.net/fontsource/fonts/six-caps@latest/latin-400-normal.ttf',
  SourcePro_Regular:
    'https://cdn.jsdelivr.net/fontsource/fonts/source-sans-pro@latest/latin-400-normal.ttf',
  Ultra_Regular:
    'https://cdn.jsdelivr.net/fontsource/fonts/ultra@latest/latin-400-normal.ttf',
  WaterBrush_Regular:
    'https://cdn.jsdelivr.net/fontsource/fonts/water-brush@latest/latin-400-normal.ttf',
  YesevaOne_Regular:
    'https://cdn.jsdelivr.net/fontsource/fonts/yeseva-one@latest/latin-400-normal.ttf',
};

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
  const paramCrop = searchParams.get('crop');

  const crop =
    paramCrop && CROP.includes(paramCrop as Crop) ? (paramCrop as Crop) : null;

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

  const imageWidth = crop === 'lpad' ? height * COVER_RATIO : width;

  const scale = imageWidth / COVER_BASE_WIDTH;

  if (!username) {
    return NextResponse.json({ message: ERRORS.NOT_FOUND }, { status: 404 });
  }

  const webCard = await getWebCardByUserNameWithRedirection(username);

  if (webCard?.cardIsPublished) {
    const { coverData, cardColors, coverTitle, coverSubTitle } = webCard;
    const mediaId = coverData?.mediaId;
    if (mediaId) {
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

      const titleFontData =
        titleFontFamily in fontsUrlMap
          ? await fetch(
              fontsUrlMap[titleFontFamily as keyof typeof fontsUrlMap],
            )
              .then(res => {
                return res.arrayBuffer();
              })
              .catch(err => {
                Sentry.captureException(err);
                return null;
              })
          : null;

      const fonts = [];
      if (titleFontData) {
        fonts.push({
          name: titleFontFamily,
          data: titleFontData,
          style:
            fontsMap[titleFontFamily].style.fontStyle === 'italic'
              ? ('italic' as const)
              : ('normal' as const),
        });
      }

      if (titleFontFamily !== subTitleFontFamily) {
        const subTitleFontData =
          subTitleFontFamily in fontsUrlMap
            ? await fetch(
                fontsUrlMap[subTitleFontFamily as keyof typeof fontsUrlMap],
              )
                .then(res => {
                  return res.arrayBuffer();
                })
                .catch(err => {
                  Sentry.captureException(err);
                  return null;
                })
            : null;

        if (subTitleFontData) {
          fonts.push({
            name: subTitleFontFamily,
            data: subTitleFontData,
            style:
              fontsMap[subTitleFontFamily].style.fontStyle === 'italic'
                ? ('italic' as const)
                : ('normal' as const),
          });
        }
      }

      return new ImageResponse(
        (
          <div
            style={{
              display: 'flex',
              width,
              height,
              backgroundColor: 'transparent',
              alignItems: crop === 'lpad' ? 'flex-end' : 'center',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                display: 'flex',
                flex: 1,
                position: 'relative',
                margin: 'auto',
                overflow: 'hidden',
              }}
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
                  right: 0, // To avoid the text to be on the left with crop
                }}
              />
              <img
                src={await buildCoverImageUrl(webCard, {
                  width,
                  height,
                  crop,
                })}
              />
              <div
                style={{
                  maxWidth: imageWidth,
                  fontSize: '5px',
                  alignItems: textAlign,
                  justifyContent: overlayJustifyContent,
                  paddingTop: '30%',
                  ...coverTextStyle.coverTextContainerStyle,
                  ...(orientation === 'horizontal'
                    ? coverTextStyle.coverTextContainerHorizontalStyle
                    : {}),
                  ...(orientation !== 'horizontal'
                    ? coverTextStyle.coverTextContainerVerticalStyle
                    : {}),
                  ...(orientation === 'topToBottom'
                    ? coverTextStyle.coverTextContainerTopToBottomStyle
                    : {}),
                  ...(orientation === 'bottomToTop'
                    ? coverTextStyle.coverTextContainerBottomToTopStyle
                    : {}),
                }}
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
          fonts,
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

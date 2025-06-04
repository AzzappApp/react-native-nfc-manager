import { notFound } from 'next/navigation';
import { ImageResponse } from 'next/og';
import { NextResponse, type NextRequest } from 'next/server';
import { getWebCardByUserName } from '@azzapp/data';
import { CROP, buildCoverImageUrl } from '@azzapp/service/mediaServices';
import {
  COVER_CARD_RADIUS,
  COVER_MAX_WIDTH,
  COVER_RATIO,
  DEFAULT_COVER_WIDTH,
} from '@azzapp/shared/coverHelpers';
import ERRORS from '@azzapp/shared/errors';
import type { Crop } from '@azzapp/service/mediaServices';

export const runtime = 'edge';

// Fetch both font weights
const fontLight = fetch(
  'https://cdn.jsdelivr.net/fontsource/fonts/plus-jakarta-sans@latest/latin-300-normal.ttf',
)
  .then(res => res.arrayBuffer())
  .catch(() => null);

const fontExtraBold = fetch(
  'https://cdn.jsdelivr.net/fontsource/fonts/plus-jakarta-sans@latest/latin-800-normal.ttf',
)
  .then(res => res.arrayBuffer())
  .catch(() => null);

export const GET = async (
  req: NextRequest,
  props: {
    params: Promise<{ userName: string }>;
  },
) => {
  const params = await props.params;

  const { userName } = params;

  const [lightFontData, extraBoldFontData] = await Promise.all([
    fontLight,
    fontExtraBold,
  ]);

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
  } else if (foundHeight && !foundWidth) {
    height = foundHeight;
    width = foundHeight * COVER_RATIO;
  } else if (foundWidth && !foundHeight) {
    width = foundWidth;
    height = foundWidth / COVER_RATIO;
  }

  if (!width) {
    width = COVER_MAX_WIDTH;
  }

  if (!height) {
    height = width / COVER_RATIO;
  }

  const imageWidth = Math.round(height * COVER_RATIO);

  if (!userName) {
    return NextResponse.json({ message: ERRORS.NOT_FOUND }, { status: 404 });
  }

  const webCard = await getWebCardByUserName(userName);

  if (!webCard) {
    return NextResponse.json({ message: ERRORS.NOT_FOUND }, { status: 404 });
  }

  const scale = imageWidth / DEFAULT_COVER_WIDTH;

  const {
    coverIsPredefined,
    webCardKind,
    companyName,
    firstName,
    companyActivityLabel,
    lastName,
    coverMediaId,
    cardIsPublished,
  } = webCard;

  if (!cardIsPublished || !coverMediaId) {
    return notFound();
  }

  const isBusiness = webCardKind === 'business';
  const overlayTitle = coverIsPredefined
    ? isBusiness
      ? companyName
      : firstName
    : undefined;

  const overlaySubTitle = coverIsPredefined
    ? isBusiness
      ? companyActivityLabel
      : lastName
    : undefined;

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
            maxWidth: imageWidth,
          }}
        >
          <img
            src={await buildCoverImageUrl(webCard, {
              width: imageWidth,
              height,
              crop: 'fit',
              radius: COVER_CARD_RADIUS * 100,
            })}
          />

          {overlayTitle && (
            <div
              style={{
                fontFamily: 'Plus Jakarta Sans',
                fontWeight: 300,
                color: 'white',
                fontSize: `${scale * 19}px`,
                position: 'absolute',
                left: '22%',
                top: '45.5%',
                textOverflow: 'ellipsis',
                maxLines: 1,
                overflow: 'hidden',
              }}
            >
              {overlayTitle}
            </div>
          )}
          {overlaySubTitle && (
            <div
              style={{
                fontFamily: 'Plus Jakarta Sans',
                fontWeight: 800,
                color: 'white',
                fontSize: `${scale * 27}px`,
                position: 'absolute',
                left: '22%',
                top: '49%',
                maxLines: 1,
                textOverflow: 'ellipsis',
                overflow: 'hidden',
              }}
            >
              {overlaySubTitle}
            </div>
          )}
        </div>
      </div>
    ),
    {
      width,
      height,
      fonts: [
        lightFontData &&
          ({
            name: 'Plus Jakarta Sans',
            data: lightFontData,
            weight: 300,
            style: 'normal',
          } as const),
        extraBoldFontData &&
          ({
            name: 'Plus Jakarta Sans',
            data: extraBoldFontData,
            weight: 800,
            style: 'normal',
          } as const),
      ].filter(font => font !== null),
    },
  );
};

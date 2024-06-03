import { ImageResponse } from 'next/og';
import { NextResponse, type NextRequest } from 'next/server';
import { getProfile, getWebCardByUserNameWithRedirection } from '@azzapp/data';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  COVER_MEDIA_RESOLUTION,
  COVER_RATIO,
} from '@azzapp/shared/coverHelpers';
import ERRORS from '@azzapp/shared/errors';
import { CROP, buildCoverImageUrl } from '#helpers/cover';
import { verifyToken } from '#helpers/tokens';
import type { Crop } from '#helpers/cover';

export const runtime = 'edge';

const USER_MANAGER_COOKIE_NAME = '@azzapp/users-manager/session';

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
    width = COVER_MEDIA_RESOLUTION.width;
  }

  if (!height) {
    height = width / COVER_RATIO;
  }

  const imageWidth = Math.round(height * COVER_RATIO);

  if (!username) {
    return NextResponse.json({ message: ERRORS.NOT_FOUND }, { status: 404 });
  }

  const webCard = await getWebCardByUserNameWithRedirection(username);

  if (!webCard) {
    return NextResponse.json({ message: ERRORS.NOT_FOUND }, { status: 404 });
  }

  let displayCover = webCard.cardIsPublished;
  try {
    const cookie = req.cookies.get(USER_MANAGER_COOKIE_NAME);
    if (cookie) {
      const { token } = JSON.parse(cookie.value);
      const { userId } = await verifyToken(token);

      const profile = await getProfile(userId, webCard.id);
      if (profile) {
        displayCover = !profile.invited;
      }
    }
  } catch (e) {
    console.error(e);
  }

  if (displayCover) {
    const { coverMediaId, coverBackgroundColor, coverTexts, cardColors } =
      webCard;
    if (coverMediaId) {
      return new ImageResponse(
        (
          <div
            style={{
              display: 'flex',
              width,
              height,
              backgroundColor: swapColor(
                coverBackgroundColor,
                cardColors,
              ) as any,
              alignItems: crop === 'lpad' ? 'flex-end' : 'center',
              flexDirection: 'column',
            }}
          >
            <img
              src={await buildCoverImageUrl(webCard, {
                width: imageWidth,
                height,
                crop: 'fit',
              })}
              alt={coverTexts?.join(' ') ?? ''}
            />
          </div>
        ),
        {
          width,
          height,
        },
      );
    } else {
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
              <svg
                height="100%"
                width="100%"
                viewBox="0 0 221 332"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g>
                  <rect width="100%" height="100%" fill="black" />
                  <path
                    opacity="0.2"
                    d="M110.5 188C113.52 188 116.442 187.582 119.212 186.8C121.132 186.258 123.245 186.959 124.242 188.686L126.534 192.657C121.626 194.807 116.202 196 110.5 196C88.4086 196 70.5 178.091 70.5 156C70.5 133.909 88.4086 116 110.5 116C132.591 116 150.5 133.909 150.5 156C150.5 169.529 143.784 181.489 133.504 188.728L110.764 149.357L102.31 164C100.881 166.475 98.2398 168 95.3817 168H90.7629L110.764 133.357L135.425 176.071C139.851 170.581 142.5 163.6 142.5 156C142.5 138.327 128.173 124 110.5 124C92.8269 124 78.5 138.327 78.5 156C78.5 173.673 92.8269 188 110.5 188Z"
                    fill="white"
                  />
                </g>
              </svg>
            </div>
          </div>
        ),
        {
          width,
          height,
        },
      );
    }
  } else {
    return NextResponse.json({ message: ERRORS.FORBIDDEN }, { status: 403 });
  }
};

/* eslint-disable no-bitwise */
import { createId } from '@paralleldrive/cuid2';
import { NextResponse } from 'next/server';
import { createMedia } from '@azzapp/data/domains';
import { MODULE_IMAGES_SIZES } from '@azzapp/shared/cardModuleHelpers';
import { createPresignedUpload } from '@azzapp/shared/cloudinaryHelpers';
import { COVER_ASSET_SIZES } from '@azzapp/shared/coverHelpers';
import ERRORS from '@azzapp/shared/errors';
import {
  POST_IMAGES_SIZES,
  POST_VIDEO_SIZES,
} from '@azzapp/shared/postHelpers';
import cors from '#helpers/cors';
import { getSessionData } from '#helpers/tokens';
import type { SessionData } from '#helpers/tokens';

const uploadSignApi = async (req: Request) => {
  let viewer: SessionData | null = null;
  try {
    viewer = await getSessionData();

    if (!viewer?.userId) {
      return NextResponse.json(
        { message: ERRORS.UNAUTHORIZED },
        { status: 401 },
      );
    }
  } catch (e) {
    if (e instanceof Error && e.message === ERRORS.INVALID_TOKEN) {
      return NextResponse.json({ message: e.message }, { status: 401 });
    }
    return NextResponse.json(
      { message: ERRORS.INVALID_REQUEST },
      { status: 400 },
    );
  }

  const {
    kind,
    target,
  }: {
    kind: 'image' | 'video';
    target: 'cover' | 'coverSource' | 'module' | 'post';
  } = await req.json();

  if (
    (kind !== 'image' && kind !== 'video') ||
    (target !== 'cover' &&
      target !== 'post' &&
      target !== 'module' &&
      target !== 'coverSource')
  ) {
    return NextResponse.json(
      { message: ERRORS.INVALID_REQUEST },
      { status: 400 },
    );
  }

  const mediaId = createId();
  await createMedia({
    id: mediaId,
    kind,
    height: 0,
    width: 0,
  });
  const pregeneratedSizes =
    target === 'coverSource'
      ? null
      : target === 'cover'
      ? COVER_ASSET_SIZES
      : target === 'module'
      ? MODULE_IMAGES_SIZES
      : kind === 'image'
      ? POST_IMAGES_SIZES
      : POST_VIDEO_SIZES;

  const { uploadParameters, uploadURL } = await createPresignedUpload(
    mediaId,
    kind,
    pregeneratedSizes,
    `userId=${viewer.userId}`,
  );
  return NextResponse.json({ uploadURL, uploadParameters });
};

export const { POST, OPTIONS } = cors({ POST: uploadSignApi });

export const runtime = 'edge';

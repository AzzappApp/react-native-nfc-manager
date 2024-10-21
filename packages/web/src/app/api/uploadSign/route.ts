import { NextResponse } from 'next/server';
import * as z from 'zod';
import { createMedia, createId } from '@azzapp/data';
import { MODULE_IMAGES_SIZES } from '@azzapp/shared/cardModuleHelpers';
import { createPresignedUpload } from '@azzapp/shared/cloudinaryHelpers';
import { COVER_ASSET_SIZES } from '@azzapp/shared/coverHelpers';
import ERRORS from '@azzapp/shared/errors';
import { encodeMediaId } from '@azzapp/shared/imagesHelpers';
import {
  POST_IMAGES_SIZES,
  POST_VIDEO_SIZES,
} from '@azzapp/shared/postHelpers';
import cors from '#helpers/cors';
import { withPluginsRoute } from '#helpers/queries';
import { getSessionData } from '#helpers/tokens';
import type { SessionData } from '#helpers/tokens';

const UploadSignSchema = z.object({
  kind: z.enum(['image', 'video']),
  target: z.enum(['cover', 'rawCover', 'module', 'post', 'avatar', 'logo']),
});

type uploadSignParams = z.infer<typeof UploadSignSchema>;

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

  const body = await req.json();
  const input = UploadSignSchema.parse(body);

  const { kind } = input;

  const mediaId = encodeMediaId(createId(), kind);
  await createMedia({
    id: mediaId,
    kind,
    height: 0,
    width: 0,
  });

  const { uploadParameters, uploadURL } = await createPresignedUpload(
    mediaId,
    kind,
    getAspectRatio(input),
    getPregeneratedSizes(input),
    `userId=${viewer.userId}`,
  );
  return NextResponse.json({ uploadURL, uploadParameters });
};

const getAspectRatio = (body: uploadSignParams) => {
  switch (body.target) {
    case 'avatar':
      return '1.0';
    case 'rawCover':
      return '0.625';
    default:
      return null;
  }
};

const getPregeneratedSizes = (body: uploadSignParams) => {
  switch (body.target) {
    case 'cover':
      return COVER_ASSET_SIZES;
    case 'module':
      return MODULE_IMAGES_SIZES;
    case 'post':
      return body.kind === 'image' ? POST_IMAGES_SIZES : POST_VIDEO_SIZES;
    default:
      return null;
  }
};

export const { POST, OPTIONS } = cors({
  POST: withPluginsRoute(uploadSignApi),
});

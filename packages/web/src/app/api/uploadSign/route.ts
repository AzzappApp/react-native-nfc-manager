/* eslint-disable no-bitwise */
import { createId } from '@paralleldrive/cuid2';
import { NextResponse } from 'next/server';
import { createMedia } from '@azzapp/data/domains';
import { createPresignedUpload } from '@azzapp/shared/cloudinaryHelpers';
import ERRORS from '@azzapp/shared/errors';
import cors from '#helpers/cors';
import { getSessionData } from '#helpers/tokens';
import type { SessionData } from '#helpers/tokens';

const uploadSignApi = async (req: Request) => {
  let viewer: SessionData | null = null;
  try {
    viewer = await getSessionData();

    if (!viewer?.userId) {
      return NextResponse.json(
        { message: ERRORS.UNAUTORIZED },
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
    target: 'cover' | 'post';
  } = await req.json();

  if (
    (kind !== 'image' && kind !== 'video') ||
    (target !== 'cover' && target !== 'post')
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
  const { uploadParameters, uploadURL } = await createPresignedUpload(
    mediaId,
    kind,
  );
  return NextResponse.json({ uploadURL, uploadParameters });
};

export const { POST, OPTIONS } = cors({ POST: uploadSignApi });

export const runtime = 'edge';

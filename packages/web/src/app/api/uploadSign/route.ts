/* eslint-disable no-bitwise */
import { createId } from '@paralleldrive/cuid2';
import { NextResponse } from 'next/server';
import ERRORS from '@azzapp/shared/errors';
import { getCrypto } from '#helpers/cryptoHelpers';
import { getViewerInfos } from '#helpers/sessionHelpers';
import type { Viewer } from '@azzapp/data/domains';

const CLOUDINARY_CLOUDNAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY!;
const CLOUDINARY_BASE_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUDNAME}`;

export const POST = async (req: Request) => {
  let viewer: Viewer;
  try {
    viewer = await getViewerInfos();
    if (viewer.isAnonymous) {
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

  const uploadURL: string =
    kind === 'image'
      ? `${CLOUDINARY_BASE_URL}/image/upload`
      : `${CLOUDINARY_BASE_URL}/video/upload`;
  const uploadParameters: Record<string, any> = {
    timestamp: Math.round(Date.now() / 1000),
    public_id: createId(),
    context: `author=${viewer.profileId}|target=${target}`,
  };

  // TODO transformations

  Object.assign(uploadParameters, {
    signature: await apiSinRequest(
      uploadParameters,
      process.env.CLOUDINARY_API_SECRET!,
    ),
    api_key: CLOUDINARY_API_KEY,
  });

  return NextResponse.json({ uploadURL, uploadParameters });
};

// TODO blocked by https://github.com/vercel/next.js/issues/46755 and by https://github.com/vercel/next.js/issues/46337
//export const runtime = 'edge';

// extracted from Cloudinary SDK to avoid importing the whole SDK
// which has edge runtime issues

const apiSinRequest = (paramsToSign: object, apiSecret: string) => {
  const toSign = Object.entries(paramsToSign)
    .filter(([, value]) => value != null && `${value}`.length > 0)
    .map(([key, value]) => `${key}=${toArray(value).join(',')}`)
    .sort()
    .join('&');
  return digestMessage(toSign + apiSecret);
};

function toArray(value: string[] | string): string[] {
  if (value == null) {
    return [];
  } else if (Array.isArray(value)) {
    return value;
  } else {
    return [value];
  }
}

async function digestMessage(message: string) {
  const msgUint8 = new TextEncoder().encode(message); // encode as (utf-8) Uint8Array
  const hashBuffer = await getCrypto().subtle.digest('SHA-1', msgUint8); // hash the message
  const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
  return hashHex;
}

import { v2 as Cloudinary } from 'cloudinary';
import cuid from 'cuid';
import ERRORS from '@azzapp/shared/errors';
import { getRequestAuthInfos, withSessionAPIRoute } from '#helpers/session';
import type { Viewer } from '@azzapp/data/domains';
import type { NextApiRequest, NextApiResponse } from 'next';

const CLOUDINARY_CLOUDNAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY!;
const CLOUDINARY_BASE_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUDNAME}`;

const uploadSign = async (req: NextApiRequest, res: NextApiResponse) => {
  let authInfos: Viewer;
  try {
    authInfos = await getRequestAuthInfos(req);
    if (authInfos.isAnonymous) {
      res.status(401).send({ message: ERRORS.UNAUTORIZED });
      return;
    }
  } catch (e) {
    if (e instanceof Error && e.message === ERRORS.INVALID_TOKEN) {
      res.status(401).send({ message: e.message });
      return;
    }
    res.status(400).send({ message: ERRORS.INVALID_REQUEST });
    return;
  }
  const {
    kind,
    target,
  }: {
    kind: 'image' | 'video';
    target: 'cover' | 'post';
  } = req.body;

  if (
    (kind !== 'image' && kind !== 'video') ||
    (target !== 'cover' && target !== 'post')
  ) {
    res.status(400).send({ message: ERRORS.INVALID_REQUEST });
    return;
  }

  const uploadURL: string =
    kind === 'image'
      ? `${CLOUDINARY_BASE_URL}/image/upload`
      : `${CLOUDINARY_BASE_URL}/video/upload`;
  const uploadParameters: Record<string, any> = {
    timestamp: Math.round(Date.now() / 1000),
    public_id: cuid(),
    context: `author=${authInfos.profileId}|target=${target}`,
  };

  // TODO transformations

  Object.assign(uploadParameters, {
    signature: Cloudinary.utils.api_sign_request(
      uploadParameters,
      process.env.CLOUDINARY_API_SECRET!,
    ),
    api_key: CLOUDINARY_API_KEY,
  });

  res.json({ uploadURL, uploadParameters });
};

export default withSessionAPIRoute(uploadSign);

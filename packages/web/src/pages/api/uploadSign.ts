import ERRORS from '@azzapp/shared/lib/errors';
import { getCoverFormat } from '@azzapp/shared/lib/imagesFormats';
import { v2 as Cloudinary } from 'cloudinary';
import cuid from 'cuid';
import range from 'lodash/range';
import {
  getRequestAuthInfos,
  withSessionAPIRoute,
} from '../../helpers/session';
import type { NextApiRequest, NextApiResponse } from 'next';

const uploadSign = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const authInfos = await getRequestAuthInfos(req);
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
    kind: 'picture' | 'video';
    target: 'cover' | 'post';
  } = req.body;

  if (
    (kind !== 'picture' && kind !== 'video') ||
    (target !== 'cover' && target !== 'post')
  ) {
    res.status(400).send({ message: ERRORS.INVALID_REQUEST });
    return;
  }

  let uploadOptions: any;
  let signature: string;
  if (target === 'cover') {
    const timestamp = Math.round(Date.now() / 1000);
    if (kind === 'picture') {
      const publicId = `pictures/${cuid()}`;
      uploadOptions = {
        timestamp,
        public_id: publicId,
        eager: range(1, 14)
          .map(getCoverFormat)
          .map(({ width, height }) => `c_fill,w_${width},h_${height}`)
          .join('|'),
        eager_async: true,
        // TODO
        // allowed_formats
        // moderation
      };
    } else {
      const publicId = `videos/${cuid()}`;
      uploadOptions = {
        timestamp,
        public_id: publicId,
        // eager: ['format=mp4'],
      };
    }
    signature = Cloudinary.utils.api_sign_request(
      uploadOptions,
      process.env.CLOUDINARY_API_SECRET!,
    );
  } else {
    res.status(400).send({ message: 'NOT_IMPLEMENTED' });
    return;
  }

  res.json({ ...uploadOptions, signature });
};

export default withSessionAPIRoute(uploadSign);

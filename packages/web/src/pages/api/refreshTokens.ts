import ERRORS from '@azzapp/shared/errors';
import { refreshTokens } from '#helpers/tokensHelpers';
import type { NextApiRequest, NextApiResponse } from 'next';

const refreshTokensApi = async (req: NextApiRequest, res: NextApiResponse) => {
  if (!req.body.refreshToken) {
    res.status(400).json({ message: ERRORS.INVALID_REQUEST });
    return;
  }
  try {
    const { refreshToken, token } = refreshTokens(req.body.refreshToken);
    res.json({ ok: true, token, refreshToken });
  } catch (e) {
    res.status(401).json({ message: ERRORS.UNAUTORIZED_INVALID_ACCESS_TOKEN });
  }
};

export default refreshTokensApi;

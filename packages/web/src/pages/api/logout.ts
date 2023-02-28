import { withSessionAPIRoute } from '#helpers/session';
import type { NextApiRequest, NextApiResponse } from 'next';

const logout = async (req: NextApiRequest, res: NextApiResponse) => {
  if (!req.session.isAnonymous) {
    req.session.destroy();
  }
  res.json({ ok: true });
};

export default withSessionAPIRoute(logout);

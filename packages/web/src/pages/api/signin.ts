import {
  getUserByEmail,
  getUserByUserName,
} from '@azzapp/data/lib/domains/User';
import ERRORS from '@azzapp/shared/lib/errors';
import bcrypt from 'bcrypt';
import { withSessionAPIRoute } from '../../helpers/session';
import { generateTokens } from '../../helpers/tokensHelpers';
import type { NextApiRequest, NextApiResponse } from 'next';

type SignInBody = {
  userNameOrEmail?: string;
  password?: string;
  authMethod?: 'cookie' | 'token';
};

const signin = async (req: NextApiRequest, res: NextApiResponse) => {
  const { userNameOrEmail, password, authMethod } =
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    <SignInBody>req.body || {};

  if (!userNameOrEmail || !password) {
    res.status(400).json({ message: ERRORS.INVALID_REQUEST });
    return;
  }
  try {
    const user =
      (await getUserByEmail(userNameOrEmail)) ??
      (await getUserByUserName(userNameOrEmail));
    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ message: ERRORS.INVALID_CREDENTIALS });
      return;
    }
    if (authMethod === 'token') {
      req.session.destroy();
      const { token, refreshToken } = generateTokens(user.id);
      res.json({ ok: true, token, refreshToken });
    } else {
      req.session.userId = user.id;
      req.session.isAnonymous = false;
      await req.session.save();
      res.json({ ok: true });
    }
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export default withSessionAPIRoute(signin);

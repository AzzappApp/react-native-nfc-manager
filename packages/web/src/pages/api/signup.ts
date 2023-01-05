import {
  createUser,
  getUserByEmail,
  getUserByUserName,
} from '@azzapp/data/lib/domains';
import ERRORS from '@azzapp/shared/lib/errors';
import bcrypt from 'bcrypt';
import { withSessionAPIRoute } from '../../helpers/session';
import { generateTokens } from '../../helpers/tokensHelpers';
import type { NextApiRequest, NextApiResponse } from 'next';

type SignupBody = {
  userName?: string;
  email?: string;
  password?: string;
  locale?: string;
  firstName?: string;
  lastName?: string;
  authMethod?: 'cookie' | 'token';
};

const signup = async (req: NextApiRequest, res: NextApiResponse) => {
  const { email, userName, password, firstName, lastName, authMethod } =
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    <SignupBody>req.body || {};

  if (!email || !userName || !password) {
    res.status(400).json({ message: ERRORS.INVALID_REQUEST });
    return;
  }
  try {
    if (await getUserByEmail(email)) {
      res.status(400).json({ message: ERRORS.EMAIL_ALREADY_EXISTS });
      return;
    }
    if (await getUserByUserName(userName)) {
      res.status(400).json({ message: ERRORS.USERNAME_ALREADY_EXISTS });
      return;
    }

    const user = await createUser({
      userName,
      email,
      password: await bcrypt.hash(password, 12),
      firstName: firstName ?? '',
      lastName: lastName ?? '',
    });

    if (authMethod === 'token') {
      req.session.destroy();
      const { token, refreshToken } = generateTokens(user.id);
      res.json({ token, refreshToken });
    } else {
      req.session.userId = user.id;
      req.session.isAnonymous = false;
      await req.session.save();
      res.json({});
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: (error as Error).message });
  }
};

export default withSessionAPIRoute(signup);

import {
  createUser,
  getUserByEmail,
  getUserByPhoneNumber,
  getProfileByUserName,
  createProfile,
} from '@azzapp/data/lib/domains';
import ERRORS from '@azzapp/shared/lib/errors';
import {
  isInternationalPhoneNumber,
  isValidEmail,
} from '@azzapp/shared/lib/stringHelpers';
import bcrypt from 'bcrypt';
import { withSessionAPIRoute } from '../../helpers/session';
import { generateTokens } from '../../helpers/tokensHelpers';
import type { NextApiRequest, NextApiResponse } from 'next';

type SignupBody = {
  userName: string;
  email: string | null;
  phoneNumber: string | null;
  password?: string;
  locale?: string;
  firstName?: string;
  lastName?: string;
  authMethod?: 'cookie' | 'token';
};

const signup = async (req: NextApiRequest, res: NextApiResponse) => {
  const { email, userName, phoneNumber, password, authMethod } =
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    <SignupBody>req.body || {};

  //we need at least one email or one phone number
  if (!(email || phoneNumber) || !userName || !password) {
    res.status(400).json({ message: ERRORS.INVALID_REQUEST });
    return;
  }

  try {
    if (email != null) {
      if (!isValidEmail(email)) {
        res.status(400).json({ message: ERRORS.EMAIL_NOT_VALID });
        return;
      }
      if (await getUserByEmail(email)) {
        res.status(400).json({ message: ERRORS.EMAIL_ALREADY_EXISTS });
        return;
      }
    }

    if (isInternationalPhoneNumber(phoneNumber)) {
      if (await getUserByPhoneNumber(phoneNumber!)) {
        res.status(400).json({ message: ERRORS.PHONENUMBER_ALREADY_EXISTS });
        return;
      }
    }
    if (await getProfileByUserName(userName)) {
      res.status(400).json({ message: ERRORS.USERNAME_ALREADY_EXISTS });
      return;
    }

    const user = await createUser({
      email,
      phoneNumber,
      password: await bcrypt.hash(password, 12),
    });

    const profile = await createProfile({
      userId: user.id,
      userName,
      firstName: null,
      lastName: null,
      companyActivityId: null,
      companyName: null,
      profileKind: null,
      isReady: false,
    });

    if (authMethod === 'token') {
      req.session.destroy();
      const { token, refreshToken } = generateTokens({
        userId: user.id,
        profileId: profile.id,
      });
      res.json({ token, refreshToken });
    } else {
      req.session.userId = user.id;
      req.session.profileId = profile.id;
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

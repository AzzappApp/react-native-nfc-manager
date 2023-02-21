import {
  getUserByEmail,
  getUserByPhoneNumber,
  getProfileByUserName,
  getUsersByIds,
  getUserProfiles,
} from '@azzapp/data/lib/domains';
import ERRORS from '@azzapp/shared/lib/errors';
import {
  isInternationalPhoneNumber,
  isValidEmail,
} from '@azzapp/shared/lib/stringHelpers';
import bcrypt from 'bcrypt';
import { withSessionAPIRoute } from '../../helpers/session';
import { generateTokens } from '../../helpers/tokensHelpers';
import type { Profile, User } from '@azzapp/data/lib/domains';
import type { NextApiRequest, NextApiResponse } from 'next';

type SignInBody = {
  credential?: string; //email or username or phone number
  password?: string;
  authMethod?: 'cookie' | 'token';
};

const signin = async (req: NextApiRequest, res: NextApiResponse) => {
  const { credential, password, authMethod } =
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    <SignInBody>req.body || {};

  if (!credential || !password) {
    res.status(400).json({ message: ERRORS.INVALID_REQUEST });
    return;
  }
  try {
    let user: User | null = null;
    let profile: Profile | null = null;
    if (isValidEmail(credential)) {
      // looking for email only if the credential is a valid email
      user = await getUserByEmail(credential);
    }
    if (!user && isInternationalPhoneNumber(credential)) {
      // looking for phonenumber only if the credential is a valid phonenumber
      user = await getUserByPhoneNumber(credential);
    }
    if (user) {
      // if we found a user by email or phonenumber, we look for the profile
      [profile] = await getUserProfiles(user.id);
    } else {
      // in all other case, look for username
      profile = await getProfileByUserName(credential);
      [user] = profile ? await getUsersByIds([profile.userId]) : [];
    }

    if (!user || !profile || !user.password) {
      res.status(401).json({ message: ERRORS.INVALID_CREDENTIALS });
      return;
    }

    if (!(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ message: ERRORS.INVALID_CREDENTIALS });
      return;
    }

    if (authMethod === 'token') {
      req.session.destroy();
      const { token, refreshToken } = generateTokens({
        userId: user.id,
        profileId: profile.id,
      });
      res.json({ ok: true, token, refreshToken });
    } else {
      req.session.userId = user.id;
      req.session.profileId = profile.id;
      req.session.isAnonymous = false;
      await req.session.save();
      res.json({ ok: true });
    }
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export default withSessionAPIRoute(signin);

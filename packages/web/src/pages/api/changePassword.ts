import { getUserByEmail, getUserByPhoneNumber } from '@azzapp/data/lib/domains';
import ERRORS from '@azzapp/shared/lib/errors';
import {
  isInternationalPhoneNumber,
  isValidEmail,
} from '@azzapp/shared/lib/stringHelpers';
import { withSessionAPIRoute } from '../../helpers/session';
import type { NextApiRequest, NextApiResponse } from 'next';

type ChangePasswordBody = {
  password: string;
  credential: string;
  token: string;
};

const changePassword = async (req: NextApiRequest, res: NextApiResponse) => {
  const { credential } =
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    <ChangePasswordBody>req.body || {};
  //we need at least one email or one phone number
  if (!credential) {
    res.status(400).json({ message: ERRORS.INVALID_REQUEST });
    return;
  }
  try {
    let user;
    if (!isValidEmail(credential)) {
      user = await getUserByEmail(credential);
    }
    if (user == null && isInternationalPhoneNumber(credential)) {
      user = await getUserByPhoneNumber(credential);
    }
    if (user == null) {
      res.status(400).json({ message: ERRORS.USER_NOT_FOUND });
      return;
    }
    //TODO: check if token matches and validUntil is not expired before updating the password
    res.json({ ok: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: (error as Error).message });
  }
};

export default withSessionAPIRoute(changePassword);

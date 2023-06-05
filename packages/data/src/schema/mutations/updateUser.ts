import * as bcrypt from 'bcrypt-ts';
import ERRORS from '@azzapp/shared/errors';
import {
  getUserByEmail,
  getUserByPhoneNumber,
  getUsersByIds,
  updateUser,
} from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';
import type { User } from '@prisma/client';

const updateUserMutation: MutationResolvers['updateUser'] = async (
  _,
  args,
  { auth },
) => {
  if (auth.isAnonymous) {
    return null;
  }

  const userId = auth.userId;

  const { email, phoneNumber, currentPassword, newPassword } = args.input;

  const partialUser: Partial<User> = {};

  if (email) {
    const exisitingUser = await getUserByEmail(email);
    if (exisitingUser && exisitingUser.id !== userId) {
      throw new Error(ERRORS.EMAIL_ALREADY_EXISTS);
    }
    partialUser.email = email;
  }

  if (phoneNumber) {
    const exisitingUser = await getUserByPhoneNumber(phoneNumber);
    if (exisitingUser && exisitingUser.id !== userId) {
      throw new Error(ERRORS.PHONENUMBER_ALREADY_EXISTS);
    }
    partialUser.phoneNumber = phoneNumber;
  }

  const [dbUser] = await getUsersByIds([userId]);

  if (!dbUser) {
    throw new Error(ERRORS.USER_NOT_FOUND);
  }

  if (newPassword) {
    if (
      !currentPassword ||
      !dbUser.password ||
      !bcrypt.compareSync(currentPassword, dbUser.password)
    ) {
      throw new Error(ERRORS.INVALID_CREDENTIALS);
    }

    partialUser.password = bcrypt.hashSync(newPassword, 12);
  }

  try {
    const result = await updateUser(userId, partialUser);

    return { user: { ...dbUser, ...result } };
  } catch (error) {
    throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
  }
};

export default updateUserMutation;

import * as bcrypt from 'bcrypt-ts';
import { GraphQLError } from 'graphql';
import {
  getUserByEmail,
  getUserByPhoneNumber,
  transaction,
  updateUser,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import {
  formatPhoneNumber,
  isInternationalPhoneNumber,
} from '@azzapp/shared/stringHelpers';
import { validateMailOrPhone } from '#externals';
import { getSessionInfos } from '#GraphQLContext';
import { userLoader } from '#loaders';
import type { MutationResolvers } from '#/__generated__/types';
import type { User } from '@azzapp/data';

const updateUserMutation: MutationResolvers['updateUser'] = async (_, args) => {
  const { userId } = getSessionInfos();
  if (!userId) {
    return null;
  }

  const { email, phoneNumber, currentPassword, newPassword, token } =
    args.input;

  const partialUser: Partial<User> = {};

  const dbUser = await userLoader.load(userId);
  if (!dbUser) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  if (phoneNumber && phoneNumber !== dbUser.phoneNumber) {
    if (!token) {
      throw new GraphQLError(ERRORS.INVALID_TOKEN);
    }
    try {
      await validateMailOrPhone('phone', phoneNumber, token);
      partialUser.phoneNumberConfirmed = true;
    } catch {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }
  }

  if (email && email !== dbUser.email) {
    if (!token) {
      throw new GraphQLError(ERRORS.INVALID_TOKEN);
    }

    try {
      await validateMailOrPhone('email', email, token);
      partialUser.emailConfirmed = true;
    } catch {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }
  }
  let existingUser: User | null = null;
  let commonInfo: 'both' | 'email' | 'none' | 'phone' = 'none';
  if (email) {
    existingUser = await getUserByEmail(email);
    if (existingUser && existingUser.id !== userId && !existingUser.deleted) {
      throw new GraphQLError(ERRORS.EMAIL_ALREADY_EXISTS);
    }
    commonInfo = 'email';
    partialUser.email = email;
  }

  if (email === null) {
    //voluntary remove email
    partialUser.email = null;
  }

  if (phoneNumber && isInternationalPhoneNumber(phoneNumber)) {
    existingUser = await getUserByPhoneNumber(formatPhoneNumber(phoneNumber));
    if (existingUser && existingUser.id !== userId && !existingUser.deleted) {
      throw new GraphQLError(ERRORS.PHONENUMBER_ALREADY_EXISTS);
    }
    commonInfo = commonInfo === 'email' ? 'both' : 'phone';
    partialUser.phoneNumber = formatPhoneNumber(phoneNumber);
  }
  if (phoneNumber === null) {
    //voluntary remove phone number
    partialUser.phoneNumber = null;
  }

  if (newPassword) {
    if (
      !currentPassword ||
      !dbUser.password ||
      !bcrypt.compareSync(currentPassword, dbUser.password)
    ) {
      throw new GraphQLError(ERRORS.INVALID_CREDENTIALS);
    }

    partialUser.password = bcrypt.hashSync(newPassword, 12);
  }

  const mergedUser = { ...dbUser, ...partialUser };
  if (!mergedUser.email && !mergedUser.phoneNumber) {
    //user should have at least one email or one phone number
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  try {
    await transaction(async () => {
      if (existingUser) {
        await updateUser(existingUser.id, {
          email:
            commonInfo === 'email' || commonInfo === 'both'
              ? null
              : existingUser.email,
          phoneNumber:
            commonInfo === 'phone' || commonInfo === 'both'
              ? null
              : existingUser.phoneNumber,
          replacedBy: existingUser.replacedBy ?? userId,
        });
      }
      await updateUser(userId, partialUser);
    });

    return { user: { ...dbUser, ...partialUser } };
  } catch {
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }
};

export default updateUserMutation;

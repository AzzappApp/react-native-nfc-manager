import * as bcrypt from 'bcrypt-ts/node';
import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import {
  formatPhoneNumber,
  isInternationalPhoneNumber,
} from '@azzapp/shared/stringHelpers';
import { getUserByEmail, getUserByPhoneNumber, updateUser } from '#domains';
import type { User } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const updateUserMutation: MutationResolvers['updateUser'] = async (
  _,
  args,
  { auth, loaders },
) => {
  const userId = auth.userId;
  if (!userId) {
    return null;
  }

  const { email, phoneNumber, currentPassword, newPassword } = args.input;

  const partialUser: Partial<User> = {};

  if (email) {
    const existingUser = await getUserByEmail(email);
    if (existingUser && existingUser.id !== userId) {
      throw new GraphQLError(ERRORS.EMAIL_ALREADY_EXISTS);
    }
    partialUser.email = email;
  }

  if (email === null) {
    //voluntary remove email
    partialUser.email = null;
  }

  if (phoneNumber && isInternationalPhoneNumber(phoneNumber)) {
    const existingUser = await getUserByPhoneNumber(
      formatPhoneNumber(phoneNumber),
    );
    if (existingUser && existingUser.id !== userId) {
      throw new GraphQLError(ERRORS.PHONENUMBER_ALREADY_EXISTS);
    }
    partialUser.phoneNumber = phoneNumber?.replace(/\s/g, '');
  }
  if (phoneNumber === null) {
    //voluntary remove phone number
    partialUser.phoneNumber = null;
  }

  const dbUser = await loaders.User.load(userId);

  if (!dbUser) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
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
    await updateUser(userId, partialUser);

    return { user: { ...dbUser, ...partialUser } };
  } catch (error) {
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }
};

export default updateUserMutation;
